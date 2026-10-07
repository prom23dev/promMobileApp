import type { ContextId } from './domain';
export const procurementExtensions = ['pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'] as const;
export const procurementLimits = { files: 10, bytes: 20 * 1024 * 1024, comment: 5000 };
export type ProcurementFile = { name: string; size?: number; uri: string; mimeType?: string; file?: Blob };
export type ProcurementRequest = {
  context: ContextId; mode: 'list' | 'selection';
  name: string; phone: string; email: string; company: string; inn: string; comment: string;
  settlementId: string | null; locationVersion: number; files: ProcurementFile[];
  consent: { name: string; accepted: boolean; documentIds: string[] }[];
};
export function procurementErrors(value: ProcurementRequest): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!value.name.trim() || value.name.length > 150) errors.name = 'Укажите ваше имя.';
  if (!/^\+?[\d\s()\-]{10,25}$/.test(value.phone.trim()) || value.phone.replace(/\D/g, '').length < 10) errors.phone = 'Укажите телефон с кодом страны.';
  if (!value.email.trim() || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email = 'Укажите электронную почту для предложения.';
  if (value.inn && !/^(?:\d{10}|\d{12})$/.test(value.inn)) errors.inn = 'ИНН должен содержать 10 или 12 цифр.';
  if (!value.company.trim() || value.company.length > 300) errors.company = 'Укажите компанию или ИП (до 300 символов).';
  if (!['list', 'selection'].includes(value.mode)) errors.mode = 'Выберите список или подбор оборудования.';
  if (!value.settlementId) errors.settlementId = 'Выберите населённый пункт из списка.';
  if (!value.comment.trim() && !value.files.length) errors.comment = 'Прикрепите спецификацию или опишите, что нужно.';
  if (value.comment.length > procurementLimits.comment) errors.comment = 'До 5000 символов.';
  if (value.files.length > procurementLimits.files || value.files.some(file => !file.name || file.name.length > 240 || /[\\/\r\n\x00-\x1f]/.test(file.name) || !Number.isSafeInteger(file.size) || file.size! < 1 || file.size! > procurementLimits.bytes || !procurementExtensions.some(ext => file.name.toLowerCase().endsWith('.' + ext)))) errors.files = 'До 10 файлов по 20 МБ: PDF, Excel, CSV, Word или фото. Размер файла должен быть известен.';
  return errors;
}
