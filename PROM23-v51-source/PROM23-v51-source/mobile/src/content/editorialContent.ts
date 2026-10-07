// Versioned content snapshot. Replace through a content DTO adapter, not HTML parsing.
// Sources and exclusions: docs/audit/content-v9-plan.md; company-evidence.json.
import { sitePages } from './sitePages';
import { businessQuestions, productionQuestions } from './companyContent';
export const editorialRevision = '2026-09-11-v9';
export const historyMilestones = Object.entries((sitePages.about.sections.find(section => section.id === 'history')?.bullets ?? []).reduce<Record<string, string[]>>((years, text) => {
  const [year, ...body] = text.split(' — '); (years[year] ??= []).push(body.join(' — ')); return years;
}, {})).map(([year, paragraphs]) => ({ year, paragraphs }));
export type HelpItem = { id: string; category: string; question: string; answer: string; details?: string; relatedLink?: { label: string; route: string }; source: string };
const help = (id: string, category: string, question: string, answer: string, route: string, label: string, source: string, details?: string): HelpItem => ({ id, category, question, answer, details, relatedLink: { route, label }, source });
export const helpCategories = ['Все', 'Заказ', 'Оплата', 'Доставка', 'Возврат', 'Производство', 'Для бизнеса'];
export const helpItems: HelpItem[] = [
  help('order-start', 'Заказ', 'Как оформить покупку?', 'Добавьте товары в корзину и перейдите к оформлению. Перед подтверждением проверьте состав заказа, покупателя, способ получения и оплаты.', '/cart', 'Перейти в корзину', 'site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php'),
  help('order-account', 'Заказ', 'Для чего нужен личный кабинет?', 'В кабинете собраны заказы, обращения и документы, доступные вашему покупателю. Для организации предусмотрены реквизиты и доступ сотрудников в пределах их прав.', '/account', 'Открыть кабинет', 'site-source/personal/index.php'),
  help('order-help', 'Заказ', 'Не знаю артикулы. Как подобрать комплект?', 'Опишите, какое оборудование нужно, для какой работы и в каком количестве. Для закупки на объект можно приложить перечень или спецификацию.', '/procurement', 'Передать задачу', 'https://prom.myfast.space/business/'),
  help('payment-options', 'Оплата', 'Какими способами можно оплатить?', 'Для личных покупок предусмотрены онлайн-оплата и оплата при получении. Для юридических лиц и ИП — безналичный перевод по счёту. Доступные способы зависят от условий заказа.', '/information/payment', 'Все способы оплаты', 'site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php'),
  help('payment-split', 'Оплата', 'Как работает Сплит?', 'Сплит позволяет оплачивать покупку частями. Доступность, суммы и даты платежей показывает Яндекс перед подтверждением покупки.', '/information/payment', 'Сплит и оплата', 'https://pay.yandex.ru/'),
  help('payment-plus', 'Оплата', 'Где посмотреть баллы Плюса?', 'Доступный кешбэк и персональные условия показывает Яндекс Пэй. Начисление зависит от условий сервиса и активной подписки Плюс; баллы не являются деньгами.', '/information/payment', 'Условия баллов Плюса', 'https://yandex.ru/legal/plus_loyalty/'),
  help('delivery-options', 'Доставка', 'Как можно получить оборудование?', 'Самовывоз со склада, курьер, транспортная компания до терминала или адреса, а для подходящих заказов — пункт выдачи.', '/information/delivery', 'Выбрать способ получения', 'https://prom.myfast.space/delivery/', 'Доступность зависит от региона, веса, габаритов и количества грузовых мест. Крупное оборудование может не подходить под ограничения ПВЗ.'),
  help('delivery-cost', 'Доставка', 'Сколько стоит доставка и когда привезут?', 'Стоимость и срок рассчитываются по составу заказа, весу, объёму и маршруту. Детали согласуют до оплаты.', '/information/delivery', 'Подробнее о доставке', 'https://prom.myfast.space/delivery/'),
  help('delivery-pickup', 'Доставка', 'Что проверить перед самовывозом?', 'Уточните готовность заказа, склад отгрузки, часы работы и правила въезда. Адреса и телефоны филиалов доступны в контактах.', '/information/contacts', 'Адреса филиалов', 'https://prom.myfast.space/delivery/'),
  help('return-start', 'Возврат', 'Как начать возврат?', 'Откройте нужный заказ и выберите товар. Укажите причину, опишите ситуацию и при необходимости добавьте фото или видео. Если заказ не находится, оставьте обращение.', '/pages/returns', 'Начать возврат', 'site-source/local/ajax/lk/returns-products/returns-product.php'),
  help('return-defect', 'Возврат', 'Что делать, если обнаружен недостаток?', 'Сохраните документы и опишите, когда и как проявился недостаток. При наличии приложите фотографии товара и повреждений. Отсутствие чека, фото или видео само по себе не препятствует обращению потребителя.', '/forms/appeal', 'Создать обращение', 'site-source/local/ajax/lk/appeals/action-appeal.php'),
  ...productionQuestions.map((item, index) => ({ id: 'production-' + index, category: 'Производство', question: item.question, answer: item.answer, source: 'https://prom.myfast.space/vendor/' })),
  ...businessQuestions.flatMap((group, groupIndex) => group.items.map((item, index) => ({ id: `business-${groupIndex}-${index}`, category: 'Для бизнеса', question: item.question, answer: item.answer, source: 'https://prom.myfast.space/business/' }))),
];
export const supplyWorkflow = [
  { title: 'Получаем потребность', text: 'Спецификация, перечень или описание задачи с количеством и сроком.', group: 'Подготовка' },
  { title: 'Проверяем позиции', text: 'Уточняем параметры и совместимость оборудования.', group: 'Подготовка' },
  { title: 'Подбираем аналоги', text: 'Если требуется замена, согласуем подходящие варианты.', group: 'Подготовка' },
  { title: 'Проверяем наличие', text: 'Подтверждаем склад, количество и комплектность.', group: 'Согласование' },
  { title: 'Формируем предложение', text: 'Фиксируем состав, стоимость и условия поставки.', group: 'Согласование' },
  { title: 'Резервируем', text: 'Условия и срок резерва согласует менеджер.', group: 'Согласование' },
  { title: 'Оплата', text: 'По счёту и согласованным условиям вашей закупки.', group: 'Получение' },
  { title: 'Доставка', text: 'Готовность, способ перевозки и приёмку подтверждаем заранее.', group: 'Получение' },
  { title: 'Документы', text: 'Комплект документов определяется составом поставки и сделкой.', group: 'Получение' },
];
// Editorial grouping of source business supply actions, not a promise of nine live status events.
export const branchPhotos: Record<string, ReturnType<typeof require>> = {
  'Краснодар': require('../../assets/company/branch-krasnodar.webp'),
  'Москва': require('../../assets/company/branch-moscow.webp'),
  'Ростов-на-Дону': require('../../assets/company/branch-rostov.webp'),
};
