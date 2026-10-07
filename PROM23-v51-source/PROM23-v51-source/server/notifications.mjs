// Preview inbox is derived from committed test orders; it never creates a real mailing.
export const preferenceKeys = ['pushOrders', 'pushMarketing', 'emailOrders', 'emailMarketing', 'smsOrders', 'smsMarketing'];
export const defaultPreferences = Object.fromEntries(preferenceKeys.map(key => [key, false]));
export function createNotificationStore(db, fail, now = Date.now) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
      context TEXT NOT NULL, json TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY (session_hash, context)
    );
    CREATE TABLE IF NOT EXISTS notification_reads (
      session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
      context TEXT NOT NULL, notification_id TEXT NOT NULL,
      PRIMARY KEY (session_hash, context, notification_id)
    );
  `);
  const preferences = session => {
    const row = db.prepare('SELECT json FROM notification_preferences WHERE session_hash = ? AND context = ?').get(session.tokenHash, session.state.context);
    return row ? JSON.parse(row.json) : { ...defaultPreferences };
  };
  const inbox = session => {
    const readIds = new Set(db.prepare('SELECT notification_id FROM notification_reads WHERE session_hash = ? AND context = ?').all(session.tokenHash, session.state.context).map(row => row.notification_id));
    const orders = db.prepare('SELECT json FROM orders WHERE session_hash = ? AND context = ?').all(session.tokenHash, session.state.context).map(row => JSON.parse(row.json));
    const items = orders.flatMap(order => {
      const events = [{ suffix: 'created', title: 'Тестовый заказ оформлен', body: `Заказ ${order.number} сохранён. Откройте состав и получение.`, createdAt: order.createdAt }];
      if (order.cancelledAt) events.push({ suffix: 'cancelled', title: 'Тестовый заказ отменён', body: `Заказ ${order.number} отменён.`, createdAt: order.cancelledAt });
      return events.map(event => ({ id: `${order.id}:${event.suffix}`, kind: 'order', title: event.title, body: event.body, createdAt: event.createdAt, orderId: order.id, context: order.context, read: readIds.has(`${order.id}:${event.suffix}`) }));
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    return { items, preferences: preferences(session), mode: 'local-sandbox', channels: { push: 'not-configured', email: 'not-connected', sms: 'not-connected' } };
  };
  const checkContext = (session, body) => {
    if (!body || body.expectedContext !== session.state.context) fail(409, 'STALE_CONTEXT', 'Покупатель изменился. Обновите уведомления.');
  };
  return {
    inbox,
    savePreferences(session, body) {
      checkContext(session, body);
      if (Object.keys(body).some(k => !['expectedContext', 'preferences'].includes(k)) || !body.preferences || Array.isArray(body.preferences) || Object.keys(body.preferences).length !== preferenceKeys.length || preferenceKeys.some(k => typeof body.preferences[k] !== 'boolean')) {
        fail(400, 'INVALID_PREFERENCES', 'Проверьте настройки уведомлений.');
      }
      const value = Object.fromEntries(preferenceKeys.map(k => [k, body.preferences[k]]));
      db.prepare('INSERT INTO notification_preferences(session_hash, context, json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(session_hash, context) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at').run(session.tokenHash, session.state.context, JSON.stringify(value), new Date(now()).toISOString());
      return { preferences: value, mode: 'local-sandbox', consentRecorded: false, message: 'Сохранены настройки тестовой версии. Реальные подписки магазина не изменены.' };
    },
    markRead(session, body) {
      checkContext(session, body);
      if (Object.keys(body).some(k => !['expectedContext', 'id'].includes(k)) || typeof body.id !== 'string' || body.id.length > 80) fail(400, 'INVALID_NOTIFICATION', 'Некорректное уведомление.');
      if (!inbox(session).items.some(item => item.id === body.id)) fail(404, 'NOTIFICATION_NOT_FOUND', 'Уведомление не найдено.');
      db.prepare('INSERT OR IGNORE INTO notification_reads(session_hash, context, notification_id) VALUES (?, ?, ?)').run(session.tokenHash, session.state.context, body.id);
      return { read: true };
    },
  };
}
