#!/usr/bin/env python3
"""Verify TUVYAN ZIP integrity, list entries and optionally write a SHA-256 manifest.
Usage: python3 scripts/verify_site_backup.py backup.zip --manifest manifest.csv
"""
import argparse, csv, hashlib, sys, zipfile
from pathlib import Path
p=argparse.ArgumentParser(); p.add_argument('archive'); p.add_argument('--manifest'); args=p.parse_args()
archive=Path(args.archive)
if not archive.is_file(): sys.exit('Backup ZIP not found')
rows=[]; bad=[]
with zipfile.ZipFile(archive) as z:
    names=set()
    for entry in z.infolist():
        if entry.is_dir(): continue
        if entry.filename in names: bad.append('duplicate: '+entry.filename)
        names.add(entry.filename)
        if entry.filename.startswith('/') or '..' in Path(entry.filename).parts: bad.append('unsafe path: '+entry.filename)
        content=z.read(entry.filename)
        rows.append((entry.filename,len(content),hashlib.sha256(content).hexdigest()))
    corrupt=z.testzip()
    if corrupt: bad.append('bad CRC: '+corrupt)
print('Files:',len(rows),'| Bytes:',sum(r[1] for r in rows),'| SHA256:',hashlib.sha256(archive.read_bytes()).hexdigest())
if args.manifest:
    with open(args.manifest,'w',newline='',encoding='utf-8') as f:
        writer=csv.writer(f); writer.writerow(['path','bytes','sha256']); writer.writerows(rows)
if bad:
    for issue in bad: print('ERROR:',issue,file=sys.stderr)
    sys.exit(1)
print('PASS: ZIP can be read and all entries passed integrity checks')
