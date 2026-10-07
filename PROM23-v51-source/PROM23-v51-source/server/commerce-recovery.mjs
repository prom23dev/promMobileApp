import { validateCommerceLegal, validateCommerceConsents } from './commerce-legal.mjs';
import { createHash } from 'node:crypto';
import { organizationIdFor } from './buyer-context.mjs';
const fingerprint = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const money = v => Number.isSafeInteger(v) && v >= 0;
const bounded = (v,max=500) => typeof v==='string' && v.length<=max && !/[\u0000-\u001f]/.test(v);
// These are source capabilities / preferences, not confirmed provider offers.
export const sourcePaymentMethods = [
 {id:'online',name:'Онлайн — Яндекс Пэй',sourceId:14,audience:'personal',description:'Картой или доступным способом в защищённой форме Яндекса'},
 {id:'split',name:'Яндекс Сплит',sourceId:14,instrument:'SPLIT',audience:'personal',description:'Доступность и график платежей подтверждает Яндекс'},
 {id:'receipt',name:'При получении',sourceId:17,audience:'personal',description:'Если доступно для выбранного способа получения'},
 {id:'invoice',name:'Оплата по счёту',sourceId:16,audience:'business',description:'Для компании или ИП, после выбора организации'},
];
export const sourceDeliveryMethods = [
 {id:'pickup',name:'Самовывоз из филиала',description:'Выбор склада и подтверждение готовности'},
 {id:'pvz',name:'Пункт выдачи',description:'Яндекс Маркет, СДЭК или доступный пункт перевозчика'},
 {id:'courier',name:'До двери или на объект',description:'Курьером; зависит от региона, веса и габаритов'},
 {id:'terminal',name:'Терминал транспортной компании',description:'Получение на терминале выбранного перевозчика'},
];
export function validateQuote(value, binding, now=Date.now(), cart) {
 if (!value || value.contextKey!==binding || typeof value.id!=='string' || !/^[A-Za-z0-9_-]{1,120}$/.test(value.id) || !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt)<=now || !['subtotalKopecks','discountKopecks','deliveryKopecks','totalKopecks'].every(k=>money(value[k])) || value.subtotalKopecks-value.discountKopecks+value.deliveryKopecks!==value.totalKopecks || value.currency!=='RUB' || typeof value.deliveryId!=='string' || typeof value.paymentId!=='string' || !Array.isArray(value.items)) throw new Error('INVALID_QUOTE');
 if (Date.parse(value.expiresAt) > now + 30*60*1000 || value.discountKopecks > value.subtotalKopecks || !value.items.length || value.items.length>500) throw new Error('INVALID_QUOTE');
 const seen=new Set();let subtotal=0;
 for(const item of value.items){
  if(!item||!bounded(item.productId,120)||!item.productId||seen.has(item.productId)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>999||!money(item.unitPriceKopecks)||!money(item.lineTotalKopecks)||item.lineTotalKopecks!==item.unitPriceKopecks*item.quantity)throw new Error('INVALID_QUOTE_ITEMS');
  seen.add(item.productId);subtotal+=item.lineTotalKopecks;
  if(cart&&!cart.some(line=>line.productId===item.productId&&line.quantity===item.quantity))throw new Error('QUOTE_CART_MISMATCH');
 }
 if(!money(subtotal)||subtotal!==value.subtotalKopecks||(cart&&cart.length!==value.items.length))throw new Error('QUOTE_CART_MISMATCH');
 return value;
}
export function createCommerceRecovery({db,runtime,catalog,fail,now=Date.now,getLocation}) {
 db.exec('CREATE TABLE IF NOT EXISTS commerce_drafts (session_key TEXT NOT NULL,context TEXT NOT NULL,json TEXT NOT NULL,PRIMARY KEY(session_key,context));');
 const read=db.prepare('SELECT json FROM commerce_drafts WHERE session_key=? AND context=?');
 const write=db.prepare('INSERT INTO commerce_drafts(session_key,context,json) VALUES(?,?,?) ON CONFLICT(session_key,context) DO UPDATE SET json=excluded.json');
 const sync=s=>{const row=db.prepare('SELECT state_json FROM sessions WHERE token_hash=?').get(s.tokenHash);if(!row)fail(401,'SESSION_EXPIRED','Сессия завершена. Обновите страницу.');s.state=JSON.parse(row.state_json)};
 const fresh=()=>({delivery:'',payment:'',address:'',pickupId:'',pod:'',etag:'',office:'',comment:'',coupon:'',quote:null});
 const draftFor=s=>{const row=read.get(s.tokenHash,s.state.context);return row?{...fresh(),...JSON.parse(row.json)}:fresh()};
 const save=(s,d)=>write.run(s.tokenHash,s.state.context,JSON.stringify(d));
 const sourceCart=s=>s.state.carts[s.state.context].filter(l=>l.selected!==false).map(({productId,quantity})=>({productId,quantity}));
 const scope=(s,location,d)=>({context:s.state.context,organizationId:organizationIdFor(s.state.context),cart:sourceCart(s),settlementId:location.settlement?.id??null,locationVersion:location.version,delivery:d.delivery,payment:d.payment,address:d.address,pickupId:d.pickupId,pod:d.pod,etag:d.etag,office:d.office,comment:d.comment,coupon:d.coupon});
 const key=(s,l,d)=>fingerprint(scope(s,l,d));
 function expect(s,body){if(body.expectedContext!==s.state.context)fail(409,'CONTEXT_CHANGED','Режим покупок изменился. Обновите страницу.');}
 function summary(s,location){sync(s);location=getLocation?.(s)??location;const d=draftFor(s);const contextKey=key(s,location,d);if(d.quote&&(d.quote.contextKey!==contextKey||Date.parse(d.quote.expiresAt)<=now())){d.quote=null;save(s,d)}
 const subtotal=sourceCart(s).reduce((sum,line)=>sum+(catalog.products.find(p=>p.id===line.productId)?.priceKopecks??0)*line.quantity,0);
 return {draft:d,contextKey,subtotalKopecks:subtotal,totalKopecks:d.quote?.totalKopecks??null,priceStatus:d.quote?'confirmed':'snapshot',deliveryMethods:sourceDeliveryMethods,paymentMethods:sourcePaymentMethods.filter(m=>m.audience===(s.state.context==='personal'?'personal':'business'))};}
 async function quote(s,location,body){expect(s,body);if(body.expectedLocationVersion!==location.version)fail(409,'STALE_LOCATION','Место доставки изменилось. Повторите расчёт.');
 const d=draftFor(s);for(const field of ['delivery','payment','address','pickupId','pod','etag','office','comment'])if(body[field]!==undefined){if(!bounded(body[field]))fail(400,'INVALID_FIELD','Проверьте данные доставки.');d[field]=body[field]}
 if(d.delivery&&!sourceDeliveryMethods.some(m=>m.id===d.delivery))fail(400,'INVALID_DELIVERY','Выберите способ получения.');
 if(d.payment&&!summary(s,location).paymentMethods.some(m=>m.id===d.payment))fail(400,'INVALID_PAYMENT','Этот способ оплаты не подходит покупателю.');
 d.quote=null;save(s,d);
 if(!sourceCart(s).length)fail(409,'EMPTY_CART','Добавьте товары в корзину.');
 if(!location.settlement)fail(409,'SETTLEMENT_REQUIRED','Выберите населённый пункт.');
 if(!d.delivery||!d.payment)fail(400,'METHOD_REQUIRED','Выберите получение и оплату.');
 if(s.state.context!=='personal'&&!organizationIdFor(s.state.context))fail(409,'ORGANIZATION_REQUIRED','Выберите свою организацию для расчёта заказа.');
 if(d.delivery!=='courier'&&!d.pickupId.trim())fail(400,'PICKUP_REQUIRED','Выберите склад, пункт выдачи или терминал.');
 if(d.delivery==='courier'&&!d.address.trim())fail(400,'ADDRESS_REQUIRED','Укажите улицу и дом.');
 const contextKey=key(s,location,d);const quotedCart=sourceCart(s).map(line=>({...line}));
 const result=await runtime.call('cart.quote',{sessionKey:s.tokenHash,...scope(s,location,d),contextKey});
 let q;try{q=validateQuote(result.quote,contextKey,now(),quotedCart);validateCommerceLegal(q.legal,s.state.context!=='personal');if(q.paymentId!==String(sourcePaymentMethods.find(m=>m.id===d.payment).sourceId)||(d.pickupId&&q.deliveryOptionId!==d.pickupId))throw new Error('QUOTE_METHOD_MISMATCH')}catch{fail(502,'QUOTE_INVALID','Магазин не подтвердил расчёт. Повторите попытку.');}
 // An asynchronous response cannot overwrite a newer request's address/coupon/selection.
 sync(s);location=getLocation?.(s)??location;
 if(key(s,location,draftFor(s))!==contextKey)fail(409,'QUOTE_STALE','Параметры заказа изменились. Повторите расчёт.');
 d.quote=q;save(s,d);return summary(s,location);
 }
 async function options(s,location,body){
  expect(s,body);if(body.expectedLocationVersion!==location.version)fail(409,'STALE_LOCATION','Место доставки изменилось.');
  if(!location.settlement)fail(409,'SETTLEMENT_REQUIRED','Выберите населённый пункт.');
  if(!sourceCart(s).length)fail(409,'EMPTY_CART','Добавьте товары в корзину.');
  const d=draftFor(s);for(const field of ['delivery','payment','address','pod','etag','office','comment'])if(body[field]!==undefined){if(!bounded(body[field]))fail(400,'INVALID_FIELD','Проверьте данные получения.');d[field]=body[field]}
  if(!sourceDeliveryMethods.some(m=>m.id===d.delivery))fail(400,'INVALID_DELIVERY','Выберите способ получения.');
  if(s.state.context!=='personal'&&!organizationIdFor(s.state.context))fail(409,'ORGANIZATION_REQUIRED','Выберите свою организацию.');
  d.pickupId='';d.quote=null;save(s,d);const contextKey=key(s,location,d);
  const result=await runtime.call('checkout.options',{sessionKey:s.tokenHash,...scope(s,location,d),contextKey});
  const validText=v=>bounded(v,500)&&!!v.trim();
  if(!result||result.contextKey!==contextKey||!Number.isFinite(Date.parse(result.expiresAt))||Date.parse(result.expiresAt)<=now()||Date.parse(result.expiresAt)>now()+30*60*1000||!Array.isArray(result.deliveryOptions)||result.deliveryOptions.length>500||!Array.isArray(result.paymentMethods)||result.paymentMethods.length>20)fail(502,'OPTIONS_INVALID','Не удалось подтвердить способы получения.');
  const ids=new Set();const deliveryOptions=result.deliveryOptions.map(o=>{
   if(!o||!validText(o.id)||ids.has(o.id)||o.method!==d.delivery||!validText(String(o.sourceId??''))||!validText(o.provider)||!validText(o.name)||(d.delivery!=='courier'&&!validText(o.address))||(o.priceKopecks!==undefined&&!money(o.priceKopecks))||(o.period!==undefined&&!validText(o.period)))fail(502,'OPTIONS_INVALID','Не удалось подтвердить пункт получения.');
   ids.add(o.id);return {id:o.id,method:o.method,sourceId:String(o.sourceId),provider:o.provider,name:o.name,address:o.address??'',...(o.pointId?{pointId:String(o.pointId)}:{}),...(o.priceKopecks!==undefined?{priceKopecks:o.priceKopecks}:{}),...(o.period?{period:o.period}:{})};
  });
  const methods=summary(s,location).paymentMethods;const paymentMethods=result.paymentMethods.map(m=>{
   const source=methods.find(x=>x.id===m.id);if(!source||String(source.sourceId)!==String(m.sourceId)||!validText(m.name)||!bounded(m.description??'',500))fail(502,'OPTIONS_INVALID','Не удалось подтвердить способы оплаты.');
   return {id:m.id,sourceId:source.sourceId,name:m.name,description:m.description??''};
  });
  if(new Set(paymentMethods.map(m=>m.id)).size!==paymentMethods.length)fail(502,'OPTIONS_INVALID','Не удалось подтвердить способы оплаты.');
  sync(s);location=getLocation?.(s)??location;if(key(s,location,draftFor(s))!==contextKey)fail(409,'OPTIONS_STALE','Параметры получения изменились. Повторите поиск.');
  return {contextKey,expiresAt:result.expiresAt,deliveryOptions,paymentMethods};
 }
 async function coupon(s,location,body){expect(s,body);if(!bounded(body.code,100))fail(400,'INVALID_COUPON','Промокод должен содержать не более 100 символов.');const d=draftFor(s);const code=body.code.trim();
 if(!code){d.coupon='';d.quote=null;save(s,d);return summary(s,location)}
 const contextKey=key(s,location,d);
 const result=await runtime.call('cart.coupon',{sessionKey:s.tokenHash,...scope(s,location,d),contextKey,code});
 if(result.status!=='applied'||result.code!==code)fail(422,['expired','not-applicable','invalid'].includes(result.status)?'COUPON_'+result.status.toUpperCase().replace('-','_'):'COUPON_INVALID',result.status==='expired'?'Срок действия промокода истёк.':result.status==='not-applicable'?'Промокод не подходит для этой корзины.':'Промокод не найден или недействителен.');
 sync(s);location=getLocation?.(s)??location;
 if(key(s,location,draftFor(s))!==contextKey)fail(409,'COUPON_STALE','Корзина изменилась. Повторите проверку промокода.');
 d.coupon=code;d.quote=null;save(s,d);return summary(s,location);
 }
 async function submit(s,location,body,idempotencyKey){expect(s,body);
 const d=draftFor(s);const receiptKey=fingerprint(body);
 if(d.completed && d.completed.idempotencyKey===idempotencyKey){if(d.completed.receiptKey!==receiptKey)fail(409,'IDEMPOTENCY_CONFLICT','Параметры заказа изменились.');return d.completed.result;}
const summaryValue=summary(s,location);const q=summaryValue.draft.quote;
 if(!q||q.id!==body.quoteId)fail(409,'QUOTE_REQUIRED','Сначала получите актуальный расчёт заказа.');
 if(!bounded(body.name,150)||!body.name.trim()||!bounded(body.email,150)||!/^\S+@\S+\.\S+$/.test(body.email)||!bounded(body.phone,30)||body.phone.replace(/\D/g,'').length<10)fail(400,'CONTACT_REQUIRED','Проверьте имя, телефон и email получателя.');
 try{validateCommerceLegal(q.legal,s.state.context!=='personal')}catch{fail(409,'LEGAL_CONTEXT_REQUIRED','Не подтверждены продавец и условия сделки. Запросите предложение у магазина.');}
 try{validateCommerceConsents(body.consents,s.state.context!=='personal')}catch{fail(422,'CONSENT_REQUIRED','Отметьте обязательные согласия и ознакомьтесь с документами.');}
 if(!/^[A-Za-z0-9_-]{10,120}$/.test(idempotencyKey??''))fail(400,'IDEMPOTENCY_REQUIRED','Обновите оформление заказа.');
 const orderedContext=s.state.context;const orderedCart=sourceCart(s);
 const result=await runtime.call('order.submit',{sessionKey:s.tokenHash,...scope(s,location,d),contextKey:summaryValue.contextKey,quoteId:q.id,contact:{name:body.name,email:body.email,phone:body.phone},consents:body.consents},{idempotencyKey});
 if(result.status!=='accepted'||!bounded(result.reference,100)||!result.reference)fail(502,'ORDER_UNCONFIRMED','Не удалось подтвердить создание заказа. Проверьте историю перед повторной отправкой.');
 const persisted=read.get(s.tokenHash,orderedContext);const completed=persisted?JSON.parse(persisted.json).completed:null;
 if(completed?.idempotencyKey===idempotencyKey&&completed.receiptKey===receiptKey)return completed.result;
 const receipt={status:'accepted',reference:result.reference,legal:q.legal};
 // Persist receipt and remove only ordered quantities together; retain unselected and newly added units.
 sync(s);
 s.state.carts[orderedContext]=s.state.carts[orderedContext].flatMap(line=>{const bought=orderedCart.find(x=>x.productId===line.productId);if(!bought)return [line];const quantity=Math.max(0,line.quantity-bought.quantity);return quantity?[{...line,quantity}]:[]});
 db.exec('BEGIN IMMEDIATE');try{
 db.prepare('UPDATE sessions SET state_json=? WHERE token_hash=?').run(JSON.stringify(s.state),s.tokenHash);
 d.completed={idempotencyKey,receiptKey,result:receipt};d.quote=null;
 write.run(s.tokenHash,orderedContext,JSON.stringify(d));db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 return receipt;
 }
 return {summary,quote,coupon,submit,options,deleteSession:key=>db.prepare('DELETE FROM commerce_drafts WHERE session_key=?').run(key)};
}
