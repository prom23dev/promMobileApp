import type { SiteFormContext } from '../api/site';
import type { SiteFormDefinition, SiteFormField } from './siteForms';

export type ExpandedField = SiteFormField & { groupTitle?: string; repeat?: { group: string; key: string; sourceName: string } };

// The existing return contract stores circumstances per item. Include the
// buyer's transfer request there instead of inventing a carrier integration.
export function withReturnTransfer(fields: ExpandedField[], values: Record<string, unknown>): Record<string, unknown> {
  const method = String(values['ui:return-method'] ?? '').trim();
  const tracking = String(values['ui:return-tracking'] ?? '').trim();
  const details = [method && `Предпочтительный способ передачи: ${method}`, tracking && `Перевозчик и номер отправления: ${tracking}`].filter(Boolean).join('\n');
  if (!details) return values;
  const result = { ...values };
  for (const field of fields) if (field.repeat?.sourceName === 'comment') result[field.name] = [String(values[field.name] ?? '').trim(), details].filter(Boolean).join('\n\n');
  return result;
}
export function expandFields(definition: SiteFormDefinition, context: SiteFormContext, business: boolean, values: Record<string, unknown>): ExpandedField[] {
  const fields: ExpandedField[] = (context.fields ?? definition.fields)
    .filter(field => !field.audience || field.audience === (business ? 'business' : 'personal'))
    .map(field => ({ ...field, options: context.options?.[field.name] ?? field.options }));
  for (const group of definition.repeatedFields ?? []) {
    const selected = values['selected-products'];
    for (const item of context.repeatedItems?.[group.name] ?? []) {
      if (definition.fields.some(field => field.name === 'selected-products') && (!Array.isArray(selected) || !selected.includes(item.key))) continue;
      for (const [index, field] of group.fields.entries()) fields.push({ ...field,
        ...(field.name === 'quantity' && item.quantityMax !== undefined ? { maxValue: item.quantityMax } : {}),
        name: `${group.name}:${item.key}:${field.name}`, options: item.options?.[field.name] ?? field.options,
        groupTitle: index === 0 ? item.label : undefined,
        repeat: { group: group.name, key: item.key, sourceName: field.name },
      });
    }
  }
  return fields;
}
function utf8Bytes(value: string): number {
  let bytes = 0;
  for (const character of value) { const point = character.codePointAt(0)!; bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4; }
  return bytes;
}
export function formFieldErrors(fields: ExpandedField[], values: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.readOnly) continue;
    const value = values[field.name]; const text = typeof value === 'string' ? value.trim() : '';
    if (field.required && (!value || (typeof value === 'string' && !text) || (Array.isArray(value) && !value.length))) errors[field.name] = `Заполните поле «${field.label}».`;
    else if (field.minLength !== undefined && Array.from(text).length < field.minLength) errors[field.name] = `Введите не менее ${field.minLength} символов.`;
    else if (field.maxUtf8Bytes !== undefined && typeof value === 'string' && utf8Bytes(value) > field.maxUtf8Bytes) errors[field.name] = 'Сократите комментарий: текст превышает допустимый размер.';
    else if (field.type === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) errors[field.name] = 'Проверьте адрес электронной почты.';
    else if (field.type === 'tel' && text && text.replace(/\D/g, '').length < 10) errors[field.name] = 'Укажите телефон с кодом города или оператора.';
    else if (field.type === 'select' && (Array.isArray(value) ? value : text ? [text] : []).some(option => !field.options?.some(item => item.value === option))) errors[field.name] = 'Выберите значение из списка.';
    else if (field.type === 'otp' && text && !/^\d{6}$/.test(text)) errors[field.name] = 'Введите код из 6 цифр.';
    else if (field.name === 'password_repeat' && value !== values.password) errors[field.name] = 'Пароли не совпадают.';
    else if (field.type === 'number' && text && (field.repeat?.sourceName === 'quantity' ? !/^\d+(?:\.\d{1,3})?$/.test(text) || !Number.isFinite(Number(text)) : !/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)))) errors[field.name] = field.repeat?.sourceName === 'quantity' ? 'Укажите количество числом, до 3 знаков после точки.' : 'Введите целое число.';
    else if (field.type === 'number' && text && ((field.minValue !== undefined && Number(text) < field.minValue) || (field.maxValue !== undefined && Number(text) > field.maxValue))) errors[field.name] = `Укажите количество от ${field.minValue ?? 0} до ${field.maxValue ?? 'допустимого значения'}.`;
  }
  return errors;
}
export function serializeFields(fields: ExpandedField[], values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const groups: Record<string, Map<string, { key: string; values: Record<string, unknown> }>> = {};
  for (const field of fields) {
    if (field.readOnly) continue;
    const value = values[field.name] ?? (field.type === 'checkbox' ? false : undefined);
    if (value === undefined) continue;
    if (!field.repeat) result[field.name] = value;
    else {
      const { group, key, sourceName } = field.repeat;
      const rows = groups[group] ??= new Map();
      const row = rows.get(key) ?? { key, values: {} }; row.values[sourceName] = value; rows.set(key, row);
    }
  }
  for (const [name, rows] of Object.entries(groups)) result[name] = [...rows.values()];
  return result;
}
