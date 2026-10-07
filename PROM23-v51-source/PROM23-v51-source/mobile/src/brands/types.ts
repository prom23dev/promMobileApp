import type { Product } from '../domain';
export type BrandCategory = { id: string; name: string; count: number };
export type Brand = {
  id: string; name: string; canonicalName: string; alternateNames: string[]; xmlId: string; slug: string;
  logo: string; logoSource: string; logoDark?: boolean; productsVerified?: boolean; shortDescription: string; country?: string;
  foundedYear?: number; trademarkYear?: number; specialization: string[]; isOwnBrand: boolean;
  productCount: number | null; productCategories: BrandCategory[]; detailUrl: string; catalogUrl: string;
  officialWebsite?: string; sameAs: string[]; seoTitle: string; seoDescription: string; isActive: boolean; sort: number;
};
export type BrandList = { brands: Brand[]; importedAt: string };
export type BrandProducts = { brand: Brand; products: Product[]; total: number; allCount: number; offset: number; nextOffset: number | null; categories: BrandCategory[]; technicalLabel: string; technicalValues: string[] };
