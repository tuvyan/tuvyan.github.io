#!/usr/bin/env python3
"""Rebuild TUVYAN's static full-text index from published HTML pages."""
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'search' / 'fulltext-index.json'
EXCLUDED_DIRS = {'studio', 'search', 'assets', '.github', 'node_modules', '.git'}
EXCLUDED_SELECTORS = (
    'script,style,nav,footer,header,aside,form,svg,noscript,'
    '[aria-hidden="true"],.related-reading,.article-navigation,.site-nav,.breadcrumbs'
)


def build():
    records = []
    for path in sorted(ROOT.rglob('*.html')):
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDED_DIRS or part.startswith('.') for part in rel.parts[:-1]):
            continue
        if path.stat().st_size > 2_000_000:
            print(f'Skipping oversized page: {rel}')
            continue
        soup = BeautifulSoup(path.read_text(encoding='utf-8', errors='replace'), 'html.parser')
        title = soup.title.get_text(' ', strip=True) if soup.title else str(rel)
        title = re.sub(r'\s*[|–—]\s*TUVYAN.*$', '', title, flags=re.I)[:180]
        for element in soup.select(EXCLUDED_SELECTORS):
            element.decompose()
        content_root = soup.find('article') or soup.find('main') or soup.body or soup
        content = re.sub(r'\s+', ' ', ' '.join(content_root.stripped_strings)).strip()
        if len(content) < 90:
            continue
        records.append({'file': rel.as_posix(), 'title': title, 'text': content[:24000]})
    if len(records) < 10:
        raise RuntimeError(f'Only {len(records)} HTML pages indexed; refusing to replace index')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(records, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'Indexed {len(records)} HTML pages in {OUTPUT.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
