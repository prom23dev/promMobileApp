import { readFileSync } from 'node:fs';
const checkoutRequirements = JSON.parse(readFileSync(new URL('./integrations/form-contracts.json', import.meta.url), 'utf8')).forms.checkout.consents;
const text=(v,max=2000)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u001f]/.test(v);
export function validateCommerceLegal(legal,business=false){
 const s=legal?.seller;
 if(!s||!['id','legalName','inn','ogrn','legalAddress','email','phone'].every(k=>text(s[k]))||!/^\d{10}(?:\d{2})?$/.test(s.inn)||!/^\d{13}(?:\d{2})?$/.test(s.ogrn)||(s.inn.length===10&&!/^\d{9}$/.test(s.kpp??'')))throw new Error('SELLER_REQUIRED');
 if(!text(legal.version,100)||!/^\/offer\/$|^https:\/\/[^\s]+$/.test(legal.url??'')||!/^[a-f0-9]{64}$/.test(legal.hash??''))throw new Error('LEGAL_VERSION_REQUIRED');
 if(business){if(!text(legal.contractNumber,100)||legal.contractStatus!=='signed'||legal.supplierId!==s.id)throw new Error('B2B_CONTRACT_REQUIRED');}
 else if(legal.documentType!=='offer'||legal.sellerInn!==s.inn)throw new Error('SELLER_MISMATCH');
 return legal;
}

export function validateCommerceConsents(value,business=false){
 const expected=checkoutRequirements.filter(c=>!business||!c.documents.includes('offer'));
 if(!Array.isArray(value)||value.length!==expected.length)throw new Error('CONSENT_REQUIRED');
 for(const item of expected){const selected=value.filter(c=>c?.name===item.name);if(selected.length!==1||selected[0].accepted!==true||!Array.isArray(selected[0].documentIds)||JSON.stringify([...selected[0].documentIds].sort())!==JSON.stringify([...item.documents].sort()))throw new Error('CONSENT_REQUIRED');}
 return value;
}
