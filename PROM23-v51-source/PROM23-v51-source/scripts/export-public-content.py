#!/usr/bin/env python3
"""Exports the trusted curated TypeScript JSON literal, never executes site PHP/JS."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
s=(root/'mobile/src/content/sitePages.ts').read_text()
start=s.index('export const sitePages:');start=s.index('=',start)+1
pages,_=json.JSONDecoder().raw_decode(s[start:].lstrip())
rows=[]
for page in pages.values():
 rows.append({k:page[k] for k in ['slug','title','sourceUrl','sections','links'] if k in page})
(root/'data/site-pages.json').write_text(json.dumps({'schemaVersion':1,'sourceCheckedAt':'2026-09-11','sourceFile':'mobile/src/content/sitePages.ts','pages':rows},ensure_ascii=False,indent=2)+'\n')
print('Exported curated public pages:',len(rows))
