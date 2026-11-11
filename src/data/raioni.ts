/**
 * Coverage data.
 *
 * Organised by квартал, not by administrative район. People search
 * "ремонт перални Горубляне", not "район Младост" — Горубляне is a квартал
 * inside Младост, and the old site's 24-район list missed the words customers
 * actually type.
 *
 * Rendered on the homepage as a zone wheel + <details> accordion (no JS), and
 * on /raioni/ with a real paragraph per zone — that page, not the homepage
 * chips, is what can rank for neighbourhood terms.
 *
 * The `intro` paragraphs are deliberately neutral: they state coverage and nothing
 * about what is repaired where or how fast. TODO(client interview): replace with
 * confirmed specifics.
 *
 * Also feeds `areaServed` in the LocalBusiness JSON-LD. The business is a
 * service-area business: no street address is published.
 */

export type Zone = {
  id: string;
  name: string;
  /** one real paragraph, used on /raioni/ — not filler */
  intro: string;
  kvartali: string[];
};

export const base = {
  town: 'Банкя',
  municipality: 'Столична община',
  region: 'София-град',
  country: 'BG',
} as const;

export const zones: Zone[] = [
  {
    id: 'centar',
    name: 'Център',
    // TODO(client interview): neutral coverage copy only. Add real, client-confirmed
    // detail per zone (access, typical buildings, travel) — nothing unverified.
    intro:
      'Обслужваме централните квартали на София — Средец, Оборище, Възраждане, Сердика, Триадица, Яворов и Докторски паметник. Обадете се и кажете в кой квартал се намирате.',
    kvartali: [
      'Средец',
      'Оборище',
      'Възраждане',
      'Сердика',
      'Триадица',
      'Яворов',
      'Докторски паметник',
    ],
  },
  {
    id: 'zapad',
    name: 'Запад',
    // TODO(client interview): neutral coverage copy only. Add real, client-confirmed
    // detail per zone (access, typical buildings, travel) — nothing unverified.
    intro:
      'Работим от Банкя и обслужваме западните квартали на София — Люлин, Красна поляна, Илинден, Връбница, Овча купел, Обеля и околните. Обадете се и кажете в кой квартал се намирате.',
    kvartali: [
      'Люлин',
      'Банкя',
      'Красна поляна',
      'Илинден',
      'Връбница',
      'Овча купел',
      'Обеля',
      'Факултета',
      'Модерно предградие',
      'Захарна фабрика',
      'Иваняне',
      'Волуяк',
    ],
  },
  {
    id: 'iztok',
    name: 'Изток',
    // TODO(client interview): neutral coverage copy only. Add real, client-confirmed
    // detail per zone (access, typical buildings, travel) — nothing unverified.
    intro:
      'Обслужваме източните квартали на София — Младост, Студентски град, Дружба, Горубляне, Слатина, Изгрев, Гео Милев и околните. Обадете се и кажете в кой квартал се намирате.',
    kvartali: [
      'Младост',
      'Студентски град',
      'Дружба',
      'Горубляне',
      'Слатина',
      'Изгрев',
      'Гео Милев',
      'Христо Смирненски',
      'Полигона',
      'Цариградско шосе',
    ],
  },
  {
    id: 'yug',
    name: 'Юг',
    // TODO(client interview): neutral coverage copy only. Add real, client-confirmed
    // detail per zone (access, typical buildings, travel) — nothing unverified.
    intro:
      'Обслужваме южните квартали на София — Лозенец, Витоша, Бояна, Драгалевци, Симеоново, Манастирски ливади и околните. Обадете се и кажете в кой квартал се намирате.',
    kvartali: [
      'Лозенец',
      'Витоша',
      'Бояна',
      'Драгалевци',
      'Симеоново',
      'Манастирски ливади',
      'Кръстова вада',
      'Хладилника',
      'Гоце Делчев',
      'Борово',
      'Павлово',
    ],
  },
  {
    id: 'sever',
    name: 'Север',
    // TODO(client interview): neutral coverage copy only. Add real, client-confirmed
    // detail per zone (access, typical buildings, travel) — nothing unverified.
    intro:
      'Обслужваме северните квартали на София — Надежда, Подуяне, Нови Искър, Свобода, Левски, Хаджи Димитър и околните. Работим и през почивните дни по предварителна уговорка.',
    kvartali: [
      'Надежда',
      'Подуяне',
      'Нови Искър',
      'Свобода',
      'Левски',
      'Хаджи Димитър',
      'Сухата река',
      'Орландовци',
      'Малашевци',
      'Бенковски',
    ],
  },
  {
    id: 'sela',
    name: 'Околни населени места',
    // TODO(client interview): neutral coverage copy only. Add real, client-confirmed
    // detail per zone (access, typical buildings, travel) — nothing unverified.
    intro:
      'Обслужваме и населените места около София — Бистрица, Владая, Герман, Долни Пасарел, Казичане, Кокаляне, Лозен и другите от списъка. Обадете се и кажете къде се намирате.',
    kvartali: [
      'Бистрица',
      'Владая',
      'Герман',
      'Долни Пасарел',
      'Казичане',
      'Кокаляне',
      'Лозен',
      'Бусманци',
      'Горни Богров',
      'Долни Богров',
      'Железница',
      'Клисура',
      'Мало Бучино',
      'Чепинци',
      'Плана',
      'Доброславци',
      'Мировяне',
      'Локорско',
      'Балша',
      'Мърчаево',
    ],
  },
];

/** Flat list for JSON-LD areaServed. */
export const allAreas = zones.flatMap((z) => z.kvartali);
