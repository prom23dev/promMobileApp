import type { SiteFormField } from './siteForms';
import { formFieldErrors } from './formModel';
const text=(name:string,label:string,type:SiteFormField['type']='text',required=true,extra:Partial<SiteFormField>={}):SiteFormField=>({name,label,type,required,maxLength:300,...extra});
const choice=(name:string,label:string,options:string[],multiple=false):SiteFormField=>text(name,label,'select',true,{options:options.map(label=>({value:label,label})),multiple});
export const franchiseFields:SiteFormField[]=[
  text('first-name','Ваше имя'),text('phone','Телефон','tel',true,{placeholder:'+7 900 000-00-00',hint:'Укажите международный код: например, +7, +375, +995 или +374.'}),text('email','E-mail','email'),
  text('country','Страна','text',true,{placeholder:'Например, Россия или Беларусь'}),text('region','Город / регион','text',true,{placeholder:'Где вы планируете работать'}),
  choice('business-status','Есть действующий бизнес?',['Да','Нет']),text('company-name','Название компании','text',false),text('inn','ИНН / регистрационный номер','text',false),
  choice('warehouse-status','Есть склад или помещение?',['Да','Нет','Планирую']),text('warehouse-address','Адрес или город расположения','text',false),text('warehouse-phone','Телефон склада','tel',false),text('warehouse-schedule','График работы склада','text',false),
  choice('interests','Какие направления вам интересны?',['Строительные леса','Вышки-туры','Опалубка','Оборудование для бетонных работ','Оборудование для арматуры','Лестницы и стремянки','Складская техника','Грузоподъёмное оборудование','Другое'],true),
  text('about','Расскажите о себе или вашем бизнесе','textarea',false,{maxLength:3000}),
  text('has-warehouse','Есть склад','checkbox',false),
];
export function visibleFranchiseFields(values:Record<string,unknown>) { return franchiseFields.filter(f=>f.name!=='has-warehouse'&&(!['company-name','inn'].includes(f.name)||values['business-status']==='Да')&&(!['warehouse-address','warehouse-phone','warehouse-schedule'].includes(f.name)||values['warehouse-status']==='Да')).map(f=>({...f,required:f.required||(f.name==='warehouse-address'&&values['warehouse-status']==='Да')})); }
export function franchiseErrors(values:Record<string,unknown>) {
  const fields=visibleFranchiseFields(values),errors=formFieldErrors(fields,values);
  for(const key of ['phone','warehouse-phone']) { const v=String(values[key]??'').trim(); if(key==='warehouse-phone'&&values['warehouse-status']!=='Да')continue; if(v){delete errors[key];if(!/^\+[1-9][\d ()-]{6,24}$/.test(v)||v.replace(/\D/g,'').length<7||v.replace(/\D/g,'').length>15)errors[key]='Укажите телефон с кодом страны, начиная с +.';} }
  for(const key of ['country','region']) { const v=String(values[key]??'').trim(); if(v&&!/^[\p{L}\p{M}][\p{L}\p{M}\d .,()’'/-]{1,149}$/u.test(v))errors[key]='Укажите название текстом, от 2 до 150 символов.'; }
  return errors;
}
export function franchiseValues(values:Record<string,unknown>):Record<string,unknown> { return {...Object.fromEntries(visibleFranchiseFields(values).filter(f=>values[f.name]!==undefined).map(f=>[f.name,typeof values[f.name]==='string'?(values[f.name] as string).trim():values[f.name]])),'has-warehouse':values['warehouse-status']==='Да'}; }
