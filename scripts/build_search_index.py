#!/usr/bin/env python3
"""Build TUVYAN's static, public catalogue full-text search index. Python standard library only."""
import json, re, html, sys
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
SKIP={'script','style','noscript','svg','nav','footer','aside','form','button'}
class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.parts=[]; self.stack=[]; self.main_depth=0; self.has_main=False
    def handle_starttag(self, tag, attrs):
        if tag in ('main','article') and not self.has_main:
            self.has_main=True; self.main_depth=len(self.stack)+1
        self.stack.append(tag)
        if tag in ('p','div','h1','h2','h3','h4','li','section','blockquote','br'): self.parts.append(' ')
    def handle_startendtag(self,tag,attrs):
        if tag=='br': self.parts.append(' ')
    def handle_endtag(self,tag):
        if tag in ('p','div','h1','h2','h3','li'): self.parts.append(' ')
        if tag in self.stack:
            i=len(self.stack)-1-self.stack[::-1].index(tag)
            self.stack=self.stack[:i]
    def handle_data(self,data):
        if not any(t in SKIP for t in self.stack):
            if not self.has_main or len(self.stack)>=self.main_depth: self.parts.append(data)

def safe_file(value):
    return isinstance(value,str) and bool(re.fullmatch(r'[A-Za-z0-9_./%\-]+\.html',value)) and not value.startswith('/') and '..' not in value.split('/')

def build():
    catalog=json.loads((ROOT/'articles.json').read_text(encoding='utf-8'))
    if not isinstance(catalog,list): raise ValueError('articles.json must be an array')
    records=[]; missing=[]; seen=set()
    for item in catalog:
        if not isinstance(item,dict): continue
        f=item.get('file'); title=item.get('title')
        if not safe_file(f) or not isinstance(title,str) or not title.strip() or f in seen: continue
        seen.add(f)
        page=ROOT/f
        if not page.is_file(): missing.append(f)
        content=''
        if page.is_file():
            parser=VisibleText()
            try:
                parser.feed(page.read_text(encoding='utf-8',errors='replace'))
                content=re.sub(r'\s+',' ',' '.join(parser.parts)).strip()[:125000]
            except Exception as exc: print(f'Warning: {f}: {exc}',file=sys.stderr)
        record={k:item.get(k,'') for k in ('title','file','category','author','summary','original_date','publication_date','upload_date','wordpress_date','wordpress_archive_date')}
        record['tags']=item.get('tags',[]) if isinstance(item.get('tags',[]),list) else []
        record['content']=content
        records.append(record)
    out=ROOT/'tuvyan-search-index.json'
    out.write_text(json.dumps(records,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f'Indexed {len(records)} catalogue records; {sum(bool(x["content"]) for x in records)} have searchable page text; {len(missing)} missing HTML pages.')
    if missing: print('Missing: '+', '.join(missing[:20]),file=sys.stderr)
    return 0
if __name__=='__main__': sys.exit(build())
