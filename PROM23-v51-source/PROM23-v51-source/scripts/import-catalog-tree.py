#!/usr/bin/env python3
"""Owner-authorized public catalogue navigation import; Python stdlib only."""
from __future__ import annotations
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
import argparse
import json
import time
import xml.etree.ElementTree as ET

BASE = 'https://prom.myfast.space'
MENU = BASE + '/local/ajax/catalog/header-menu.php'
PROJECT = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

@dataclass
class Node:
    tag: str = 'root'
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)
    def text(self):
        return ' '.join(''.join(c if isinstance(c, str) else c.text() + ' ' for c in self.children).split())
    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.walk()
    def has(self, name):
        return name in self.attrs.get('class', '').split()
    def cls(self, name):
        return [n for n in self.walk() if n.has(name)]
    def anchors(self):
        return [n for n in self.walk() if n.tag == 'a' and 'href' in n.attrs]

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break
    def handle_data(self, value):
        self.stack[-1].children.append(value)

def parse(raw):
    parser = Parser()
    parser.feed(raw.decode('utf-8'))
    return parser.root

def canonical(url):
    parsed = urlsplit(urljoin(BASE, url))
    if parsed.hostname != 'prom.myfast.space' or parsed.username or parsed.password:
        raise ValueError('Unexpected host in navigation')
    return urlunsplit(('https', parsed.netloc, parsed.path, '', ''))

def parent_url(url):
    return BASE + urlsplit(url).path.rstrip('/').rsplit('/', 1)[0] + '/'

def fetch(url):
    url = canonical(url)
    with urlopen(Request(url, headers={'User-Agent': 'PROM23-Local-Catalog-Import/2.0'}), timeout=45) as response:
        if canonical(response.url) != url:
            raise ValueError('Unexpected redirect: ' + url)
        raw = response.read(20_000_001)
    if len(raw) > 20_000_000:
        raise ValueError('Read limit exceeded')
    time.sleep(0.15)
    return url, raw

def validate(tree, products):
    nodes = {node['id']: node for node in tree['sections']}
    assert len(nodes) == len(tree['sections'])
    assert len({n['url'] for n in nodes.values()}) == len(nodes)
    assert all(n['url'].startswith(BASE + '/catalog/') and n['name'] for n in nodes.values())
    reached = []
    def walk(ident, parent=None):
        assert ident not in reached
        node = nodes[ident]
        assert node['parentId'] == parent
        assert len(node['children']) == len(set(node['children']))
        reached.append(ident)
        for child in node['children']:
            walk(child, ident)
    for root in tree['rootIds']:
        walk(root)
    assert reached == [n['id'] for n in tree['sections']]
    for product in products:
        chain = product['sectionIds']
        assert chain and chain[0] in tree['rootIds']
        assert nodes[chain[-1]]['url'] == parent_url(canonical(product['sourceUrl']))
        assert all(nodes[c]['parentId'] == p for p, c in zip(chain, chain[1:]))
    for ident, node in nodes.items():
        assert node['productIds'] == [p['id'] for p in products if ident in p['sectionIds']]

def main():
    cli = argparse.ArgumentParser()
    cli.add_argument('--check-only', action='store_true')
    options = cli.parse_args()
    catalog_path = PROJECT / 'data/catalog.json'
    tree_path = PROJECT / 'data/catalog-tree.json'
    if options.check_only:
        validate(json.loads(tree_path.read_text()), json.loads(catalog_path.read_text()))
        print('Saved tree, ancestry, ordering and bidirectional links are valid.')
        return
    original_catalog = catalog_path.read_bytes()
    products = json.loads(original_catalog)
    sections, evidence, numeric_ids, root_urls = {}, {}, {}, []
    start = datetime.now(timezone.utc)
    def add(url, name, parent, section_id=None):
        url = canonical(url)
        if not url.startswith(BASE + '/catalog/') or not name.strip():
            raise ValueError('Invalid section')
        if url in sections:
            current = sections[url]
            if current['name'] != name.strip() or current['parentUrl'] != parent:
                raise ValueError('Conflicting name or parent: ' + url)
            return url
        if parent is not None and (parent not in sections or parent_url(url) != parent):
            raise ValueError('Unexpected parent: ' + url)
        if section_id is not None:
            assert section_id.isdigit()
            numeric_ids[url] = section_id
        sections[url] = {'name': name.strip(), 'url': url, 'parentUrl': parent, 'childUrls': []}
        if parent is None:
            root_urls.append(url)
        else:
            sections[parent]['childUrls'].append(url)
        return url
    url, raw = fetch(MENU)
    evidence[url] = sha256(raw).hexdigest()
    menu = parse(raw)
    for link in menu.cls('js--header-catalog-section-btn'):
        add(link.attrs['href'], link.cls('h-catalog__sections__btn__text')[0].text(), None, link.attrs['data-id'])
    for block in menu.cls('js--header-catalog-menu'):
        title = block.cls('h-catalog__menu__title')[0].anchors()[0]
        root = canonical(title.attrs['href'])
        assert numeric_ids[root] == block.attrs['data-id']
        current_parent = None
        for child in block.children:
            if not isinstance(child, Node):
                continue
            if child.has('h-catalog__menu__sect-title'):
                link = child.anchors()[0]
                current_parent = add(link.attrs['href'], link.text(), root)
            elif child.has('h-catalog__menu__sect'):
                assert current_parent is not None
                for item in child.cls('h-catalog__menu__item'):
                    link = item.anchors()[0]
                    add(link.attrs['href'], link.text(), current_parent)
    menu_count = len(sections)
    print('Live header:', len(root_urls), 'roots,', menu_count, 'sections', flush=True)
    sitemap_sources, sitemap_urls = [], []
    url, raw = fetch(BASE + '/sitemap.xml')
    evidence[url] = sha256(raw).hexdigest()
    for loc in ET.fromstring(raw).iter():
        if loc.tag.endswith('}loc') and 'sitemap-iblock-' in (loc.text or ''):
            sitemap_sources.append(canonical(loc.text))
    for source in sitemap_sources:
        url, raw = fetch(source)
        evidence[url] = sha256(raw).hexdigest()
        sitemap_urls.extend(canonical(n.text) for n in ET.fromstring(raw).iter() if n.tag.endswith('}loc') and '/catalog/' in (n.text or ''))
    sitemap_sections = {url for url in sitemap_urls if not url.rstrip('/').rsplit('/', 1)[-1].startswith('id-')}
    assert sitemap_sections
    unique_product_urls = len(set(sitemap_urls) - sitemap_sections)
    print('Sitemap:', len(sitemap_sections), 'sections,', len(sitemap_urls) - len(sitemap_sections), 'product URL entries,', unique_product_urls, 'unique product URLs', flush=True)
    checked = set()
    with ThreadPoolExecutor(max_workers=2) as executor:
        while True:
            pending = [u for u, s in sections.items() if not s['childUrls'] and u not in checked]
            if not pending:
                break
            if len(checked) + len(pending) > 450:
                raise ValueError('Bounded traversal limit exceeded')
            for url, raw in executor.map(fetch, pending):
                checked.add(url)
                evidence[url] = sha256(raw).hexdigest()
                page = parse(raw)
                assert any(n.tag == 'h1' for n in page.walk()), url
                for link in page.cls('catalog-categories__item'):
                    add(link.attrs['href'], link.cls('catalog-categories__item__name')[0].text(), url)
                if len(checked) % 20 == 0:
                    print('Checked leaf pages:', len(checked), 'known sections:', len(sections), flush=True)
    missing = sitemap_sections - set(sections)
    if missing:
        raise ValueError('Sitemap sections unreachable from live navigation: ' + repr(sorted(missing)))
    section_id = lambda url: numeric_ids.get(url, url)
    records = []
    def visit(url):
        node = sections[url]
        records.append({'id': section_id(url), 'name': node['name'], 'url': url,
            'parentId': section_id(node['parentUrl']) if node['parentUrl'] else None,
            'children': [section_id(c) for c in node['childUrls']], 'productIds': []})
        for child in node['childUrls']:
            visit(child)
    for root in root_urls:
        visit(root)
    by_id = {n['id']: n for n in records}
    for product in products:
        source = canonical(product['sourceUrl'])
        assert source in sitemap_urls, product['id']
        leaf = parent_url(source)
        assert leaf in sections, product['id']
        chain, current = [], leaf
        while current is not None:
            chain.insert(0, section_id(current))
            current = sections[current]['parentUrl']
        product['sectionIds'] = chain
        for ident in chain:
            by_id[ident]['productIds'].append(product['id'])
    tree = {'sourceUrl': MENU, 'importedAt': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'sections': records, 'rootIds': [section_id(r) for r in root_urls]}
    validate(tree, products)
    if catalog_path.read_bytes() != original_catalog:
        raise ValueError('catalog.json changed during import; refusing to overwrite')
    tree_path.write_text(json.dumps(tree, ensure_ascii=False, indent=2) + '\n')
    catalog_path.write_text(json.dumps(products, ensure_ascii=False, indent=2) + '\n')
    write_report(tree, products, menu_count, len(sitemap_sections), len(sitemap_urls), unique_product_urls, len(checked), evidence, start)
    print('DONE:', len(records), 'sections;', len(root_urls), 'roots;', len(products), 'mapped products;', len(evidence), 'GET requests')

def write_report(tree, products, menu_count, sitemap_count, sitemap_total, unique_product_urls, checked_count, evidence, start):
    nodes = {n['id']: n for n in tree['sections']}
    def depth(node):
        count = 1
        while node['parentId']:
            count += 1
            node = nodes[node['parentId']]
        return count
    levels = Counter(depth(n) for n in nodes.values())
    lines = ['# Точная структура публичного каталога — итерация 3', '',
        'Источник названий, порядка и вложенности — только [сайт владельца](' + BASE + ').',
        'Начало снимка: ' + start.isoformat(timespec='seconds') + '. Завершение: ' + tree['importedAt'] + '.', '',
        '## Результат', '',
        '**' + str(len(nodes)) + ' разделов, ' + str(len(tree['rootIds'])) + ' корней, глубина ' + str(max(levels)) + '.**',
        'Уровни: ' + ', '.join(str(k) + ' — ' + str(levels[k]) for k in sorted(levels)) + '.',
        'Это полная таксономия публичной навигации данного снимка; скрытые/неактивные разделы базы недоступны без экспорта Битрикс.',
        'Ассортимент остаётся выборкой из ' + str(len(products)) + ' товаров. Sitemap содержит ' + str(sitemap_total - sitemap_count) + ' записей товарных URL, из них ' + str(unique_product_urls) + ' уникальных URL. Это не доказанное число уникальных SKU: один товар может иметь несколько путей. Массовый импорт товаров этим скриптом не выполняется.', '',
        '## Источники и полнота', '',
        '- [AJAX меню](' + MENU + ') содержит ' + str(menu_count) + ' раздела и числовые ID корней. Сохранён исходный порядок.',
        '- В архиве local/ajax/catalog/header-menu.php запрашивает TOP_DEPTH=10, но local/php_interface/lib/Menu.php::renderCatalogMenu() выводит только три уровня. Поэтому одного меню недостаточно.',
        '- [Sitemap](' + BASE + '/sitemap.xml) и [карта каталога](' + BASE + '/sitemap-iblock-4.xml) содержат ' + str(sitemap_count) + ' разделов и использованы для независимой проверки.',
        '- Прочитаны ' + str(checked_count) + ' страницы всех листьев меню и вновь обнаруженных потомков, до исчерпания навигации. Дети взяты из catalog-categories__item, имена из catalog-categories__item__name; названия не выведены из slug.',
        '- Проверены все sitemap-разделы: каждый найден, связан и достижим от корня. Дополнительные уровни найдены в реальной дочерней навигации.',
        '- Только публичные GET, максимум два одновременно, пауза 150 мс на запрос. Формы, авторизация, корзина, CRM и серверные данные не изменялись. PHP архива не выполнялся.',
        '- Запрет индексации в robots.txt сохранён: чтение своего staging выполнено по прямому разрешению владельца, поисковая индексация не запускалась.', '',
        '## Контракт данных', '',
        'data/catalog-tree.json: {sourceUrl, importedAt, sections, rootIds}. Раздел: {id, name, url, parentId, children, productIds}.',
        '- sections хранится в DFS-порядке сайта. rootIds и children сохраняют порядок ссылок. Не сортировать по алфавиту.',
        '- id корней — публичный числовой Bitrix ID строкой. У остальных id — абсолютный HTTPS URL: числовые IDs не опубликованы в прочитанной навигации.',
        '- parentId=null только для корней; children — ID непосредственных детей. Вложенность дополнительно проверена по путям URL.',
        '- productIds каждого раздела включают импортированные товары самого раздела И его потомков. Пустой массив означает отсутствие в выборке, а не пустой ассортимент сайта.',
        '- В data/catalog.json добавлены sectionIds, полный путь ID корень → фактический раздел товара. Последний раздел совпадает с родителем URL товарной карточки; все 25 товарных URL проверены по sitemap.',
        '- category сохранено для обратной совместимости. Это прежняя укрупнённая группировка, не новая таксономия.',
        '- Цены, фото, характеристики, SKU и остальные поля товаров не менялись.', '',
        '## Корневые разделы', '', '| ID | Название | Товаров в выборке |', '|---|---|---:|']
    for root_id in tree['rootIds']:
        node = nodes[root_id]
        lines.append('| ' + root_id + ' | [' + node['name'] + '](' + node['url'] + ') | ' + str(len(node['productIds'])) + ' |')
    lines += ['', '## Проверки и повторный запуск', '',
        'Проверены уникальность ID/URL, отсутствие циклов/сирот, взаимность parent/children, DFS-порядок, покрытие sitemap, все 25 товарных цепочек и двусторонние связи с productIds.', '',
        'Локальная проверка без сети:', '', '    python3 scripts/import-catalog-tree.py --check-only', '',
        'Повторный импорт:', '', '    python3 scripts/import-catalog-tree.py', '',
        '## SHA-256 публичных ответов', '',
        'HTML со служебными значениями анонимной сессии в передаваемый набор не включён.', '',
        '| URL | SHA-256 |', '|---|---|']
    lines += ['| ' + url + ' | ' + digest + ' |' for url, digest in evidence.items()]
    (PROJECT / 'docs/13-catalog-v3.md').write_text('\n'.join(lines) + '\n')

if __name__ == '__main__':
    main()
