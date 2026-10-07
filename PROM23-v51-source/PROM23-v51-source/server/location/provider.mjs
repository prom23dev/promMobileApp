import { DatabaseSync } from 'node:sqlite';
import { statSync } from 'node:fs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const normalizeLocationQuery = value => value.normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/gu, 'е').trim().replace(/\s+/gu, ' ');
const letterWords = value => value.match(/[\p{L}\p{N}]+/gu) ?? [];
const keyboard = Object.fromEntries([..."qwertyuiop[]asdfghjkl;'zxcvbnm,."].map((letter, index) => [letter, [...'йцукенгшщзхъфывапролджэячсмитьбю'][index]]));
const transliteration = { shch: 'щ', sch: 'щ', yo: 'е', zh: 'ж', kh: 'х', ts: 'ц', ch: 'ч', sh: 'ш', yu: 'ю', ya: 'я', ye: 'е',
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс', y: 'ы', z: 'з' };
export function locationQueryVariants(query) {
  const normalized = normalizeLocationQuery(query);
  const values = [normalized];
  if (/[a-z]/u.test(normalized)) {
    values.push([...normalized].map(letter => keyboard[letter] ?? letter).join(''));
    values.push(normalized.replace(/shch|sch|yo|zh|kh|ts|ch|sh|yu|ya|ye|[a-z]/gu, value => transliteration[value]));
  }
  return [...new Set(values)];
}

export function editDistanceBounded(left, right, maximum = 2) {
  if (Math.abs(left.length - right.length) > maximum) return maximum + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  let beforePrevious;
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    let minimum = i;
    for (let j = 1; j <= right.length; j++) {
      let value = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) value = Math.min(value, beforePrevious[j - 2] + 1);
      current[j] = value; minimum = Math.min(minimum, value);
    }
    if (minimum > maximum) return maximum + 1;
    beforePrevious = previous; previous = current;
  }
  return previous[right.length];
}

function administrative(value) {
  return value === null || object(value) && UUID.test(value.id) && typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 240 && typeof value.typeShort === 'string' && value.typeShort.length <= 40;
}
export function isSettlement(value, version) {
  return object(value) && UUID.test(value.id) && value.fiasId === value.id && /^[1-9][0-9]{0,19}$/.test(value.garId) &&
    typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 240 &&
    typeof value.type === 'string' && value.type.length > 0 && value.type.length <= 100 &&
    typeof value.typeShort === 'string' && value.typeShort.length > 0 && value.typeShort.length <= 40 &&
    value.region !== null && administrative(value.region) && administrative(value.district) &&
    typeof value.fullName === 'string' && value.fullName.length > 0 && value.fullName.length <= 1000 &&
    value.providerVersion === version && !/[\u0000-\u001f\u007f]/u.test(JSON.stringify(value).replace(/\\[nrt]/gu, '\u0000'));
}

/** Replaceable read-only provider. It never calls DaData, Bitrix, or any network. */
export function createGarProvider({ databasePath, fail, now = Date.now, refreshMs = 3000 }) {
  let database;
  let signature;
  let checkedAt = -Infinity;
  let metadata;
  const statements = new Map();
  const unavailable = () => fail(503, 'LOCATION_PROVIDER_UNAVAILABLE', 'Справочник населённых пунктов временно недоступен.');
  const statement = query => {
    if (!statements.has(query)) statements.set(query, database.prepare(query));
    return statements.get(query);
  };
  function refresh() {
    if (now() - checkedAt < refreshMs) { if (!database) unavailable(); return; }
    checkedAt = now();
    let candidate;
    try {
      const stat = statSync(databasePath);
      if (!stat.isFile() || stat.size < 4096 || stat.size > 512 * 1024 * 1024) throw new Error();
      const current = `${stat.ino}:${stat.size}:${stat.mtimeMs}`;
      if (database && signature === current) return;
      candidate = new DatabaseSync(databasePath, { readOnly: true });
      candidate.exec('PRAGMA query_only=ON; PRAGMA cache_size=-2048; PRAGMA mmap_size=0; PRAGMA trusted_schema=OFF;');
      const value = JSON.parse(candidate.prepare("SELECT json FROM metadata WHERE key='provenance'").get()?.json);
      const coverage = value?.coverage;
      if (!object(value) || value.schemaVersion !== 1 || value.provider !== 'fns-gar' ||
          !/^[0-9]{8}$/.test(value.providerVersion) ||
          !/^https:\/\/fias-file\.nalog\.ru\/downloads\/[0-9]{4}\.[0-9]{2}\.[0-9]{2}\/gar_xml\.zip$/.test(value.sourceUrl) ||
          !object(coverage) || !['partial', 'complete'].includes(coverage.status) ||
          !Array.isArray(coverage.regionCodes) || coverage.regionCodes.some(code => !/^[0-9]{2}$/.test(code)) ||
          new Set(coverage.regionCodes).size !== coverage.regionCodes.length || coverage.loadedRegions !== coverage.regionCodes.length ||
          !Number.isSafeInteger(coverage.totalRegions) || coverage.totalRegions < coverage.loadedRegions || coverage.totalRegions > 120 ||
          !Number.isSafeInteger(coverage.settlementCount) || coverage.settlementCount < 1 || coverage.settlementCount > 1000000 ||
          !Number.isSafeInteger(coverage.excludedWithoutVerifiedChain) || coverage.excludedWithoutVerifiedChain < 0 ||
          (coverage.status === 'complete' && coverage.loadedRegions !== coverage.totalRegions) ||
          candidate.prepare('SELECT count(*) AS count FROM settlements').get().count !== coverage.settlementCount) throw new Error();
      // Preparing these verifies the public schema before replacing a previously valid handle.
      candidate.prepare('SELECT s.payload FROM settlement_terms t JOIN settlements s ON s.rowid=t.rowid WHERE settlement_terms MATCH ? LIMIT 1');
      candidate.prepare('SELECT s.payload FROM settlement_trigrams t JOIN settlements s ON s.rowid=t.rowid WHERE settlement_trigrams MATCH ? LIMIT 1');
      database?.close(); database = candidate; candidate = null;
      signature = current; metadata = value; statements.clear();
    } catch {
      candidate?.close(); database?.close(); database = null; metadata = null; statements.clear(); unavailable();
    }
  }
  function decode(row) {
    if (!row) return null;
    let value;
    try { value = JSON.parse(row.payload); } catch { unavailable(); }
    if (!isSettlement(value, metadata.providerVersion)) unavailable();
    const { id, fiasId, garId, name, type, typeShort, region, district, fullName, providerVersion } = value;
    return { id, fiasId, garId, name, type, typeShort, region, district, fullName, providerVersion };
  }
  function getById(id) {
    if (typeof id !== 'string' || !UUID.test(id)) fail(400, 'INVALID_SETTLEMENT_ID', 'Выберите населённый пункт из списка.');
    refresh();
    return decode(statement('SELECT payload FROM settlements WHERE id=?').get(id));
  }
  function exactLegacy(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 1000) return null;
    refresh();
    const normalized = normalizeLocationQuery(value);
    const nameRows = statement('SELECT payload FROM settlements WHERE normalized_name=? LIMIT 2').all(normalized);
    if (nameRows.length) return nameRows.length === 1 ? decode(nameRows[0]) : null;
    const words = letterWords(normalized);
    if (!words.length || words.length > 35) return null;
    const expression = words.map(word => `"${word}"`).join(' AND ');
    // A full legacy label is not a common path; this bounded candidate query avoids a table scan.
    const rows = statement('SELECT s.payload FROM settlement_terms t JOIN settlements s ON s.rowid=t.rowid WHERE settlement_terms MATCH ? LIMIT 100').all(expression);
    if (rows.length === 100) return null; // Ambiguity must never become an automatic first-result migration.
    const exact = rows.map(decode).filter(item => normalizeLocationQuery(item.fullName) === normalized);
    return exact.length === 1 ? exact[0] : null;
  }
  function suggest(rawQuery, limit = 10) {
    if (typeof rawQuery !== 'string' || rawQuery.length > 120 || /[\u0000-\u001f\u007f]/u.test(rawQuery) || !Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
      fail(400, 'INVALID_LOCATION_QUERY', 'Проверьте поисковый запрос.');
    }
    refresh();
    const query = normalizeLocationQuery(rawQuery);
    const variants = locationQueryVariants(query);
    const candidates = new Map();
    const add = (rows, scoreFor) => {
      for (const row of rows) {
        const item = decode(row); const score = scoreFor(item);
        if (!Number.isFinite(score)) continue;
        const existing = candidates.get(item.id);
        if (!existing || score < existing.score) candidates.set(item.id, { item, score });
      }
    };
    if (!query) {
      // Popular choices are verified registry records, not a list of service branches.
      for (const name of ['москва', 'санкт-петербург', 'краснодар', 'сочи', 'динская']) {
        add(statement('SELECT payload FROM settlements WHERE normalized_name=? ORDER BY id LIMIT 10').all(name), () => candidates.size);
      }
    } else {
      for (const [variantIndex, variant] of variants.entries()) {
        add(statement('SELECT payload FROM settlements WHERE normalized_name=? ORDER BY id LIMIT 100').all(variant), () => variantIndex * 2);
        add(statement('SELECT payload FROM settlements WHERE normalized_name>=? AND normalized_name<? ORDER BY normalized_name,id LIMIT 100').all(variant, `${variant}\uffff`), item => normalizeLocationQuery(item.name) === variant ? variantIndex * 2 : 10 + variantIndex * 2);
        const words = letterWords(variant);
        if (words.length && words.length <= 15) {
          const expression = words.map(word => `"${word}"*`).join(' AND ');
          add(statement('SELECT s.payload FROM settlement_terms t JOIN settlements s ON s.rowid=t.rowid WHERE settlement_terms MATCH ? ORDER BY rank LIMIT 100').all(expression), () => 20 + variantIndex * 2);
        }
        if (candidates.size === 0 && words.length === 1 && variant.length >= 4 && variant.length <= 60) {
          const trigrams = [...new Set(Array.from({ length: variant.length - 2 }, (_, index) => variant.slice(index, index + 3)))];
          const expression = trigrams.filter(value => /^[\p{L}\p{N}]{3}$/u.test(value)).map(value => `"${value}"`).join(' OR ');
          if (expression) add(statement('SELECT s.payload FROM settlement_trigrams t JOIN settlements s ON s.rowid=t.rowid WHERE settlement_trigrams MATCH ? ORDER BY rank LIMIT 150').all(expression), item => {
            const maximum = variant.length < 6 ? 1 : 2;
            const distance = editDistanceBounded(variant, normalizeLocationQuery(item.name), maximum);
            return distance <= maximum ? 30 + distance * 2 + variantIndex : Infinity;
          });
        }
      }
    }
    const items = [...candidates.values()].sort((a, b) => a.score - b.score || a.item.fullName.localeCompare(b.item.fullName, 'ru') || a.item.id.localeCompare(b.item.id)).slice(0, limit).map(entry => entry.item);
    return { items, query, coverage: structuredClone(metadata.coverage), providerVersion: metadata.providerVersion };
  }
  return {
    getById, suggest, exactLegacy,
    readiness() { refresh(); return structuredClone(metadata); },
    close() { database?.close(); database = null; checkedAt = -Infinity; statements.clear(); },
  };
}
