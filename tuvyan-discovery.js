/* TUVYAN discovery: truthful archive recommendations, no fabricated view counts. */
(function(){'use strict';
const sidebar=document.querySelector('.tuvyan-discovery-sidebar');if(!sidebar)return;
function position(){if(window.matchMedia('(min-width:1050px)').matches){const a=document.getElementById('archive');if(a){sidebar.style.setProperty('--tuvyan-sidebar-top',a.offsetTop+'px');sidebar.style.position='absolute';}}else{sidebar.style.position='static';}}
window.addEventListener('resize',position,{passive:true});position();
const safeFile=(f)=>typeof f==='string'&&/^[a-zA-Z0-9_./%-]+\.html$/.test(f)&&!f.includes('..');
function render(id,rows){const target=document.getElementById(id);if(!target)return;target.replaceChildren();rows.forEach(x=>{const li=document.createElement('li'),a=document.createElement('a');a.href=x.file;a.textContent=x.title;li.append(a);target.append(li);});}
fetch('articles.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Archive unavailable');return r.json();}).then(data=>{const entries=(Array.isArray(data)?data:[]).filter(x=>x&&safeFile(x.file)&&typeof x.title==='string');entries.sort((a,b)=>String(b.original_publication_date||b.wordpress_archive_date||'').localeCompare(String(a.original_publication_date||a.wordpress_archive_date||'')));render('tuvyan-discovery-list',entries.slice(0,7));if(!entries.length)document.getElementById('tuvyan-discovery-list').textContent='No archive entries available.';}).catch(()=>{document.getElementById('tuvyan-discovery-list').textContent='Archive suggestions temporarily unavailable.';});
/* Optional future integration: set window.TUVYAN_POPULAR_ARTICLES to an array
   of verified {file,title,views} objects BEFORE this script loads.
   Only actual cross-visitor measurements qualify as "Most Read". */
const popular=Array.isArray(window.TUVYAN_POPULAR_ARTICLES)?window.TUVYAN_POPULAR_ARTICLES.filter(x=>x&&safeFile(x.file)&&typeof x.title==='string'&&Number.isFinite(x.views)&&x.views>=0):[];
if(popular.length){popular.sort((a,b)=>b.views-a.views);render('tuvyan-most-read-list',popular.slice(0,5));document.getElementById('tuvyan-most-read-status').textContent='Based on recorded page views.';}
})();
