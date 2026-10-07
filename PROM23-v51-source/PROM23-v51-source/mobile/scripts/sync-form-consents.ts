import { readFileSync, writeFileSync } from 'node:fs';
import { siteForms, publicationForms, businessRequestConsents } from '../src/forms/siteForms';

// Preserve independently reviewed source field contracts; synchronize only the
// owner-approved consent UI with both validation boundaries.
for (const relative of ['../../server/integrations/form-contracts.json', '../../integrations/runtime/form-contracts.json']) {
  const path = new URL(relative, import.meta.url);
  const contract = JSON.parse(readFileSync(path, 'utf8'));
  for (const [id, form] of Object.entries(siteForms)) {
    if (!contract.forms[id]) throw new Error(`Missing reviewed contract: ${id}`);
    contract.forms[id].consents = form.consents;
    if(publicationForms.has(id)) contract.forms[id].fields = form.fields;
    contract.forms[id].purposeCode = id.replace(/-/g, '_').toUpperCase();
  }
  // Dedicated universal business request has its own explicit purpose.
  contract.forms.procurement.purposeCode = 'BUSINESS_REQUEST';
  contract.forms.procurement.consents = businessRequestConsents;
  writeFileSync(path, JSON.stringify(contract, null, 2) + '\n');
}
