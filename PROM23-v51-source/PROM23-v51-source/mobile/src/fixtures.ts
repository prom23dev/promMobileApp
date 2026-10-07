import type { Product } from './domain';

// Synthetic fixtures only. No products, prices or availability were exported from the live store.
export const categories = ['Все', 'Строительные леса', 'Вышки-туры', 'Лестницы', 'Оборудование'];
export const products: Product[] = [
  { id: 'demo-scaffold', sku: 'DEMO-001', name: 'Леса рамные, секция 2 × 3 м', category: 'Строительные леса', kind: 'scaffold', priceKopecks: 1245000, stock: 12, unit: 'компл.', specs: [{ label: 'Высота секции', value: '2 м' }, { label: 'Ширина секции', value: '3 м' }, { label: 'Материал', value: 'Сталь' }] },
  { id: 'demo-tower', sku: 'DEMO-002', name: 'Вышка-тура, площадка 1,2 × 2 м', category: 'Вышки-туры', kind: 'tower', priceKopecks: 2890000, stock: 6, unit: 'шт.', specs: [{ label: 'Рабочая площадка', value: '1,2 × 2 м' }, { label: 'Материал', value: 'Сталь' }, { label: 'Колёса', value: 'Со стопором' }] },
  { id: 'demo-ladder', sku: 'DEMO-003', name: 'Лестница алюминиевая, 3 секции', category: 'Лестницы', kind: 'ladder', priceKopecks: 875000, stock: 18, unit: 'шт.', specs: [{ label: 'Количество секций', value: '3' }, { label: 'Материал', value: 'Алюминий' }, { label: 'Тип', value: 'Универсальная' }] },
  { id: 'demo-mixer', sku: 'DEMO-004', name: 'Бетоносмеситель, барабан 180 л', category: 'Оборудование', kind: 'mixer', priceKopecks: 2490000, stock: 4, unit: 'шт.', specs: [{ label: 'Объём барабана', value: '180 л' }, { label: 'Питание', value: '220 В' }, { label: 'Тип', value: 'Гравитационный' }] },
  { id: 'demo-scaffold-wide', sku: 'DEMO-005', name: 'Леса рамные, комплект 6 × 6 м', category: 'Строительные леса', kind: 'scaffold', priceKopecks: 3870000, stock: 3, unit: 'компл.', specs: [{ label: 'Высота', value: '6 м' }, { label: 'Длина', value: '6 м' }, { label: 'Материал', value: 'Сталь' }] },
  { id: 'demo-tower-small', sku: 'DEMO-006', name: 'Вышка-тура компактная', category: 'Вышки-туры', kind: 'tower', priceKopecks: 1980000, stock: 0, unit: 'шт.', specs: [{ label: 'Рабочая площадка', value: '0,7 × 1,6 м' }, { label: 'Материал', value: 'Сталь' }] },
];
