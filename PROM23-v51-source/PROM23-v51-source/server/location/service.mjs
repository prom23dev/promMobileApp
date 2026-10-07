const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
import { validBuyerContext } from '../buyer-context.mjs';
const exact = (value, keys) => object(value) && keys.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => keys.includes(key));
const commerce = () => ({ status: 'unresolved', serviceRegion: null, warehouses: [], deliveryMethods: [], paymentMethods: [], reason: 'BITRIX_MAPPING_REQUIRED' });
const cartValidation = settlement => ({ status: settlement ? 'required' : 'unavailable', checkoutEligible: false,
  reason: settlement ? 'BITRIX_REVALIDATION_REQUIRED' : 'SETTLEMENT_REQUIRED' });

/** Session-local geography only. It does not impersonate a Bitrix user or reprice a cart. */
export function createLocationService({ db, provider, fail, now = Date.now }) {
  db.exec(`CREATE TABLE IF NOT EXISTS session_locations (
    session_hash TEXT PRIMARY KEY REFERENCES sessions(token_hash) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK(version>=1), settlement_id TEXT NOT NULL,
    selection_source TEXT NOT NULL, recent_json TEXT NOT NULL, updated_at TEXT NOT NULL
  );`);
  const statements = new Map();
  const sql = query => {
    if (!statements.has(query)) statements.set(query, db.prepare(query));
    return statements.get(query);
  };
  function currentSession(tokenHash) {
    const row = sql('SELECT state_json FROM sessions WHERE token_hash=?').get(tokenHash);
    if (!row) fail(401, 'UNAUTHORIZED', 'Сессия недействительна.');
    return JSON.parse(row.state_json);
  }
  function get(session) {
    const current = currentSession(session.tokenHash);
    const row = sql('SELECT version,settlement_id,selection_source,recent_json FROM session_locations WHERE session_hash=?').get(session.tokenHash);
    if (!row) {
      const settlement = provider.exactLegacy(current.city);
      return { version: 0, settlement, recent: settlement ? [settlement] : [],
        selectionSource: settlement ? 'legacy-exact' : null, migrationRequired: !settlement,
        commerce: commerce(), cartValidation: cartValidation(settlement) };
    }
    const settlement = provider.getById(row.settlement_id);
    const ids = JSON.parse(row.recent_json);
    const recent = [...new Set(ids)].slice(0, 8).map(id => provider.getById(id)).filter(Boolean);
    return { version: row.version, settlement, recent, selectionSource: row.selection_source,
      migrationRequired: !settlement, commerce: commerce(), cartValidation: cartValidation(settlement) };
  }
  function expected(session, body, keys) {
    if (!exact(body, keys) || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0 || !validBuyerContext(body.expectedContext)) {
      fail(400, 'INVALID_LOCATION_BODY', 'Выберите населённый пункт и обновите состояние.');
    }
    const current = currentSession(session.tokenHash);
    if (current.context !== body.expectedContext) fail(409, 'STALE_CONTEXT', 'Режим покупок изменился. Обновите состояние.');
    const row = sql('SELECT version FROM session_locations WHERE session_hash=?').get(session.tokenHash);
    if ((row?.version ?? 0) !== body.expectedVersion) fail(409, 'STALE_LOCATION', 'Населённый пункт изменился. Обновите состояние.');
    return current;
  }
  function select(session, body) {
    // Reads and all writes are synchronous within one transaction, after the HTTP body has arrived.
    db.exec('BEGIN IMMEDIATE');
    try {
      const current = expected(session, body, ['settlementId', 'expectedVersion', 'expectedContext']);
      const settlement = provider.getById(body.settlementId);
      if (!settlement) fail(404, 'SETTLEMENT_NOT_FOUND', 'Выберите населённый пункт из актуального списка.');
      const before = get(session);
      const recent = [settlement.id, ...before.recent.map(item => item.id).filter(id => id !== settlement.id)].slice(0, 8);
      const version = body.expectedVersion + 1;
      if (!Number.isSafeInteger(version)) fail(409, 'LOCATION_VERSION_LIMIT', 'Состояние требует обновления.');
      sql(`INSERT INTO session_locations(session_hash,version,settlement_id,selection_source,recent_json,updated_at)
        VALUES(?,?,?,?,?,?) ON CONFLICT(session_hash) DO UPDATE SET version=excluded.version,
        settlement_id=excluded.settlement_id,selection_source=excluded.selection_source,recent_json=excluded.recent_json,updated_at=excluded.updated_at`)
        .run(session.tokenHash, version, settlement.id, 'explicit', JSON.stringify(recent), new Date(now()).toISOString());
      current.city = settlement.fullName; // Compatibility label only; never a commercial region ID.
      sql('UPDATE sessions SET state_json=? WHERE token_hash=?').run(JSON.stringify(current), session.tokenHash);
      // All purchase contexts depend on the location. Keep every cart and historical order,
      // but revoke unconsumed ephemeral quotes so the previous geography cannot be replayed.
      sql('DELETE FROM quotes WHERE session_hash=? AND consumed_order IS NULL').run(session.tokenHash);
      const result = get(session);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      if (db.isTransaction) db.exec('ROLLBACK');
      throw error;
    }
  }
  function revalidate(session, body) {
    expected(session, body, ['expectedVersion', 'expectedContext']);
    const state = get(session);
    if (!state.settlement) fail(409, 'SETTLEMENT_REQUIRED', 'Выберите населённый пункт.');
    fail(503, 'LOCATION_INTEGRATION_REQUIRED', 'Региональные цены, наличие и доставка требуют проверки магазина.');
  }
  return { get, select, revalidate };
}

/** Route registration data for the existing server. Authorization stays with app.mjs. */
export const LOCATION_METHODS = Object.freeze([
  ['/api/v1/locations/suggest', ['GET']], ['/api/v1/location', ['GET', 'POST']],
  ['/api/v1/cart/revalidate-location', ['POST']],
]);
export const locationDetailId = path => path.match(/^\/api\/v1\/locations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/)?.[1] ?? null;

export function locationSuggestions(provider, params, fail) {
  for (const key of params.keys()) {
    if (!['q', 'limit'].includes(key) || params.getAll(key).length !== 1) fail(400, 'INVALID_LOCATION_QUERY', 'Проверьте параметры поиска.');
  }
  const rawLimit = params.get('limit') ?? '10';
  if (!/^(?:[1-9]|1[0-9]|20)$/.test(rawLimit)) fail(400, 'INVALID_LOCATION_QUERY', 'Выберите размер списка от 1 до 20.');
  return provider.suggest(params.get('q') ?? '', Number(rawLimit));
}
