#!/usr/bin/env python3
"""Build TUVYAN's static, public catalogue full-text search index. Python standard library only."""
import json, re, html, sys
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
# Explicit public collections; never index editor, checkout or administrative pages.
EXTRA_FOLDERS={'music-archive':'music','family-archive':'family'}
EXTRA_ROOT={'gus-saboy-memorial.html':'memorial','gus-response-to-eulogies.html':'memorial','banao-conservation-history.html':'heritage','more-documents-about-banao.html':'heritage','banao-protected-landscape-act-2022.html':'heritage'}
EXTRA_PREFIXES={'music-archive/':'music','family-archive/':'family'}

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
    # Add public standalone archival pages only when they are not already catalogued.
    extra=[]
    for folder,category in EXTRA_FOLDERS.items():
        base=ROOT/folder
        if base.is_dir():
            extra.extend((p,category) for p in sorted(base.glob('*.html')))
    extra.extend((ROOT/f,category) for f,category in EXTRA_ROOT.items() if (ROOT/f).is_file())
    for page,category in extra:
        f=page.relative_to(ROOT).as_posix()
        if f in seen or not safe_file(f): continue
        seen.add(f)
        source=page.read_text(encoding='utf-8',errors='replace')
        title_match=re.search(r'<title[^>]*>(.*?)</title\s*>',source,re.I|re.S)
        h1_match=re.search(r'<h1[^>]*>(.*?)</h1\s*>',source,re.I|re.S)
        raw_title=title_match.group(1) if title_match else (h1_match.group(1) if h1_match else page.stem.replace('-',' ').title())
        title=html.unescape(re.sub(r'<[^>]+>','',raw_title)).strip()
        parser=VisibleText()
        try: parser.feed(source)
        except Exception as exc: print(f'Warning: {f}: {exc}',file=sys.stderr)
        content=re.sub(r'\s+',' ',' '.join(parser.parts)).strip()[:125000]
        # Do not infer a publication date or author from a filename or upload timestamp.
        records.append({'file':f,'title':title,'category':category,'author':'','summary':'',
                        'original_date':'','publication_date':'','upload_date':'',
                        'wordpress_date':'','wordpress_archive_date':'','tags':[],
                        'content':content})
    out=ROOT/'tuvyan-search-index.json'
    out.write_text(json.dumps(records,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f'Indexed {len(records)} catalogue records; {sum(bool(x["content"]) for x in records)} have searchable page text; {len(missing)} missing HTML pages.')
    if missing: print('Missing: '+', '.join(missing[:20]),file=sys.stderr)
    return 0
if __name__=='__main__': sys.exit(build())
