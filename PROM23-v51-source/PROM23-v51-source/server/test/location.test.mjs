import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGarProvider, normalizeLocationQuery, locationQueryVariants, editDistanceBounded } from '../location/provider.mjs';
import { createLocationService, locationSuggestions, locationDetailId } from '../location/service.mjs';
import { createApp } from '../app.mjs';

const seed = JSON.parse(readFileSync(new URL('./fixtures/gar-settlements.json', import.meta.url), 'utf8'));
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const error = (code, status) => value => value.code === code && (!status || value.status === status);
const settlement = name => seed.items.find(item => item.name === name);
const dinskaya = settlement('Динская');
const krasnodar = settlement('Краснодар');

function createIndex(path, items = seed.items) {
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE metadata(key TEXT PRIMARY KEY,json TEXT);
    CREATE TABLE settlements(id TEXT PRIMARY KEY,gar_id TEXT UNIQUE,name TEXT,normalized_name TEXT,region_code TEXT,payload TEXT);
    CREATE INDEX settlement_prefix ON settlements(normalized_name);
    CREATE VIRTUAL TABLE settlement_terms USING fts5(name,full_name,tokenize='unicode61 remove_diacritics 0');
    CREATE VIRTUAL TABLE settlement_trigrams USING fts5(name,tokenize='trigram');`);
  db.prepare('INSERT INTO metadata VALUES(?,?)').run('provenance', JSON.stringify({ schemaVersion: 1, provider: 'fns-gar', providerVersion: seed.providerVersion, sourceUrl: seed.sourceUrl,
    coverage: { status: 'partial', regionCodes: ['23','77','78'], totalRegions: 96, loadedRegions: 3, settlementCount: items.length, excludedWithoutVerifiedChain: 0 } }));
  for (const item of items) {
    const row = db.prepare('INSERT INTO settlements VALUES(?,?,?,?,?,?)').run(item.id, item.garId, item.name, normalizeLocationQuery(item.name), '23', JSON.stringify(item));
    db.prepare('INSERT INTO settlement_terms(rowid,name,full_name) VALUES(?,?,?)').run(row.lastInsertRowid, normalizeLocationQuery(item.name), normalizeLocationQuery(`${item.type} ${item.fullName}`));
    db.prepare('INSERT INTO settlement_trigrams(rowid,name) VALUES(?,?)').run(row.lastInsertRowid, normalizeLocationQuery(item.name));
  }
  db.close();
}

function fixture(t, cities = ['', '']) {
  const directory = mkdtempSync(join(tmpdir(), 'prom23-location-'));
  const indexPath = join(directory, 'gar.sqlite');
  const runtimePath = join(directory, 'runtime.sqlite');
  createIndex(indexPath);
  let clock = 1;
  let provider, db, service;
  function open() {
    provider = createGarProvider({ databasePath: indexPath, fail, now: () => clock });
    db = new DatabaseSync(runtimePath);
    db.exec(`PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,state_json TEXT);
      CREATE TABLE IF NOT EXISTS quotes(id TEXT PRIMARY KEY,session_hash TEXT,consumed_order TEXT);`);
    service = createLocationService({ db, provider, fail, now: () => clock });
  }
  open();
  for (const [index, city] of cities.entries()) db.prepare('INSERT INTO sessions VALUES(?,?)').run(`owner-${index}`, JSON.stringify({ city, context: 'personal', carts: { personal: [{ productId: 'kept', quantity: 2 }], 'organization-demo': [{ productId: 'b2b-kept', quantity: 3 }] } }));
  const sessions = cities.map((_, index) => ({ tokenHash: `owner-${index}` }));
  t.after(() => { provider.close(); db.close(); rmSync(directory, { recursive: true, force: true }); });
  return { directory, indexPath, sessions,
    get provider() { return provider; }, get service() { return service; }, get db() { return db; },
    advance: () => { clock += 4000; },
    reopen() { provider.close(); db.close(); open(); },
    select(session, item, extra = {}) { return service.select(session, { settlementId: item.id, expectedVersion: service.get(session).version, expectedContext: 'personal', ...extra }); },
  };
}

test('GAR fixture preserves verified station/village/settlement/hamlet/federal-city identities and administrative labels', t => {
  const f = fixture(t);
  assert.equal(dinskaya.id, '915703c4-731d-4ebe-b893-561d99982172');
  assert.equal(dinskaya.garId, '320266');
  for (const name of ['Динская','Молдовка','Верхнебаканский','Ленина','Москва','Санкт-Петербург']) {
    const results = f.provider.suggest(name, 20);
    assert.ok(results.items.some(item => item.name === name));
    assert.equal(results.coverage.status, 'partial');
    for (const item of results.items) assert.equal(item.id, item.fiasId);
  }
  assert.equal(f.provider.getById(dinskaya.id).district.name, 'Динской');
  assert.match(f.provider.getById(dinskaya.id).fullName, /ст-ца Динская/);
});

test('location search ranks real exact/prefix matches, accepts ё/e, typo, transliteration and wrong keyboard layout', t => {
  const f = fixture(t);
  for (const query of ['Динская', '  ДИНСКАЯ  ', 'динск', 'динскя']) assert.equal(f.provider.suggest(query).items[0].id, dinskaya.id);
  for (const query of ['krasnodar', 'rhfcyljlfh', 'Краснодао']) assert.equal(f.provider.suggest(query).items[0].id, krasnodar.id);
  assert.equal(f.provider.suggest('село Молдовка').items[0].name,'Молдовка');
  assert.equal(f.provider.suggest('станица Динская').items[0].name,'Динская');
  const yo = seed.items.find(item => item.name.includes('ё'));
  assert.ok(f.provider.suggest(yo.name.replaceAll('ё', 'е'), 20).items.some(item => item.id === yo.id));
  assert.deepEqual(f.provider.suggest('Несуществующийнаселенныйпункт123456').items, []);
  assert.ok(locationQueryVariants('krasnodar').includes('краснодар'));
  assert.equal(editDistanceBounded('динская','динскя'), 1);
  assert.equal(editDistanceBounded('краснодао','краснодар'), 1);
});

test('homonyms remain distinct, carry real chains, and cannot silently migrate to the first result', t => {
  const f = fixture(t, ['Ленина', dinskaya.fullName]);
  const names = f.provider.suggest('Ленина', 20).items.filter(item => item.name === 'Ленина');
  assert.equal(names.length, 4);
  assert.equal(new Set(names.map(item => item.fullName)).size, 4);
  assert.equal(f.provider.exactLegacy('Ленина'), null);
  assert.equal(f.service.get(f.sessions[0]).settlement, null);
  assert.equal(f.service.get(f.sessions[0]).migrationRequired, true);
  assert.equal(f.service.get(f.sessions[1]).settlement.id, dinskaya.id);
  assert.equal(f.service.get(f.sessions[1]).selectionSource, 'legacy-exact');
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM session_locations').get().n, 0, 'GET migration inference does not mutate storage');
});

test('search/route validation rejects control chars, oversized or duplicate queries, unknown keys and free-form IDs', t => {
  const f = fixture(t);
  for (const params of ['q=hi&q=there','foo=1','limit=0','limit=21','limit=01']) assert.throws(() => locationSuggestions(f.provider, new URLSearchParams(params), fail), error('INVALID_LOCATION_QUERY',400));
  for (const query of ['x'.repeat(121), 'тест\n']) assert.throws(() => f.provider.suggest(query), error('INVALID_LOCATION_QUERY',400));
  assert.throws(() => f.provider.getById('Динская'), error('INVALID_SETTLEMENT_ID',400));
  assert.equal(f.provider.getById('00000000-0000-0000-0000-000000000000'), null);
  assert.equal(locationDetailId(`/api/v1/locations/${dinskaya.id}`), dinskaya.id);
  assert.equal(locationDetailId(`/api/v1/locations/${dinskaya.id}/extra`), null);
  assert.equal(f.provider.suggest('',1).items.length, 1);
});

test('selection persists authoritative IDs, preserves both carts, revokes only unconsumed own quotes and isolates sessions', t => {
  const f = fixture(t);
  const [a,b] = f.sessions;
  f.db.prepare('INSERT INTO quotes VALUES(?,?,?)').run('old-a', a.tokenHash, null);
  f.db.prepare('INSERT INTO quotes VALUES(?,?,?)').run('paid-history-a', a.tokenHash, 'order-kept');
  f.db.prepare('INSERT INTO quotes VALUES(?,?,?)').run('old-b', b.tokenHash, null);
  const before = JSON.parse(f.db.prepare('SELECT state_json FROM sessions WHERE token_hash=?').get(a.tokenHash).state_json);
  const state = f.select(a,dinskaya);
  assert.equal(state.version,1); assert.equal(state.settlement.id,dinskaya.id);
  assert.equal(state.commerce.status,'unresolved'); assert.equal(state.commerce.serviceRegion,null);
  assert.deepEqual(state.commerce.warehouses,[]); assert.equal(state.cartValidation.checkoutEligible,false);
  const after = JSON.parse(f.db.prepare('SELECT state_json FROM sessions WHERE token_hash=?').get(a.tokenHash).state_json);
  assert.deepEqual(after.carts,before.carts); assert.equal(after.city,dinskaya.fullName);
  assert.deepEqual(f.db.prepare('SELECT id FROM quotes ORDER BY id').all().map(row=>row.id),['old-b','paid-history-a']);
  assert.equal(f.service.get(b).settlement,null);
  f.reopen();
  assert.equal(f.service.get(a).settlement.id,dinskaya.id); assert.equal(f.service.get(a).version,1);
});

test('CAS/context reject stale writes, body injection, unknown IDs and free text without changing selection', t => {
  const f = fixture(t); const a=f.sessions[0];
  f.select(a,dinskaya);
  const baseline=f.service.get(a);
  for(const [body,code] of [
    [{settlementId:krasnodar.id,expectedVersion:0,expectedContext:'personal'},'STALE_LOCATION'],
    [{settlementId:krasnodar.id,expectedVersion:1,expectedContext:'organization-demo'},'STALE_CONTEXT'],
    [{settlementId:'Новый город',expectedVersion:1,expectedContext:'personal'},'INVALID_SETTLEMENT_ID'],
    [{settlementId:'00000000-0000-0000-0000-000000000000',expectedVersion:1,expectedContext:'personal'},'SETTLEMENT_NOT_FOUND'],
    [{settlementId:krasnodar.id,name:'Forged',expectedVersion:1,expectedContext:'personal'},'INVALID_LOCATION_BODY'],
  ]) assert.throws(()=>f.service.select(a,body),error(code));
  assert.deepEqual(f.service.get(a),baseline);
});

test('B2C and B2B share geography without physical DEFAULT_CITY reset; revalidation reports unavailable without cart changes', t => {
  const f=fixture(t); const a=f.sessions[0]; f.select(a,dinskaya);
  const current=JSON.parse(f.db.prepare('SELECT state_json FROM sessions WHERE token_hash=?').get(a.tokenHash).state_json);
  current.context='organization-demo';
  f.db.prepare('UPDATE sessions SET state_json=? WHERE token_hash=?').run(JSON.stringify(current),a.tokenHash);
  assert.equal(f.service.get(a).settlement.id,dinskaya.id);
  assert.throws(()=>f.service.revalidate(a,{expectedVersion:1,expectedContext:'organization-demo'}),error('LOCATION_INTEGRATION_REQUIRED',503));
  assert.equal(f.db.prepare('SELECT state_json FROM sessions WHERE token_hash=?').get(a.tokenHash).state_json,JSON.stringify(current));
  assert.throws(()=>f.service.revalidate(a,{expectedVersion:0,expectedContext:'organization-demo'}),error('STALE_LOCATION',409));
});

test('recent choices deduplicate and cap at eight; deleting owner cascades location and revokes access', t => {
  const f=fixture(t); const a=f.sessions[0];
  for(const item of seed.items.slice(0,10)) f.select(a,item);
  const last=f.select(a,dinskaya);
  assert.equal(last.recent.length,8); assert.equal(last.recent[0].id,dinskaya.id);
  assert.equal(new Set(last.recent.map(item=>item.id)).size,8);
  f.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(a.tokenHash);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM session_locations').get().n,0);
  assert.throws(()=>f.service.get(a),error('UNAUTHORIZED',401));
});

test('missing, invalid or replaced official index fails closed or reloads atomically without keeping removed IDs', t => {
  const f=fixture(t); f.select(f.sessions[0],dinskaya);
  const replacement=join(f.directory,'replacement.sqlite');
  createIndex(replacement,seed.items.filter(item=>item.id!==dinskaya.id));
  renameSync(replacement,f.indexPath); f.advance();
  assert.equal(f.provider.getById(dinskaya.id),null);
  assert.equal(f.service.get(f.sessions[0]).settlement,null);
  assert.equal(f.service.get(f.sessions[0]).migrationRequired,true);
  rmSync(f.indexPath); f.advance();
  assert.throws(()=>f.provider.suggest('Динская'),error('LOCATION_PROVIDER_UNAVAILABLE',503));
  createIndex(f.indexPath); const db=new DatabaseSync(f.indexPath);
  db.prepare("UPDATE metadata SET json='{}'").run(); db.close(); f.advance();
  assert.throws(()=>f.provider.readiness(),error('LOCATION_PROVIDER_UNAVAILABLE',503));
});

async function httpFixture(t) {
  const directory=mkdtempSync(join(tmpdir(),'prom23-location-http-'));
  const garDatabasePath=join(directory,'gar.sqlite'); createIndex(garDatabasePath);
  const databasePath=join(directory,'runtime.sqlite');
  const catalog={products:[{id:'p1',sku:'TEST-1',name:'Fixture item',category:'Tools',kind:'tool',priceKopecks:10000,stock:5,unit:'шт.',specs:[]}]};
  let app,base;
  async function open(){app=createApp({databasePath,garDatabasePath,catalog}); await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${app.server.address().port}`;}
  await open();
  t.after(async()=>{await app.close();rmSync(directory,{recursive:true,force:true});});
  async function call(path,{method='GET',token,body,headers={}}={}){
    const response=await fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
    return {status:response.status,headers:response.headers,payload:response.status===204?null:await response.json()};
  }
  async function session(){const result=await call('/api/sessions',{method:'POST',body:{}});assert.equal(result.status,201);assert.equal(result.payload.data.state.city,'');return result.payload.data.token;}
  return {call,session,databasePath,reopen:async()=>{await app.close();await open();}};
}

test('HTTP exposes official suggestions/details with exact methods, query validation, noindex and existing origin/auth/body protections',async t=>{
  const f=await httpFixture(t);
  const suggestion=await f.call('/api/v1/locations/suggest?q=%D0%94%D0%B8%D0%BD%D1%81%D0%BA%D0%B0%D1%8F');
  assert.equal(suggestion.status,200);assert.equal(suggestion.payload.data.items[0].id,dinskaya.id);
  assert.equal(suggestion.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal((await f.call(`/api/v1/locations/${dinskaya.id}`)).payload.data.garId,'320266');
  assert.equal((await f.call('/api/v1/locations/suggest?q=a&q=b')).status,400);
  assert.equal((await f.call('/api/v1/locations/suggest',{method:'POST',body:{}})).status,405);
  assert.equal((await f.call('/api/v1/location')).status,401);
  const token=await f.session();
  const body={settlementId:dinskaya.id,expectedVersion:0,expectedContext:'personal'};
  assert.equal((await f.call('/api/v1/location',{method:'POST',token,body,headers:{Origin:'https://foreign.invalid'}})).status,403);
  assert.equal((await f.call('/api/v1/location',{method:'POST',token,body:{...body,oversize:'x'.repeat(32768)}})).status,413);
  assert.equal((await f.call('/api/v1/location',{token})).payload.data.version,0);
});

test('HTTP location lifecycle persists IDs and both session/cart boundaries; stale mutations and old free text cannot override it',async t=>{
  const f=await httpFixture(t); const a=await f.session(),b=await f.session();
  assert.equal((await f.call('/api/actions',{method:'POST',token:a,body:{type:'quantity',productId:'p1',quantity:2,expectedContext:'personal'}})).status,200);
  const chosen=await f.call('/api/v1/location',{method:'POST',token:a,body:{settlementId:dinskaya.id,expectedVersion:0,expectedContext:'personal'}});
  assert.equal(chosen.status,200);assert.equal(chosen.payload.data.version,1);
  const state=(await f.call('/api/state',{token:a})).payload.data;
  assert.equal(state.city,dinskaya.fullName);assert.deepEqual(state.carts.personal,[{productId:'p1',quantity:2}]);
  assert.equal((await f.call('/api/v1/location',{token:b})).payload.data.settlement,null);
  const old=await f.call('/api/actions',{method:'POST',token:a,body:{type:'city',city:'Придуманный город',expectedContext:'personal'}});
  assert.equal(old.payload.error.code,'SETTLEMENT_SELECTION_REQUIRED');
  const stale=await f.call('/api/v1/location',{method:'POST',token:a,body:{settlementId:krasnodar.id,expectedVersion:0,expectedContext:'personal'}});
  assert.equal(stale.status,409);assert.equal(stale.payload.error.code,'STALE_LOCATION');
  await f.reopen();assert.equal((await f.call('/api/v1/location',{token:a})).payload.data.settlement.id,dinskaya.id);
  const revalidation=await f.call('/api/v1/cart/revalidate-location',{method:'POST',token:a,body:{expectedVersion:1,expectedContext:'personal'}});
  assert.equal(revalidation.status,503);assert.equal(revalidation.payload.error.code,'LOCATION_INTEGRATION_REQUIRED');
  assert.equal((await f.call('/api/quotes',{method:'POST',token:a,body:{context:'personal',deliveryMethod:'pickup'}})).payload.error.code,'SHOP_INTEGRATION_REQUIRED');
  assert.equal((await f.call('/api/session',{method:'DELETE',token:a})).status,200);
  assert.equal((await f.call('/api/v1/location',{token:a})).status,401);
  assert.equal((await f.call('/api/v1/location',{token:b})).status,200);
});

test('HTTP legacy cities infer only unique verified names; invalid and homonymous labels stay unselected without GET writes',async t=>{
  const f=await httpFixture(t);const token=await f.session();
  const db=new DatabaseSync(f.databasePath);
  const row=db.prepare('SELECT token_hash,state_json FROM sessions').get();const state=JSON.parse(row.state_json);
  for(const name of ['Ленина','Новый придуманный город','Динская']){
    state.city=name;db.prepare('UPDATE sessions SET state_json=? WHERE token_hash=?').run(JSON.stringify(state),row.token_hash);
    const location=(await f.call('/api/v1/location',{token})).payload.data;
    assert.equal(location.settlement?.id??null,name==='Динская'?dinskaya.id:null);
    assert.equal(location.migrationRequired,name!=='Динская');
    assert.equal(db.prepare('SELECT count(*) AS n FROM session_locations').get().n,0);
  }
  db.close();
});
