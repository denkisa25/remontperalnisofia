<?php
declare(strict_types=1);

/**
 * The only PHP on the site.
 *
 * The old install's Contact Form 7 silently failed for years because a captcha
 * plugin was missing — every email lead was lost without a trace. So: no
 * dependencies, no plugins, and a failure is visible rather than silent.
 *
 * The phone is the real conversion. This is a backup channel.
 */

const TO_ADDRESS   = 'info@remontperalnisofia.com';
const MIN_SECONDS  = 3;       // a human cannot fill this in faster
const MAX_PER_HOUR = 5;       // per IP
const LOG_DIR      = __DIR__ . '/contact-log';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']);
    exit;
}

function fail(int $code, string $key): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $key], JSON_UNESCAPED_UNICODE);
    exit;
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
// Everything below goes into headers or the body as literal text. Nothing is
// echoed back into a page, and the From address is ours, never the submitter's
// (that would fail SPF and look like spoofing).
$subject = '=?UTF-8?B?' . base64_encode('Запитване от сайта — ' . $name) . '?=';

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

$headers = implode("\r\n", [
    'From: Сайт <no-reply@remontperalnisofia.com>',
    'Reply-To: ' . TO_ADDRESS,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
]);

$sent = mail(TO_ADDRESS, $subject, $body, $headers);

if (!$sent) {
    // Visible failure: log it so a dead form is noticed in days, not years.
    @file_put_contents(
        LOG_DIR . '/failures.log',
        date('c') . "\t" . $ip . "\t" . str_replace("\n", ' ', $name) . "\n",
        FILE_APPEND | LOCK_EX
    );
    fail(500, 'send');
}

$hits[] = $now;
@file_put_contents($bucket, implode("\n", $hits), LOCK_EX);

echo json_encode(['ok' => true]);
