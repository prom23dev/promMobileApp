// Own-site content snapshot. See docs/15-site-content-v3.md for field-level evidence and exclusions.
export const siteContentCheckedAt = '2026-09-11';
export type SiteTopic = 'delivery' | 'payment' | 'business' | 'production' | 'contacts';
export type SiteAction = { label: string; kind: 'phone' | 'email' | 'route' | 'map' | 'website'; value: string };
export type SiteSection = { id: string; title: string; paragraphs: string[]; bullets?: string[]; sources: string[] };
export type SitePage = { title: string; subtitle: string; sections: SiteSection[]; actions: SiteAction[]; sources: string[] };
export type SiteContact = {
  city: string; address: string; phone: string; phoneLabel: string;
  email?: string; hours?: string[]; mapUrl: string; sources: string[];
};

export const siteTopics: SiteTopic[] = ['delivery', 'payment', 'business', 'production', 'contacts'];
export const supportPhone = '+78002002590';
export const supportPhoneLabel = '8 (800) 200-25-90';
const origin = 'https://prom.myfast.space';
const deliverySource = `${origin}/delivery/`;
const businessSource = `${origin}/business/`;
const productionSource = `${origin}/vendor/`;
const contactsSource = `${origin}/contacts/`;
const checkoutSource = 'site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php';

function contact(city: string, address: string, phoneLabel: string, details: Pick<SiteContact, 'email' | 'hours'> = {}): SiteContact {
  return {
    city, address, phone: '+' + phoneLabel.replace(/\D/g, ''), phoneLabel, ...details,
    // The destination is the public branch address; the app never reads or sends the user's location.
    mapUrl: `https://yandex.ru/maps/?rtext=~${encodeURIComponent(address)}&rtt=auto`,
    sources: [contactsSource],
  };
}

// Branch labels and their actual addresses are kept distinct (for example Пятигорск → Лермонтов).
export const siteContacts: Record<string, SiteContact> = {
  'Краснодар': contact('Краснодар', 'г. Краснодар, ул. Карла Гусника, д. 17/20 (р-н Витаминкомбината)', '+7 (861) 225-00-90', {
    email: 'sales@prom23.ru', hours: ['Пн–Пт: 8:00–17:00', 'Сб: 9:00–15:00', 'Вс: выходной'],
  }),
  'Москва': contact('Москва', 'Московская область, Люберецкий район, пос. Красково, ул. 2-ая Заводская, стр. 5а', '+7 (495) 640-80-81'),
  'Ростов-на-Дону': contact('Ростов-на-Дону', 'г. Ростов-на-Дону, пер. Машиностроительный, 16, офис 23', '+7 (928) 903-63-88'),
  'Санкт-Петербург': contact('Санкт-Петербург', 'г. Санкт-Петербург, ул. Домостроительная, д. 1, литер А, офис 702', '+7 (812) 209-69-00'),
  'Симферополь': contact('Симферополь', 'г. Симферополь, ул. Кубанская, 22А', '+7 (978) 149-25-90'),
  'Пермь': contact('Пермь', 'г. Пермь, ул. Новогайвинская, д. 102, оф. 2', '+7 (982) 492-33-14'),
  'Пятигорск': contact('Пятигорск', 'Ставропольский край, г. Лермонтов, ул. Промышленная, 15/6', '+7 (905) 468-22-88'),
  'Грозный': contact('Грозный', 'Чеченская Республика, городской округ г. Аргун, с. Бердыкель, ул. Торговая, 13', '+7 (938) 992-1-992'),
  'Тюмень': contact('Тюмень', 'г. Тюмень, ул. Сергея Ильюшина, 3В, стр. 3', '+7 (963) 454-74-04'),
  'Луганск': contact('Луганск', 'г. Луганск, ул. Луначарского, 95, офис 182', '+7 (959) 551-00-06'),
  'Иркутск': contact('Иркутск', 'Иркутск, ул. Мира, д. 3', '+7 (3952) 48 58 80'),
  'Тбилиси': contact('Тбилиси', 'Муниципалитет Гардабани, село Марткопи', '+995 591 442 467'),
  'Гудаута': contact('Гудаута', 'Республика Абхазия, г. Гудаута, ул. Гердзмава, 4', '+7 (940) 979-69-69'),
  'Ереван': contact('Ереван', '0012, Республика Армения, г. Ереван, ул. В. Вагаршяна, 20', '+374 992 840 88'),
  'Астана': contact('Астана', 'Республика Казахстан, г. Астана, ул. Пушкина, 30', '+7 (701) 982-36-15'),
  'Минск': contact('Минск', '222201, г. Смолевичи, ул. Магистральная, 3, каб. 3', '+375 25 971 51 36'),
};

export const siteContent: Record<SiteTopic, SitePage> = {
  delivery: {
    title: 'Доставка и самовывоз',
    subtitle: 'На объект, до терминала или со склада',
    sections: [
      { id: 'methods', title: 'Как получить заказ', paragraphs: ['Способ доставки зависит от вашего региона, веса и габаритов оборудования.'], bullets: [
        'Экспресс-курьер в городах, где есть склад компании.',
        'Курьерская доставка в регионе склада.',
        'Транспортная компания по вашему выбору — до терминала или до двери.',
        'Яндекс Доставка — до пункта выдачи Яндекс Маркета или до двери.',
      ], sources: [deliverySource] },
      { id: 'pickup-points', title: 'ПВЗ СДЭК и Яндекс Маркета', paragraphs: [
        'Пункт выдачи подбирается для конкретного заказа: учитываются склад отгрузки, вес, длина, объём, количество мест и ограничения приёмки.',
        'Леса, опалубку и другое крупногабаритное оборудование нельзя автоматически отправить в любой ПВЗ. Возможность приёма груза, адрес, часы работы, стоимость и срок нужно подтвердить при расчёте доставки.',
        'Доступные пункты выдачи и тарифы зависят от состава заказа. Менеджер поможет выбрать подходящий способ получения.',
      ], sources: [deliverySource, 'docs/16-master-requirements.md#7-доставка-и-получение'] },
      { id: 'cost', title: 'Стоимость и сроки', paragraphs: [
        'Стоимость рассчитывается индивидуально: учитываются объём, вес, маршрут и тарифы перевозчика. Менеджер согласует с вами способ доставки и все детали до выставления счёта и оплаты.',
        'Доставка товара до терминала транспортной компании бесплатная. Саму перевозку вы оплачиваете отдельно по тарифам транспортной компании.',
        'Условия и возможность доставки собственным транспортом, в том числе бесплатной, уточняются у менеджера. Время получения согласуется заранее.',
      ], sources: [deliverySource, businessSource] },
      { id: 'pickup', title: 'Самовывоз со склада', paragraphs: [
        'На странице доставки указаны склады в Москве, Санкт-Петербурге, Краснодаре, Ростове-на-Дону, Перми, Пятигорске, Симферополе, Грозном и Иркутске.',
        'Перед поездкой уточните у менеджера готовность заказа, склад отгрузки и правила въезда. Адрес и контакты нужного филиала доступны ниже.',
      ], sources: [deliverySource, businessSource] },
      { id: 'site-delivery', title: 'Доставка на объект', paragraphs: [
        'Для поставки на стройплощадку заранее сообщите адрес, время приёмки, ограничения на въезд и условия разгрузки. Если товары находятся на разных складах, менеджер согласует объединённую или раздельную отгрузку.',
      ], sources: [businessSource] },
    ],
    actions: [{ label: 'Адреса и контакты складов', kind: 'route', value: '/information/contacts' }, { label: 'Перейти в каталог', kind: 'route', value: '/catalog' }],
    sources: [deliverySource, businessSource, 'docs/16-master-requirements.md#7-доставка-и-получение'],
  },
  payment: {
    title: 'Оплата',
    subtitle: 'Для личных покупок и для бизнеса',
    sections: [
      { id: 'personal', title: 'Личные покупки', paragraphs: [
        'На сайте предусмотрены оплата онлайн и оплата при получении. Доступные способы зависят от покупателя, выбранного склада и условий заказа.',
        'Для онлайн-оплаты сайт использует Яндекс Пэй. Доступность оплаты картой и Сплитом проверяется при оформлении.',
      ], sources: [checkoutSource] },
      { id: 'split', title: 'Яндекс Пэй и Сплит', paragraphs: [
        'Сплит позволяет оплачивать покупку частями. Доступность, суммы и даты платежей, а также условия сервиса показывает Яндекс перед подтверждением.',
        'Условия могут отличаться для разных покупателей и заказов. Ориентируйтесь на предложение в форме Яндекс Пэй.',
      ], sources: [checkoutSource, 'https://pay.yandex.ru/', 'https://pay.yandex.ru/docs/ru/custom/'] },
      { id: 'plus', title: 'Баллы Плюса', paragraphs: [
        'Начисление баллов зависит от условий Яндекса и наличия активной подписки Плюс. Размер доступного кешбэка проверяйте в предложении Яндекс Пэй.',
        'По текущим правилам Яндекса при оплате Сплитом баллы Плюса не начисляются. Баллы не являются деньгами.',
      ], sources: ['https://pay.yandex.ru/', 'https://yandex.ru/legal/plus_loyalty/'] },
      { id: 'invoice', title: 'Юридическим лицам и ИП', paragraphs: [
        'Основной способ оплаты — безналичный перевод по счёту. Состав заказа, продавец, НДС, доставка и условия оплаты фиксируются в счёте и документах.',
        'Индивидуальные условия, заказная продукция и поэтапные поставки согласуются с менеджером до оплаты.',
      ], sources: [businessSource, checkoutSource] },
    ],
    actions: [{ label: 'Связаться с менеджером', kind: 'route', value: '/information/contacts' }, { label: 'Правила Яндекс Пэй', kind: 'website', value: 'https://pay.yandex.ru/' }],
    sources: [checkoutSource, businessSource, 'https://pay.yandex.ru/', 'https://pay.yandex.ru/docs/ru/custom/'],
  },
  business: {
    title: 'Для бизнеса',
    subtitle: 'Комплектуем строительные и производственные объекты',
    sections: [
      { id: 'supply', title: 'Поставка под вашу задачу', paragraphs: [
        'Опалубка и комплектующие, строительные леса, вышки-туры, телескопические стойки, оборудование для бетонных и арматурных работ, грузоподъёмная и складская техника.',
        'Складская программа, собственное производство и заказные поставки — с безналичной оплатой, НДС и комплектом документов.',
      ], sources: [businessSource] },
      { id: 'offer', title: 'Коммерческое предложение', paragraphs: [
        'Сообщите менеджеру спецификацию, объём, срок и регион поставки. Он подберёт состав оборудования и подготовит предложение с учётом вашей задачи.',
        'Наличие, комплектация, срок резерва и итоговые условия подтверждаются менеджером. Для заказных изделий потребуются чертежи или размеры, материал, нагрузка, количество и желаемая дата.',
      ], sources: [businessSource] },
      { id: 'documents', title: 'Счёт и документы', paragraphs: [
        'Состав документов зависит от сделки: счёт, договор, спецификация, УПД, транспортные документы, паспорт или руководство; сертификат либо декларация — когда применимо.',
        'Электронный документооборот подключается по согласованию. Оператора и идентификатор ЭДО передают менеджеру или бухгалтерии.',
      ], sources: [businessSource] },
      { id: 'organization', title: 'Кабинет организации', paragraphs: [
        'На сайте можно зарегистрировать юридическое лицо и заполнить реквизиты. В кабинете предусмотрены заказы и документы, доступные текущему покупателю.',
      ], sources: [businessSource, 'site-source/organization/index.php'] },
    ],
    actions: [{ label: 'Обсудить поставку с менеджером', kind: 'route', value: '/information/contacts' }, { label: 'Подобрать оборудование', kind: 'route', value: '/catalog' }, { label: 'Кабинет покупателя', kind: 'route', value: '/account' }],
    sources: [businessSource],
  },
  production: {
    title: 'Собственное производство',
    subtitle: 'От проектирования до готового оборудования',
    sections: [
      { id: 'manufacturer', title: 'Производственная база', paragraphs: [
        'Собственное производство ГК «Промышленник» расположено в Краснодарском крае. На странице для бизнеса производителем указано ООО «ТЕАМ ИНДАСТРИ», продукция выпускается под брендами «Промышленник» и «TeaM».',
      ], sources: [productionSource, businessSource] },
      { id: 'stages', title: 'Этапы производства', paragraphs: [], bullets: [
        'Проектирование и разработка: чертежи, 3D-модели и техническая документация.',
        'Подготовка сырья и проверка поступающих материалов.',
        'Изготовление, обработка и сборка в производственном цехе.',
        'Тестирование и контроль качества готовой продукции.',
      ], sources: [productionSource] },
      { id: 'custom', title: 'Оборудование по вашим требованиям', paragraphs: [
        'Передайте менеджеру требования к изделию: чертежи или размеры, нагрузку, материал, количество и срок. Возможность изготовления и условия поставки согласуются до подтверждения заказа.',
      ], sources: [businessSource] },
      { id: 'visit', title: 'Познакомиться с производством', paragraphs: [
        'На сайте можно запросить индивидуальное предложение и экскурсию. Для согласования визита свяжитесь с менеджером.',
        'Адрес, указанный на странице производства: г. Краснодар, ул. Карла Гусника, д. 17/20 (р-н Витаминкомбината).',
      ], sources: [productionSource, contactsSource] },
    ],
    actions: [{ label: 'Обсудить производство', kind: 'phone', value: siteContacts['Краснодар'].phone }, { label: 'Маршрут к производству', kind: 'map', value: siteContacts['Краснодар'].mapUrl }, { label: 'Оборудование в каталоге', kind: 'route', value: '/catalog' }],
    sources: [productionSource, businessSource, contactsSource],
  },
  contacts: {
    title: 'Адреса и контакты',
    subtitle: 'Магазин, склад и связь с менеджером',
    sections: [
      { id: 'manager', title: 'Менеджер поможет', paragraphs: [
        'Уточните наличие и комплектацию, согласуйте коммерческое предложение, условия оплаты и доставку на объект.',
        'Перед самовывозом подтвердите склад отгрузки, готовность заказа и время визита.',
      ], sources: [contactsSource, businessSource] },
    ],
    actions: [{ label: 'Единая справочная · ' + supportPhoneLabel, kind: 'phone', value: supportPhone }],
    sources: [contactsSource],
  },
};

export function isSiteTopic(value: string | undefined): value is SiteTopic {
  return siteTopics.some(topic => topic === value);
}

export function getSiteContact(city: string): SiteContact | undefined {
  return Object.hasOwn(siteContacts, city) ? siteContacts[city] : undefined;
}
