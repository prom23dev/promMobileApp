// Injectable pure boundary for isolated contract tests.
export type ShopRequestOptions={method?:string;body?:unknown;key?:string;signal?:AbortSignal};
export type ShopTransport=<T>(path:string,options?:ShopRequestOptions)=>Promise<T>;
export async function shopRequest<T>(path:string,options:ShopRequestOptions={}):Promise<T>{const {localRequest}=await import('./local');return localRequest<T>(path,options);}
