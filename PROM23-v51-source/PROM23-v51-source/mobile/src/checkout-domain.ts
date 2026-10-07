import type { ContextId } from './domain';
export type CheckoutChoices={delivery:string;payment:string;address:string;pickupId:string;pod:string;etag:string;office:string;comment:string};
export type CheckoutQuote={id:string;contextKey:string;subtotalKopecks:number;discountKopecks:number;deliveryKopecks:number;totalKopecks:number;currency:'RUB';expiresAt:string;deliveryId:string;deliveryOptionId:string;deliveryLabel?:string;deliveryAddress?:string;paymentId:string;items:{productId:string;quantity:number;unitPriceKopecks:number;lineTotalKopecks:number}[];legal?:{seller:{id:string;legalName:string;inn:string;kpp?:string;ogrn:string;legalAddress:string;email:string;phone:string};version:string;hash:string;url:string;contractNumber?:string;contractStatus?:string}};
export type CheckoutSummary={draft:CheckoutChoices&{coupon:string;quote:CheckoutQuote|null};contextKey:string;subtotalKopecks:number;totalKopecks:number|null;priceStatus:'snapshot'|'confirmed';deliveryMethods:{id:string;name:string;description:string}[];paymentMethods:{id:string;name:string;description:string}[]};
export const emptyChoices:CheckoutChoices={delivery:'',payment:'',address:'',pickupId:'',pod:'',etag:'',office:'',comment:''};
export function checkoutScope(context:ContextId,version:number,cart:unknown){return JSON.stringify([context,version,cart]);}

export type CheckoutOptions={contextKey:string;expiresAt:string;deliveryOptions:{id:string;method:string;sourceId:string;provider:string;name:string;address:string;pointId?:string;priceKopecks?:number;period?:string}[];paymentMethods:{id:string;sourceId:number;name:string;description:string}[]};

export function pickCheckoutChoices(draft:CheckoutChoices):CheckoutChoices{return Object.fromEntries(Object.keys(emptyChoices).map(key=>[key,draft[key as keyof CheckoutChoices]])) as CheckoutChoices;}
