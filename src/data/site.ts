/**
 * Single source of truth for business facts.
 *
 * Every number here is real and confirmed, EXCEPT the prices — see below.
 */

export const site = {
  name: 'Ремонт Перални София',
  url: 'https://remontperalnisofia.com',
  lang: 'bg',
  locale: 'bg_BG',

  // Confirmed with the client (CLAUDE.md §16). The old database's
  // `blogdescription` held 0879 473 988 — that is stale. Do not use it.
  // Every call to action on the site reads from here; change it in ONE place.
  phone: '0886 473 988',
  phoneHref: 'tel:+359886473988',

  email: 'info@remontperalnisofia.com',
  // The old install's admin_email was the owner's personal abv.bg address.
  // It must never appear on the site: it was a spam magnet and it identifies
  // him by name, which he does not want.

  baseTown: 'Банкя, София',
  tagline: 'Ремонт на перални и сушилни по домовете',
  since: 2005,

  /** Exactly these four. Do not add a fifth or invent any. */
  stats: [
    { value: '20', label: 'години само с перални и сушилни' },
    { value: '2 500+', label: 'посетени домакинства в София' },
    { value: '10 000', label: 'ремонтирани уреда' },
    { value: '6 мес.', label: 'гаранция на всяка сменена част' },
  ],

  pricing: {
    showTable: true,

    /**
     * ⚠ PLACEHOLDER PRICES — every figure is a flat €25 standing in for the
     * real number. They are NOT real and must not reach production.
     *
     * The `placeholder` flag renders a visible amber banner above the table
     * reading "ПРИМЕРНИ СТОЙНОСТИ — ПОДЛЕЖАТ НА АКТУАЛИЗАЦИЯ". Keep that
     * banner wired to this flag: when the real numbers land, flipping this one
     * boolean removes the warning. Do not hardcode the banner away.
     *
     * EUR only. Bulgaria adopted the euro on 1 Jan 2026, the euro has been
     * sole legal tender since 1 Feb 2026, and the dual-display window closed
     * on 8 Aug 2026. No лв. anywhere on the site.
     */
    placeholder: true,
    currency: 'EUR',
    note: 'Посещението и диагностиката не се заплащат при извършен ремонт. Точната цена се потвърждава на място, преди да започнем работа.',
    rows: [
      { label: 'Посещение и диагностика', price: 25 },
      { label: 'Смяна на ключалка на люк (PTC / електромагнитна)', price: 25 },
      { label: 'Смяна на маншон', price: 25 },
      { label: 'Смяна на водна помпа', price: 25 },
      { label: 'Смяна на лагери на барабан', price: 25 },
      { label: 'Смяна на нагревател (пералня)', price: 25 },
      { label: 'Смяна на нагревател (сушилня)', price: 25 },
      { label: 'Смяна на четки на мотор', price: 25 },
      { label: 'Ремонт на програматор', price: 25 },
    ],

    /** Shown alongside the table — these are real and stay regardless. */
    principles: [
      {
        title: 'Диагностиката не се заплаща',
        body: 'При извършен ремонт посещението и диагностиката са за наша сметка.',
      },
      {
        title: 'Цената се потвърждава на място',
        body: 'Никога не започваме работа, преди да сте чули крайната сума.',
      },
      {
        title: '6 месеца гаранция',
        body: 'На всяка сменена част и на всяка отстранена повреда.',
      },
    ],
  },

  appliances: ['перални', 'сушилни'] as const,

  brands: [
    { slug: 'bosch', name: 'Bosch' },
    { slug: 'indesit', name: 'Indesit' },
    { slug: 'beko', name: 'Beko' },
    { slug: 'lg', name: 'LG' },
    { slug: 'zanussi', name: 'Zanussi' },
    { slug: 'aeg', name: 'AEG' },
    { slug: 'ariston', name: 'Ariston' },
    // Expansion candidates — add once a logo file and at least a few
    // verified error codes exist for each. An empty brand page is worse
    // than no brand page.
    // samsung, whirlpool, electrolux, siemens, candy, hoover, hotpoint,
    // gorenje, miele, grundig, vox, finlux, heinner, teka, bauknecht
  ],

  hoursNote: 'Работим и през почивните дни по предварителна уговорка.',

  analytics: {
    // GA4 measurement ID, "G-XXXXXXXXXX". Empty = no consent banner and nothing
    // is loaded from Google (nothing to consent to).
    ga4: '',
    // Search Console HTML-tag verification token (content="…"). Empty = omitted.
    searchConsole: '',
    // fires on every tel: click, once the visitor has accepted analytics
    telConversionEvent: 'call_click',
  },
} as const;
