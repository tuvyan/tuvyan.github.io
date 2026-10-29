#!/usr/bin/env python3
"""TUVYAN read-only preservation audit. Python 3.9+, no dependencies.
Run from the repository root: python3 scripts/preservation_audit.py --root . --out ./preservation-report
"""
import argparse, csv, hashlib, html.parser, json, os, re, sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote, urlsplit

SKIP={'.git','node_modules','.venv','venv','__pycache__','.DS_Store','preservation-report'}
MEDIA={'.jpg','.jpeg','.png','.gif','.webp','.svg','.tif','.tiff','.bmp','.heic','.mp3','.wav','.m4a','.ogg','.flac','.mp4','.mov','.webm','.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.zip'}
IMG={'.jpg','.jpeg','.png','.gif','.webp','.svg','.tif','.tiff','.bmp','.heic'}
class Scan(html.parser.HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.refs=[];self.noalt=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('img','audio','video','source','script','iframe','a','link'):
   for k in ('src','href','poster'):
    if a.get(k): self.refs.append((tag,k,a[k]))
  if tag=='img' and not (a.get('alt') or '').strip(): self.noalt.append(a.get('src','(no src)'))

def filehash(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def writecsv(p,headers,rows):
 with p.open('w',newline='',encoding='utf-8-sig') as f:
  w=csv.writer(f);w.writerow(headers);w.writerows(rows)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--root',default='.');ap.add_argument('--out',default='preservation-report');args=ap.parse_args()
 root=Path(args.root).resolve();out=Path(args.out).resolve()
 if not (root/'articles.json').exists(): print('ERROR: --root must point to TUVYAN repository containing articles.json',file=sys.stderr);return 2
 if out==root or root in out.parents and out.name in ('scripts','studio'): print('ERROR: choose a separate report folder',file=sys.stderr);return 2
 out.mkdir(parents=True,exist_ok=True)
 files=[]
 for base,dirs,names in os.walk(root):
  dirs[:]=[d for d in dirs if d not in SKIP and not (Path(base)/d).resolve()==out]
  for name in names:
   p=Path(base)/name
   if p.is_file() and out not in p.parents: files.append(p)
 files.sort(); indexed={p.relative_to(root).as_posix():p for p in files}
 media=[p for p in files if p.suffix.lower() in MEDIA]; grouped=defaultdict(list)
 for p in media:
  try: grouped[(p.stat().st_size,filehash(p))].append(p.relative_to(root).as_posix())
  except OSError: pass
 duplicates=[]
 for (size,digest),paths in grouped.items():
  if len(paths)>1:duplicates.append({'size_bytes':size,'sha256':digest,'paths':paths})
 missing=[];external=set();noalt=[]
 for p in files:
  if p.suffix.lower()!='.html':continue
  rel=p.relative_to(root).as_posix()
  try: s=p.read_text(encoding='utf-8',errors='replace');parser=Scan();parser.feed(s)
  except Exception:continue
  for src in parser.noalt:noalt.append({'page':rel,'image':src})
  for tag,attr,url in parser.refs:
   url=url.strip(); parts=urlsplit(url)
   if parts.scheme in ('https','http') or url.startswith('//'):
    external.add((rel,url));continue
   if parts.scheme or url.startswith(('#','data:','mailto:','tel:','javascript:')):continue
   path=unquote(parts.path).strip()
   if not path:continue
   # Resolve locally, preventing traversal outside repository.
   candidate=(root/path.lstrip('/') if path.startswith('/') else p.parent/path).resolve()
   if candidate!=root and root not in candidate.parents:continue
   if not candidate.exists() and not (candidate.is_dir() and (candidate/'index.html').exists()):
    # Ignore extensionless URLs and likely dynamic links; only flag asset and .html references.
    if Path(path).suffix.lower() in MEDIA|{'.html','.css','.js','.json'}:
     missing.append({'page':rel,'reference':url,'element':tag,'attribute':attr})
 try: catalogue=json.loads((root/'articles.json').read_text(encoding='utf-8'))
 except Exception as e:print('ERROR reading articles.json:',e,file=sys.stderr);return 2
 if isinstance(catalogue,dict):catalogue=catalogue.get('articles',[])
 undated=[];missing_articles=[]
 for item in catalogue:
  if not isinstance(item,dict):continue
  name=str(item.get('file') or '');title=str(item.get('title') or name)
  if name and not (root/name).is_file():missing_articles.append({'title':title,'file':name})
  if not (item.get('original_publication_date') or item.get('date')):undated.append({'title':title,'file':name,'wordpress_archive_date':item.get('wordpress_archive_date','')})
 large=sorted(({'file':p.relative_to(root).as_posix(),'bytes':p.stat().st_size} for p in files if p.stat().st_size>=10*1024*1024),key=lambda x:-x['bytes'])
 report={'summary':{'total_files':len(files),'media_files':len(media),'article_records':len(catalogue),'duplicate_groups':len(duplicates),'missing_local_references':len(missing),'missing_article_files':len(missing_articles),'images_without_alt':len(noalt),'articles_without_confirmed_date':len(undated),'large_files_10mb_plus':len(large),'external_link_occurrences':len(external)},'duplicates':duplicates,'missing_local_references':missing,'missing_article_files':missing_articles,'images_without_alt':noalt,'undated_articles':undated,'large_files':large,'external_links':[{'page':p,'url':u} for p,u in sorted(external)]}
 (out/'preservation-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 writecsv(out/'duplicate-files.csv',['bytes','sha256','paths (separated by |)'],[(x['size_bytes'],x['sha256'],' | '.join(x['paths'])) for x in duplicates])
 writecsv(out/'missing-references.csv',['page','reference','element','attribute'],[(x['page'],x['reference'],x['element'],x['attribute']) for x in missing])
 writecsv(out/'undated-articles.csv',['title','file','wordpress_archive_date'],[(x['title'],x['file'],x['wordpress_archive_date']) for x in undated])
 writecsv(out/'large-files.csv',['file','bytes'],[(x['file'],x['bytes']) for x in large])
 print('TUVYAN PRESERVATION AUDIT (read-only)')
 for k,v in report['summary'].items():print(f'  {k}: {v}')
 print('Reports saved in:',out)
 print('NOTE: Duplicate hashes do not mean files are safe to delete. Missing references need manual review. No content was modified.')
 return 0
if __name__=='__main__':sys.exit(main())
