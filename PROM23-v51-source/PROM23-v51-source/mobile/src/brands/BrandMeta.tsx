import React, { useEffect } from 'react';
import Head from 'expo-router/head';
import { Platform } from 'react-native';
import type { Brand, BrandProducts } from './types';
export const brandIntro='Российские и зарубежные бренды строительного, складского и промышленного оборудования, представленные в ассортименте ГК «Промышленник».';
export function BrandMeta({brand,page}:{brand?:Brand;page?:BrandProducts}) {
 const origin='https://www.prom23.ru',url=origin+(brand?.detailUrl??'/brands/');
 const title=brand?.seoTitle??'Бренды строительного оборудования | Промышленник',description=brand?.shortDescription??brandIntro;
 const crumbs=[{name:'Главная',item:origin+'/'},{name:'Бренды',item:origin+'/brands/'},...(brand?[{name:brand.name,item:url}]:[])];
 const graph=[{'@type':'CollectionPage','@id':url+'#page',url,name:title,description,...(brand?{about:{'@id':url+'#brand'}}:{})},{'@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,...c}))},...(brand?[{'@type':'Brand','@id':url+'#brand',name:brand.name,alternateName:brand.alternateNames,description,logo:origin+brand.logo,url,...(brand.sameAs.length?{sameAs:brand.sameAs}:{})}]:[]),...(brand&&page?.products.length?[{'@type':'ItemList',numberOfItems:page.total,itemListElement:page.products.map((p,i)=>({'@type':'ListItem',position:page.offset+i+1,url:origin+'/product/'+p.id,item:{'@type':'Product',name:p.name,sku:p.sku,url:origin+'/product/'+p.id,brand:{'@type':'Brand',name:brand.name}}}))}]:[])];
 useEffect(()=>{if(Platform.OS==='web')document.querySelectorAll('[data-brand-static]').forEach(node=>{
  // Helmet updates document.title in place, adopting the initial title node.
  if(node.tagName==='TITLE')node.removeAttribute('data-brand-static');else node.remove();
 });},[]);
 return <Head><title>{title}</title><meta name="description" content={description}/><meta name="robots" content={process.env.EXPO_PUBLIC_BRANDS_INDEXABLE==='true'?'index, follow':'noindex, nofollow'}/><link rel="canonical" href={url}/><meta property="og:title" content={title}/><meta property="og:description" content={description}/><meta property="og:url" content={url}/>{brand&&<meta property="og:image" content={origin+brand.logo}/>}<script type="application/ld+json">{JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script></Head>;
}
