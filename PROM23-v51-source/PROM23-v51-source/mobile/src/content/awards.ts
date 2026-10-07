import { awardsCopy } from './awardsCopy';

export const kubanRegisterUrl = 'https://product-of-kuban.ru/winner/obshhestvo-s-ogranichennoj-otvetstvennostyu-team-indastri-inn-2016003473/';
export const awardPhotos = [
  require('../../assets/company/award-0.png'), require('../../assets/company/award-1.png'), require('../../assets/company/award-2.png'),
  require('../../assets/company/award-3.png'), require('../../assets/company/award-4.png'), require('../../assets/company/award-5.png'),
  require('../../assets/company/award-6.png'), require('../../assets/company/award-7.png'), require('../../assets/company/award-8.png'),
];
export type AwardEntry = { id: string; year: number; title: string; recipient: string; result: string; level: string; date: string; period?: string; photos: number[]; body: string; personal?: boolean; register?: boolean; nomination: string };
const entries: Omit<AwardEntry, 'body'>[] = [
  { id: 'supplier-2025', year: 2025, title: 'Лучший поставщик года — 2024', recipient: 'ООО «Промышленник»', result: 'Победитель', level: 'Конкурс поставщиков', date: '23–25 апреля 2025 · Санкт-Петербург', period: 'По итогам 2024 года', nomination: 'Сельское хозяйство и продовольствие', photos: [] },
  { id: 'mercury-2025', year: 2025, title: 'Золотой Меркурий', recipient: 'ООО «ТЕАМ ИНДАСТРИ»', result: 'III место', level: 'Региональный этап', date: '24 апреля 2025 · Краснодар', period: 'По итогам 2024 года', nomination: 'Лучшее предприятие малого и среднего бизнеса в сфере промышленного производства', photos: [] },
  { id: 'kuban-2024', year: 2024, title: 'Сделано на Кубани', recipient: 'ООО «ТЕАМ ИНДАСТРИ»', result: 'Победитель', level: 'XII краевой конкурс', date: '2024 год · Краснодарский край', nomination: 'Товары производственно-технического назначения', photos: [], register: true },
  { id: 'export-region-2024', year: 2024, title: 'Экспортер года', recipient: 'ООО «Промышленник»', result: 'I место', level: 'Региональный конкурс', date: '22 августа 2024 · Краснодар', period: 'По итогам 2023 года', nomination: 'Экспортер года в сфере промышленности', photos: [0, 1] },
  { id: 'export-district-2024', year: 2024, title: 'Экспортер года', recipient: 'ООО «Промышленник»', result: 'II место', level: 'Окружной этап · ЮФО', date: '10 сентября 2024 · Симферополь', nomination: 'Экспортер года в сфере промышленности', photos: [4] },
  { id: 'mercury-2024', year: 2024, title: 'Золотой Меркурий', recipient: 'ООО «Промышленник»', result: 'I место', level: 'Региональный этап', date: '12 апреля 2024 · Краснодар', period: 'По итогам 2023 года', nomination: 'Лучшее предприятие-экспортер в сфере промышленного производства', photos: [2] },
  { id: 'export-2023', year: 2023, title: 'Экспортер года', recipient: 'ООО «Промышленник»', result: 'II место', level: 'Региональный конкурс', date: '30 августа 2023 · Краснодар', period: 'По итогам 2022 года', nomination: 'Экспортер года в сфере промышленности', photos: [3] },
  { id: 'export-2022', year: 2022, title: 'Экспортер года', recipient: 'ООО «Промышленник»', result: 'III место', level: 'Региональный конкурс', date: '17 августа 2022 · Краснодар', period: 'По итогам 2021 года', nomination: 'Экспортер года в сфере промышленности', photos: [6] },
  { id: 'triumph-2024', year: 2024, title: 'Триумф', recipient: 'Павел Хомяков', result: 'Бронзовый лауреат', level: 'Признание руководителей', date: '26 ноября 2024', nomination: 'Триумф в промышленности', photos: [7, 8], personal: true },
  { id: 'woman-exporter-2023', year: 2023, title: 'Экспортер года', recipient: 'Ирина Александровна Еланская', result: 'II место', level: 'Окружной этап · ЮФО', date: '29 сентября 2023 · Ростов-на-Дону', nomination: 'Лучшая женщина-экспортер', photos: [5], personal: true },
];
export const awards: AwardEntry[] = entries.map((entry, index) => ({ ...entry, body: awardsCopy[index].body }));
// September's district ceremony precedes August's regional ceremony in the descending timeline.
export const corporateAwards = [awards[0], awards[1], awards[2], awards[4], awards[3], awards[5], awards[6], awards[7]];
export const personalAwards = awards.filter(award => award.personal);
export const awardAlt = (award: AwardEntry, photo: number) => `${award.recipient} — ${award.title}, ${award.nomination}, ${award.result}, ${award.year} год вручения${[1, 2, 8].includes(photo) ? ', награда' : ', диплом'}`;
