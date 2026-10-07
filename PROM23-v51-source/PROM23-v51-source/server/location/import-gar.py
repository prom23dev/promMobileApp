#!/usr/bin/env python3
"""Import public FNS GAR settlements through bounded ZIP ranges; never execute source code.

Only active actual address objects at levels 1..6 and their administrative paths are
kept. The 41+ GB hierarchy XML is streamed, not written to disk. All members must
pass declared size and CRC before the region can be published.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import struct
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
import xml.etree.ElementTree as ET
import zlib

INFO_URL = 'https://fias.nalog.ru/WebServices/Public/GetLastDownloadFileInfo'
HOSTS = {'fias.nalog.ru', 'fias-file.nalog.ru'}
MAX_COMPRESSED = 6 * 1024**3
MAX_XML_MEMBER = 8 * 1024**3
GUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
OBJECT_ID = re.compile(rb'\bOBJECTID="([0-9]+)"')


def normalized(value):
    return ' '.join(unicodedata.normalize('NFKC', value).lower().replace('ё', 'е').split())


def checked_url(url):
    value = urllib.parse.urlsplit(url)
    if value.scheme != 'https' or value.hostname not in HOSTS or value.username or value.password or value.fragment or value.query:
        raise ValueError('Only public HTTPS FNS download URLs are accepted')
    return url


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, code, msg, headers, checked_url(newurl))


def request(url, headers=None):
    checked_url(url)
    opener = urllib.request.build_opener(SafeRedirect())
    for attempt in range(3):
        try:
            return opener.open(urllib.request.Request(url, headers=headers or {}), timeout=60)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(min(30, 3 * (attempt + 1)))


class RemoteZip:
    def __init__(self, url):
        self.url = checked_url(url)
        with request(url, {'Range': 'bytes=-131072'}) as response:
            if response.status != 206:
                raise ValueError('Server must support byte ranges; full archive download refused')
            match = re.fullmatch(r'bytes ([0-9]+)-([0-9]+)/([0-9]+)', response.headers.get('Content-Range', ''))
            if not match:
                raise ValueError('Invalid Content-Range')
            self.size = int(match[3]); self.etag = response.headers.get('ETag')
            tail = response.read(131073)
            if len(tail) != int(match[2]) - int(match[1]) + 1:
                raise ValueError('Truncated ZIP tail')
        end = tail.rfind(b'PK\x06\x06')
        if end < 0:
            raise ValueError('Expected official GAR ZIP64 archive')
        record = struct.unpack_from('<4sQ2H2I4Q', tail, end)
        central_size, central_offset = record[-2:]
        if central_size > 4 * 1024**2 or central_offset + central_size > self.size:
            raise ValueError('Invalid central directory bounds')
        central = self.range(central_offset, central_size)
        self.entries = parse_central_directory(central)

    def open_range(self, start, count):
        if start < 0 or count < 1 or start + count > self.size:
            raise ValueError('Range outside archive')
        headers = {'Range': f'bytes={start}-{start + count - 1}'}
        if self.etag:
            headers['If-Match'] = self.etag
        response = request(self.url, headers)
        expected = f'bytes {start}-{start+count-1}/{self.size}'
        if response.status != 206 or response.headers.get('Content-Range') != expected:
            response.close(); raise ValueError('Range response mismatch')
        if self.etag and response.headers.get('ETag') != self.etag:
            response.close(); raise ValueError('Archive changed during import')
        return response

    def range(self, start, count):
        with self.open_range(start, count) as response:
            data = response.read(count + 1)
        if len(data) != count:
            raise ValueError('Truncated archive range')
        return data

    def chunks(self, entry):
        header = self.range(entry['offset'], 30)
        fields = struct.unpack('<4s5H3I2H', header)
        if fields[0] != b'PK\x03\x04' or fields[2] & 1 or fields[3] != entry['method']:
            raise ValueError('Unsupported ZIP member')
        name = self.range(entry['offset'] + 30, fields[-2]).decode('utf-8')
        if name != entry['name']:
            raise ValueError('Member name mismatch')
        start = entry['offset'] + 30 + fields[-2] + fields[-1]
        decompressor = zlib.decompressobj(-15) if entry['method'] == 8 else None
        crc = 0; size = 0; received = 0
        with self.open_range(start, entry['compressed']) as response:
            while chunk := response.read(65536):
                received += len(chunk)
                raw = decompressor.decompress(chunk) if decompressor else chunk
                size += len(raw); crc = zlib.crc32(raw, crc)
                if size > entry['size'] or size > MAX_XML_MEMBER:
                    raise ValueError('Decompressed member exceeds declared size')
                if b'<!DOCTYPE' in raw or b'<!ENTITY' in raw:
                    raise ValueError('External/entity XML declarations are forbidden')
                yield raw
        if decompressor:
            final = decompressor.flush()
            size += len(final); crc = zlib.crc32(final, crc)
            if final:
                yield final
            if not decompressor.eof or decompressor.unused_data:
                raise ValueError('Invalid deflate stream')
        if received != entry['compressed'] or size != entry['size'] or crc != entry['crc']:
            raise ValueError('GAR member size/CRC mismatch')


def parse_central_directory(data):
    result = {}; position = 0
    while data[position:position+4] == b'PK\x01\x02':
        row = struct.unpack_from('<4s6H3I5H2I', data, position)
        name = data[position+46:position+46+row[10]].decode('utf-8')
        extra = data[position+46+row[10]:position+46+row[10]+row[11]]
        compressed, size, offset = row[8], row[9], row[16]
        cursor = 0
        while cursor < len(extra):
            tag, length = struct.unpack_from('<HH', extra, cursor)
            value = extra[cursor+4:cursor+4+length]; index = 0
            if tag == 1:
                if size == 0xffffffff:
                    size = struct.unpack_from('<Q', value, index)[0]; index += 8
                if compressed == 0xffffffff:
                    compressed = struct.unpack_from('<Q', value, index)[0]; index += 8
                if offset == 0xffffffff:
                    offset = struct.unpack_from('<Q', value, index)[0]
            cursor += 4 + length
        if name in result or row[4] not in (0, 8) or row[3] & 1:
            raise ValueError('Duplicate/encrypted/unsupported ZIP member')
        result[name] = dict(name=name, compressed=compressed, size=size, offset=offset, method=row[4], crc=row[7])
        position += 46 + row[10] + row[11] + row[12]
    if position != len(data):
        raise ValueError('Unexpected central directory trailing bytes')
    return result


def tags(chunks, tag, wanted=None):
    """Keep only one bounded XML chunk; reject malformed/oversize trailing records."""
    pattern = re.compile(rb'<' + tag.encode() + rb'\s[^>]+/>')
    buffer = b''
    for chunk in chunks:
        buffer += chunk
        last = 0
        for match in pattern.finditer(buffer):
            last = match.end()
            record = match.group()
            if wanted is not None:
                object_id = OBJECT_ID.search(record)
                if not object_id or object_id[1].decode() not in wanted:
                    continue
            yield ET.fromstring(record).attrib
        buffer = buffer[last:]
        if len(buffer) > 32768:
            raise ValueError('Malformed/oversize XML record')


def valid_object(row):
    return row.get('ISACTIVE') == '1' and row.get('ISACTUAL') == '1' and row.get('LEVEL') in {'1', '2', '3', '4', '5', '6'}


def label(row):
    return f"{row['TYPENAME']} {row['NAME']}"


def administrative(row):
    return {'id': row['OBJECTGUID'], 'name': row['NAME'], 'typeShort': row['TYPENAME']}


def make_settlements(objects, paths, types, version, region_code):
    result = []; excluded = []
    for row in objects.values():
        if row['LEVEL'] not in {'5', '6'} and not (row['LEVEL'] == '1' and row['TYPENAME'] in {'г.', 'г', 'г.ф.з.'}):
            continue
        object_id = row['OBJECTID']; chain = paths.get(object_id)
        if not chain or chain[-1] != object_id or len(chain) != len(set(chain)) or any(item not in objects for item in chain):
            excluded.append(object_id); continue
        ancestors = [objects[item] for item in chain]
        region = next((item for item in ancestors if item['LEVEL'] == '1'), None)
        districts = [item for item in ancestors[:-1] if item['LEVEL'] in {'2', '3'}]
        district = districts[-1] if districts else None
        type_definition = types.get((row['LEVEL'], row['TYPENAME']))
        if region is None or not type_definition or not GUID.fullmatch(row['OBJECTGUID']):
            excluded.append(object_id); continue
        full_type = type_definition['NAME']
        uuid.UUID(row['OBJECTGUID'])
        ordered_labels = [label(item) for item in ancestors]
        result.append({'id': row['OBJECTGUID'], 'fiasId': row['OBJECTGUID'], 'garId': object_id,
                       'name': row['NAME'], 'type': full_type, 'typeShort': row['TYPENAME'],
                       'region': administrative(region), 'district': administrative(district) if district else None,
                       'fullName': ', '.join(ordered_labels), 'providerVersion': version,
                       'regionCode': region_code})
    return result, excluded


def import_region(archive, code, types, version):
    address = next(e for name, e in archive.entries.items() if re.match(rf'^{code}/AS_ADDR_OBJ_[0-9]', name))
    hierarchy = next(e for name, e in archive.entries.items() if name.startswith(f'{code}/AS_ADM_HIERARCHY_'))
    objects = {}
    for row in tags(archive.chunks(address), 'OBJECT'):
        if valid_object(row):
            if row['OBJECTID'] in objects:
                raise ValueError('Multiple active actual GAR objects')
            objects[row['OBJECTID']] = row
    paths = {}
    for row in tags(archive.chunks(hierarchy), 'ITEM', objects):
        if row.get('ISACTIVE') == '1':
            key = row['OBJECTID']
            if key in paths:
                raise ValueError('Multiple active administrative paths')
            paths[key] = row['PATH'].split('.')
    records, excluded = make_settlements(objects, paths, types, version, code)
    historical = [{'garId': item['garId'], 'typeShort': item['typeShort'], 'type': item['type']}
                  for item in records if types[(objects[item['garId']]['LEVEL'], item['typeShort'])]['ISACTIVE'] != 'true']
    return code, records, {'members': [address, hierarchy], 'excludedWithoutVerifiedChain': excluded,
                            'historicalTypeObjects': historical,
                            'activeObjects': len(objects), 'settlementCount': len(records)}


def init_database(path):
    db = sqlite3.connect(path)
    db.executescript('''PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;
        CREATE TABLE metadata(key TEXT PRIMARY KEY, json TEXT NOT NULL);
        CREATE TABLE settlements(id TEXT PRIMARY KEY, gar_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
            normalized_name TEXT NOT NULL, region_code TEXT NOT NULL, payload TEXT NOT NULL);
        CREATE INDEX settlements_prefix ON settlements(normalized_name);
        CREATE VIRTUAL TABLE settlement_terms USING fts5(name, full_name, tokenize='unicode61 remove_diacritics 0');
        CREATE VIRTUAL TABLE settlement_trigrams USING fts5(name, tokenize='trigram');''')
    return db


def insert_records(db, records):
    for row in records:
        public = {key: value for key, value in row.items() if key != 'regionCode'}
        result = db.execute('INSERT INTO settlements(id,gar_id,name,normalized_name,region_code,payload) VALUES(?,?,?,?,?,?)',
                            (row['id'], row['garId'], row['name'], normalized(row['name']), row['regionCode'], json.dumps(public, ensure_ascii=False, separators=(',', ':'))))
        db.execute('INSERT INTO settlement_terms(rowid,name,full_name) VALUES(?,?,?)', (result.lastrowid, normalized(row['name']), normalized(row['type'] + ' ' + row['fullName'])))
        db.execute('INSERT INTO settlement_trigrams(rowid,name) VALUES(?,?)', (result.lastrowid, normalized(row['name'])))


def publish(db, output, info, archive, expected_regions, completed, manifest):
    missing = sorted(set(expected_regions) - set(completed))
    coverage = {'status': 'complete' if not missing else 'partial', 'regionCodes': sorted(completed),
                'totalRegions': len(expected_regions), 'loadedRegions': len(completed),
                'settlementCount': db.execute('SELECT count(*) FROM settlements').fetchone()[0],
                'excludedWithoutVerifiedChain': sum(len(item['excludedWithoutVerifiedChain']) for item in manifest.values())}
    metadata = {'schemaVersion': 1, 'provider': 'fns-gar', 'providerVersion': str(info['VersionId']),
                'sourceUrl': archive.url, 'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'archiveSize': archive.size, 'archiveEtag': archive.etag, 'coverage': coverage,
                'typeDictionaryPolicy': 'official-current-and-historical-types-for-active-actual-objects',
                'typeDictionarySource': next(entry for name, entry in archive.entries.items() if name.startswith('AS_ADDR_OBJ_TYPES_')),
                'historicalTypeObjectCount': sum(len(item.get('historicalTypeObjects', [])) for item in manifest.values())}
    db.execute('INSERT OR REPLACE INTO metadata(key,json) VALUES(?,?)', ('provenance', json.dumps(metadata, ensure_ascii=False)))
    db.commit()
    temporary = Path(str(output) + '.next')
    temporary.unlink(missing_ok=True)
    with sqlite3.connect(temporary) as destination:
        db.backup(destination)
        if destination.execute('PRAGMA quick_check').fetchone()[0] != 'ok':
            raise ValueError('Invalid output SQLite')
    os.replace(temporary, output)
    digest = hashlib.sha256()
    with output.open('rb') as published:
        while chunk := published.read(1024 * 1024):
            digest.update(chunk)
    full_manifest = {**metadata, 'membersByRegion': manifest,
                     'databaseBytes': output.stat().st_size, 'databaseSha256': digest.hexdigest()}
    manifest_path = output.with_suffix('.manifest.json')
    manifest_path.write_text(json.dumps(full_manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'published': str(output), 'coverage': coverage}, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--regions', help='Explicit comma-separated region directory codes; omission imports all')
    parser.add_argument('--workers', type=int, default=3, choices=range(1, 5))
    parser.add_argument('--extend-existing', action='store_true', help='Reimport chosen regions into an existing verified same-version index')
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with request(INFO_URL) as response:
        body = response.read(16385)
        if len(body) > 16384:
            raise ValueError('Metadata too large')
        info = json.loads(body)
    if not re.fullmatch(r'[0-9]{8}', str(info.get('VersionId', ''))):
        raise ValueError('Invalid official version')
    archive = RemoteZip(info['GarXMLFullURL'])
    all_regions = sorted({name.split('/')[0] for name in archive.entries if re.match(r'^[0-9]{2}/AS_ADDR_OBJ_[0-9]', name)})
    if not all_regions or len(all_regions) > 120:
        raise ValueError('Unexpected region inventory')
    selected = args.regions.split(',') if args.regions else all_regions
    if len(selected) != len(set(selected)) or any(code not in all_regions for code in selected):
        raise ValueError('Unknown/duplicate region')
    size = sum(e['compressed'] for name, e in archive.entries.items() if name.split('/')[0] in selected and (re.search(r'/AS_ADDR_OBJ_[0-9]', name) or '/AS_ADM_HIERARCHY_' in name))
    if size > MAX_COMPRESSED:
        raise ValueError('Compressed import exceeds 6 GiB budget')
    type_entry = next(e for name, e in archive.entries.items() if name.startswith('AS_ADDR_OBJ_TYPES_'))
    type_rows = list(tags(archive.chunks(type_entry), 'ADDRESSOBJECTTYPE'))
    # A historical abbreviation can still belong to an active actual GAR object.
    # Prefer a current definition of the same exact level/short name, otherwise keep the
    # official historical definition rather than inventing or silently dropping the place.
    types = {(row['LEVEL'], row['SHORTNAME']): row for row in sorted(type_rows, key=lambda row: row['ISACTIVE'] == 'true')}
    working = Path(str(args.output) + '.building')
    if working.exists():
        raise ValueError('A building file exists; move it explicitly before starting another import')
    completed = []; manifest = {}
    if args.extend_existing:
        previous = json.loads(args.output.with_suffix('.manifest.json').read_text())
        if previous['providerVersion'] != str(info['VersionId']) or previous['archiveEtag'] != archive.etag:
            raise ValueError('Existing index belongs to a different source version; run a fresh import')
        db = sqlite3.connect(working)
        with sqlite3.connect(args.output) as source:
            source.backup(db)
        completed = list(previous['coverage']['regionCodes']); manifest = previous['membersByRegion']
    else:
        db = init_database(working)
    priorities = [code for code in ['23', '77', '78'] if code in selected]
    batches = [priorities, [code for code in selected if code not in priorities]]
    print(json.dumps({'version': info['VersionId'], 'regions': len(selected), 'compressedBytes': size, 'workers': args.workers}), flush=True)
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            for batch in batches:
                futures = {pool.submit(import_region, archive, code, types, str(info['VersionId'])): code for code in batch}
                for future in concurrent.futures.as_completed(futures):
                    code, records, details = future.result()
                    with db:
                        if args.extend_existing:
                            db.execute('DELETE FROM settlement_terms WHERE rowid IN(SELECT rowid FROM settlements WHERE region_code=?)', (code,))
                            db.execute('DELETE FROM settlement_trigrams WHERE rowid IN(SELECT rowid FROM settlements WHERE region_code=?)', (code,))
                            db.execute('DELETE FROM settlements WHERE region_code=?', (code,))
                        insert_records(db, records)
                    if code not in completed:
                        completed.append(code)
                    manifest[code] = details
                    print(json.dumps({'region': code, 'count': len(records), 'excluded': len(details['excludedWithoutVerifiedChain']), 'completed': len(completed)}, ensure_ascii=False), flush=True)
                if batch:
                    publish(db, args.output, info, archive, all_regions, completed, manifest)
        db.close(); working.unlink()
    except BaseException:
        db.close()
        # Keep explicit evidence of the interrupted import; do not overwrite a valid published index.
        raise


if __name__ == '__main__':
    main()
