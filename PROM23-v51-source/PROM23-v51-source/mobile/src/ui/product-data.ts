import type { Product } from '../domain';

// Raw import keeps every source field; the shopper sees product properties.
const administrative = /^(?:H1$|Meta Description$|SEO|index$|Активность$|Под заказ в регионе$|Статус данных$|Исходн|Основание сопоставления$|Уверенность сопоставления$|Рекомендуемое наименование$|Официальная серия|Официальная страница$|Официальный паспорт PDF$|Источник|Спорный вопрос$|Цена региона|Не выводить)/i;
export const readableSpecLabel = (label: string) => label.replace(/\s+\/\s+(?:PROP_[A-Za-z0-9_]+|[A-Z_]{3,})$/, '');
export function displaySpecs(product: Product) {
  const seen = new Set<string>();
  return product.specs.filter(spec => !administrative.test(spec.label)).map(spec => ({ ...spec, label: readableSpecLabel(spec.label) })).filter(spec => {
    const key = spec.label + '\u0000' + spec.value;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
