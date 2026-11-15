<?php
declare(strict_types=1);

/**
 * The only PHP on the site.
 *
 * The old install's Contact Form 7 silently failed for years because a captcha
 * plugin was missing — every email lead was lost without a trace. So: no
 * dependencies, no plugins, and a failure is visible rather than silent.
 *
 * Runs on the host's PHP 7.4 (checked: x-powered-by: PHP/7.4.33) — keep the syntax
 * 7.4-compatible: no readonly, no constructor promotion, no `catch (E)` without a
 * variable, no match/named args/nullsafe, no str_contains.
 *
 * Mail goes out through the host's own SMTP server (authenticated, STARTTLS).
 * PHP's mail() was dropped: on this host it returned true and delivered nothing.
 *
 * The phone is the real conversion. This is a backup channel.
 */

const TO_ADDRESS   = 'info@remontperalnisofia.com';
const FROM_ADDRESS = 'info@remontperalnisofia.com'; // header From AND envelope sender
const MIN_SECONDS  = 3;       // a human cannot fill this in faster
const MAX_PER_HOUR = 5;       // per IP

// Outside the web root on purpose: failures.log holds visitor IPs and names.
const LOG_DIR      = '/home/kickstic/contact-log';

// SMTP. Credentials live OUTSIDE the repo and the web root:
//   /home/kickstic/contact-smtp.php   <?php return ['user' => '...', 'pass' => '...'];
const SMTP_HOST        = 'localhost';
const SMTP_PORT        = 587;
const SMTP_TIMEOUT     = 15;
const SMTP_CREDENTIALS = '/home/kickstic/contact-smtp.php';
const SMTP_EHLO_NAME   = 'remontperalnisofia.com';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']);
    exit;
}

function fail(int $code, string $key) {
    // never returns (exits)
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $key], JSON_UNESCAPED_UNICODE);
    exit;
}

/** One line per event in failures.log: time, IP, name, detail. No credentials, ever. */
function log_failure(string $ip, string $name, string $detail): void {
    $clean = static fn(string $s): string => trim((string)preg_replace('/[\x00-\x1f\x7f]+/', ' ', $s));
    if (!is_dir(LOG_DIR)) {
        @mkdir(LOG_DIR, 0750, true);
    }
    @file_put_contents(
        LOG_DIR . '/failures.log',
        implode("\t", [date('c'), $ip, $clean($name), $clean($detail)]) . "\n",
        FILE_APPEND | LOCK_EX
    );
}

// --- SMTP client -----------------------------------------------------------

/** A step that did not get the reply it needed. Carries every reply line for the log. */
final class SmtpFailure extends RuntimeException {
    /** @var string */
    public $step;
    /** @var string[] every reply line, for the log */
    public $lines;

    public function __construct(string $step, array $lines) {
        parent::__construct($step . ': ' . implode(' | ', $lines));
        $this->step  = $step;
        $this->lines = $lines;
    }
}

/** Reads one (possibly multi-line) reply. Returns [code, lines]; code 0 = nothing usable. */
function smtp_read($fp): array {
    $lines = [];
    $code  = 0;
    while (($raw = fgets($fp, 2048)) !== false) {
        $line    = rtrim($raw, "\r\n");
        $lines[] = $line;
        if (!preg_match('/^(\d{3})([ -])/', $line, $m)) {
            $code = 0;
            break;
        }
        $code = (int)$m[1];
        if ($m[2] === ' ') {
            break; // last line of the reply
        }
    }
    if ($lines === []) {
        $meta    = stream_get_meta_data($fp);
        $lines[] = !empty($meta['timed_out']) ? '(timed out waiting for the server)' : '(connection closed, no reply)';
    }
    return [$code, $lines];
}

/**
 * Sends $command (null = only read, e.g. the greeting) and requires one of
 * $ok codes. Anything else — including every 4xx/5xx — throws with all reply lines.
 */
function smtp_cmd($fp, ?string $command, array $ok, string $step): void {
    if ($command !== null && fwrite($fp, $command . "\r\n") === false) {
        throw new SmtpFailure($step, ['(write to server failed)']);
    }
    [$code, $lines] = smtp_read($fp);
    if (!in_array($code, $ok, true)) {
        throw new SmtpFailure($step, $lines);
    }
}

/** @return array{user:string,pass:string}|null */
function smtp_credentials(): ?array {
    if (!is_readable(SMTP_CREDENTIALS)) {
        return null;
    }
    try {
        $load = static function () {
            return include SMTP_CREDENTIALS;
        };
        $c = $load();
    } catch (Throwable $e) {
        return null;
    }
    if (!is_array($c) || !is_string($c['user'] ?? null) || !is_string($c['pass'] ?? null)
        || $c['user'] === '' || $c['pass'] === '') {
        return null;
    }
    return ['user' => $c['user'], 'pass' => $c['pass']];
}

/**
 * localhost:587, STARTTLS, AUTH LOGIN. Throws SmtpFailure on any problem.
 * $message is the complete RFC 5322 message (headers + body), CRLF line endings,
 * no line starting with "." (the body is base64, so dot-stuffing is not needed).
 */
function smtp_send(array $cred, string $message): void {
    // The connection never leaves this machine (loopback to the host's own MTA),
    // whose certificate is issued for the server's hostname, not "localhost" —
    // so peer verification is switched off for this one connection.
    $ctx = stream_context_create(['ssl' => [
        'verify_peer'       => false,
        'verify_peer_name'  => false,
        'allow_self_signed' => true,
    ]]);
    $fp = @stream_socket_client(
        'tcp://' . SMTP_HOST . ':' . SMTP_PORT, $errno, $errstr, SMTP_TIMEOUT, STREAM_CLIENT_CONNECT, $ctx
    );
    if ($fp === false) {
        throw new SmtpFailure('connect', ["cannot connect to " . SMTP_HOST . ':' . SMTP_PORT . " [$errno] $errstr"]);
    }
    stream_set_timeout($fp, SMTP_TIMEOUT);

    try {
        smtp_cmd($fp, null, [220], 'greeting');
        smtp_cmd($fp, 'EHLO ' . SMTP_EHLO_NAME, [250], 'EHLO');
        smtp_cmd($fp, 'STARTTLS', [220], 'STARTTLS');
        if (stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) !== true) {
            throw new SmtpFailure('STARTTLS', ['TLS handshake failed']);
        }
        smtp_cmd($fp, 'EHLO ' . SMTP_EHLO_NAME, [250], 'EHLO after STARTTLS');

        // The commands below carry credentials: they are never logged, only the server's replies.
        smtp_cmd($fp, 'AUTH LOGIN', [334], 'AUTH LOGIN');
        smtp_cmd($fp, base64_encode($cred['user']), [334], 'AUTH user');
        smtp_cmd($fp, base64_encode($cred['pass']), [235], 'AUTH pass');

        smtp_cmd($fp, 'MAIL FROM:<' . FROM_ADDRESS . '>', [250], 'MAIL FROM');
        smtp_cmd($fp, 'RCPT TO:<' . TO_ADDRESS . '>', [250, 251], 'RCPT TO');
        smtp_cmd($fp, 'DATA', [354], 'DATA');
        smtp_cmd($fp, $message . "\r\n.", [250], 'end of DATA');

        @fwrite($fp, "QUIT\r\n");
    } finally {
        @fclose($fp);
    }
}

// --- bot checks ------------------------------------------------------------
// Honeypot: a field hidden with CSS. Real users never fill it.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    // Pretend it worked — telling a bot it failed just invites a retry.
    echo json_encode(['ok' => true]);
    exit;
}

$started = (int)($_POST['t'] ?? 0);
if ($started <= 0 || (time() - $started) < MIN_SECONDS) {
    fail(422, 'too_fast');
}

// --- rate limit ------------------------------------------------------------
if (!is_dir(LOG_DIR)) {
    @mkdir(LOG_DIR, 0750, true);
}
$ip     = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$bucket = LOG_DIR . '/' . hash('sha256', $ip) . '.txt';
$now    = time();
$hits   = [];
if (is_readable($bucket)) {
    $hits = array_filter(
        array_map('intval', file($bucket, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)),
        static fn(int $t): bool => $t > $now - 3600
    );
}
if (count($hits) >= MAX_PER_HOUR) {
    fail(429, 'rate_limit');
}

// --- validate --------------------------------------------------------------
$name    = trim((string)($_POST['name'] ?? ''));
$phone   = trim((string)($_POST['phone'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$consent = ($_POST['consent'] ?? '') === 'on';

if ($name === '' || mb_strlen($name) > 120)        fail(422, 'name');
if ($message === '' || mb_strlen($message) > 4000) fail(422, 'message');
if (!$consent)                                      fail(422, 'consent');

// Bulgarian mobile/landline, forgiving about spacing and +359
$digits = preg_replace('/[^\d+]/', '', $phone) ?? '';
if (!preg_match('/^(\+359|0)[1-9]\d{7,8}$/', $digits)) {
    fail(422, 'phone');
}

// --- send ------------------------------------------------------------------
// Everything the visitor typed goes into the base64 body or an RFC 2047-encoded
// Subject, never raw into a header, so it cannot inject headers. Nothing is
// echoed back into a page, and From is ours, never the submitter's (that would
// fail SPF and look like spoofing).
$ctl      = static fn(string $s): string => trim((string)preg_replace('/[\x00-\x1f\x7f]+/', ' ', $s));
$subject  = mb_encode_mimeheader('Запитване от сайта — ' . $ctl($name), 'UTF-8', 'B', "\r\n");
$fromName = mb_encode_mimeheader('Сайт', 'UTF-8', 'B', "\r\n");

$body = implode("\n", [
    'Име:     ' . $name,
    'Телефон: ' . $phone,
    '',
    'Съобщение:',
    $message,
    '',
    '---',
    'IP:      ' . $ip,
    'Време:   ' . date('Y-m-d H:i:s'),
]);

$raw = implode("\r\n", [
    'Date: ' . date('r'),
    'From: ' . $fromName . ' <' . FROM_ADDRESS . '>',
    'To: ' . TO_ADDRESS,
    'Subject: ' . $subject,
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@remontperalnisofia.com>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
]) . "\r\n\r\n" . rtrim(chunk_split(base64_encode($body), 76, "\r\n"), "\r\n") . "\r\n";

$cred = smtp_credentials();
if ($cred === null) {
    // Visible failure: a dead form must be noticed in days, not years.
    log_failure($ip, $name, 'SMTP credentials file missing or invalid: ' . SMTP_CREDENTIALS);
    fail(500, 'send');
}

try {
    // trailing "\r\n" of $raw + ".\r\n" terminator is added by smtp_cmd as "\r\n."
    smtp_send($cred, rtrim($raw, "\r\n"));
} catch (SmtpFailure $e) {
    // every reply line of the failing step, one log row each — no credentials
    foreach ($e->lines as $line) {
        log_failure($ip, $name, 'SMTP ' . $e->step . ': ' . $line);
    }
    fail(500, 'send');
}

$hits[] = $now;
@file_put_contents($bucket, implode("\n", $hits), LOCK_EX);

echo json_encode(['ok' => true]);
