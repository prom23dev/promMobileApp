import importlib.util, pathlib, tempfile, unittest
spec=importlib.util.spec_from_file_location('snapshot', pathlib.Path(__file__).with_name('import-product-details.py'))
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
class Snapshot(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();p.CACHE=pathlib.Path(self.tmp.name)
  self.product={'id':'prom-123','name':'Товар','sourceUrl':p.ORIGIN+'/catalog/item/'}
 def tearDown(self):self.tmp.cleanup()
 def page(self,html):
  (p.CACHE/'prom-123.html').write_text(html);return p.extract(self.product)
 def test_requires_exact_product_identity(self):
  with self.assertRaisesRegex(ValueError,'identity'):self.page('<div class="js--catalog-detail" data-product-id="9"></div>')
 def test_comments_do_not_enable_legacy_form_or_scripts_become_copy(self):
  r=self.page('''<div class="js--catalog-detail" data-product-id="123">
  <!-- <button data-url="/local/ajax/catalog/form-found-it-cheaper.php?id=123">Legacy</button> -->
  <div class="catalog-detail-params-popup"><div class="style"><p>Описание <strong>товара</strong>.</p><script>private()</script><p>Второй абзац.</p></div></div>
  <button data-url="/local/ajax/catalog/request-a-rent.php?id=123"></button></div>''')
  self.assertFalse(r['capabilities']['canRequestBetterPrice']);self.assertTrue(r['capabilities']['canRent']);self.assertFalse(r['capabilities']['canRequestQuote']);self.assertEqual(r['descriptionParagraphs'],['Описание товара.','Второй абзац.'])
 def test_gallery_uses_existing_mobile_srcset_and_preserves_original(self):
  r=self.page('''<div class="js--catalog-detail" data-product-id="123"><div class="catalog-detail-slider__item"><img src="/upload/a.jpg" srcset="/upload/720.jpg 720w, /upload/1280.jpg 1280w"></div><div class="catalog-detail-slider__item"><img src="https://untrusted.example/private.jpg"></div></div>''')
  self.assertEqual(len(r['gallery']),1);self.assertEqual(r['gallery'][0]['url'],p.ORIGIN+'/upload/720.jpg');self.assertEqual(r['gallery'][0]['originalUrl'],p.ORIGIN+'/upload/1280.jpg')
 def test_media_origin_and_query_rejected(self):
  for u in ['https://user:pass@prom.myfast.space/upload/a.jpg','https://prom.myfast.space/upload/a.jpg?token=test','http://prom.myfast.space/upload/a.jpg']:
   with self.assertRaises(ValueError):p.safe_url(u,'upload')
if __name__=='__main__':unittest.main()
