"""Offline importer boundary tests. No registry or other network requests are made."""
import importlib.util
import io
from pathlib import Path
import struct
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('gar_import', Path(__file__).with_name('import-gar.py'))
gar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gar)


class ImportBoundaryTests(unittest.TestCase):
    def archive(self, content=b'<ITEMS><ITEM OBJECTID="320266" ISACTIVE="1" PATH="1.320266" /></ITEMS>'):
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, 'w', compression=zipfile.ZIP_DEFLATED) as zipped:
            zipped.writestr('23/AS_ADM_HIERARCHY_TEST.XML', content)
        data = stream.getvalue()
        eocd = data.rfind(b'PK\x05\x06')
        row = struct.unpack_from('<4s4H2IH', data, eocd)
        entries = gar.parse_central_directory(data[row[6]:row[6] + row[5]])
        archive = object.__new__(gar.RemoteZip)
        archive.range = lambda start, size: data[start:start + size]
        archive.open_range = lambda start, size: io.BytesIO(data[start:start + size])
        return archive, next(iter(entries.values()))

    def test_zip_member_size_and_crc_verified(self):
        archive, entry = self.archive()
        values = list(gar.tags(archive.chunks(entry), 'ITEM'))
        self.assertEqual(values[0]['OBJECTID'], '320266')
        self.assertEqual(values[0]['PATH'], '1.320266')

    def test_crc_mismatch_rejected_before_success(self):
        archive, entry = self.archive()
        entry['crc'] ^= 1
        with self.assertRaisesRegex(ValueError, 'CRC'):
            list(archive.chunks(entry))

    def test_declared_size_overflow_rejected(self):
        archive, entry = self.archive()
        entry['size'] = 1
        with self.assertRaisesRegex(ValueError, 'declared size'):
            list(archive.chunks(entry))

    def test_external_xml_declaration_rejected(self):
        archive, entry = self.archive(b'<!DOCTYPE x SYSTEM "https://external.invalid/private"><ITEMS/>')
        with self.assertRaisesRegex(ValueError, 'declarations'):
            list(archive.chunks(entry))

    def test_chunk_boundaries_and_wanted_filter(self):
        raw = b'<ITEMS><ITEM OBJECTID="1" NAME="skip" /><ITEM OBJECTID="320266" NAME="A &amp; B" /></ITEMS>'
        values = list(gar.tags((raw[index:index + 7] for index in range(0, len(raw), 7)), 'ITEM', {'320266'}))
        self.assertEqual(values, [{'OBJECTID': '320266', 'NAME': 'A & B'}])

    def test_record_limit_rejects_malformed_unbounded_input(self):
        with self.assertRaisesRegex(ValueError, 'oversize'):
            list(gar.tags([b'<ITEM ' + b'x' * 33000], 'ITEM'))

    def test_url_allowlist_rejects_credentials_other_hosts_queries_and_non_https(self):
        for value in ['http://fias.nalog.ru/data', 'https://fias.nalog.ru.evil.invalid/data', 'https://user:password@fias.nalog.ru/data', 'https://fias.nalog.ru/data?token=not-a-real-token']:
            with self.assertRaises(ValueError):
                gar.checked_url(value)
        self.assertEqual(gar.checked_url('https://fias-file.nalog.ru/downloads/2026.09.11/gar_xml.zip'), 'https://fias-file.nalog.ru/downloads/2026.09.11/gar_xml.zip')

    def test_only_active_actual_supported_levels_are_candidates(self):
        accepted = {'ISACTUAL': '1', 'ISACTIVE': '1', 'LEVEL': '6'}
        self.assertTrue(gar.valid_object(accepted))
        for key, value in [('ISACTUAL', '0'), ('ISACTIVE', '0'), ('LEVEL', '8')]:
            self.assertFalse(gar.valid_object({**accepted, key: value}))


if __name__ == '__main__':
    unittest.main()
