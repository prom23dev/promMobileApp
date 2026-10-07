import { writeFileSync } from 'node:fs';
import { siteFormList } from '../src/forms/siteForms';
writeFileSync('../docs/form-route-map-v4.json', JSON.stringify({ version: '0.4.0', checkedAt: '2026-09-11', transportConnected: false, forms: siteFormList.map(form => ({ ...form, route: `/forms/${form.id}` })) }, null, 2) + '\n');
