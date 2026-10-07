import importlib.util,json,pathlib,tempfile,unittest
spec=importlib.util.spec_from_file_location('retention',pathlib.Path(__file__).resolve().parents[2]/'deploy/prune-releases.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class Retention(unittest.TestCase):
 def test_scoped_cadence(self):
  with tempfile.TemporaryDirectory() as folder:
   base=pathlib.Path(folder)
   for directory in ['releases','incoming','state']: (base/directory).mkdir()
   def release(number):
    name=f'v0.10-20260918-{number}';p=base/'releases'/name;(p/'deploy').mkdir(parents=True);(p/'deploy/release-manifest.json').write_text(json.dumps({'id':name}));(base/'incoming'/f'prom23-preview-{name}.tar.gz').write_bytes(b'archive');return name
   old,previous,current,future=[release(n) for n in [40,42,43,99]]
   (base/'current').symlink_to(base/'releases'/current)
   (base/'releases'/'unknown').mkdir();(base/'releases'/'v0.10-20260918-1').symlink_to(base/'state');(base/'state'/'runtime.sqlite').write_bytes(b'do not touch')
   result=mod.prune(base,previous,force=True);self.assertTrue(result['due']);self.assertTrue((base/'releases'/old).exists())
   mod.prune(base,previous,apply=True,force=True);self.assertFalse((base/'releases'/old).exists());self.assertTrue((base/'releases'/previous).exists());self.assertTrue((base/'releases'/future).exists())
   for number,due in [(44,False),(45,True)]:
    name=release(number);(base/'current').unlink();(base/'current').symlink_to(base/'releases'/name)
    result=mod.prune(base,current,apply=True);self.assertEqual(result['due'],due)
    self.assertFalse(mod.prune(base,current,apply=True)['due']);current=name
   self.assertEqual((base/'state'/'runtime.sqlite').read_bytes(),b'do not touch');self.assertTrue((base/'releases'/'unknown').exists());self.assertTrue((base/'releases'/'v0.10-20260918-1').is_symlink())
   self.assertFalse((base/'releases'/previous).exists())
unittest.main()
