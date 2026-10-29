(()=>{'use strict';const $=id=>document.getElementById(id),q=$('query'),cat=$('category'),year=$('year'),sort=$('sort'),results=$('results'),status=$('status'),more=$('more');let all=[],visible=[],shown=0;const cats={blog:'Blog & Essays',papers:'Papers & Publications',heritage:'Vanaw Heritage',language:'Orthography & Dictionary'};const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function date(x){return x.original_date||x.publication_date||x.upload_date||x.wordpress_date||x.wordpress_archive_date||''}function type(x){return x.original_date||x.publication_date?'Published':x.upload_date?'Uploaded to TUVYAN':(x.wordpress_date||x.wordpress_archive_date)?'WordPress archive':'Date not recorded'}function dateValue(x){let d=date(x);return /^\d{4}(-\d{2}){0,2}$/.test(d)?d:''}function tokens(s){return s.toLocaleLowerCase().normalize('NFKC').split(/\s+/).filter(Boolean)}function render(reset){if(reset){const terms=tokens(q.value.trim()),c=cat.value,y=year.value;visible=all.filter(x=>(c==='all'||x.category===c)&&(y==='all'||(y==='unknown'?!dateValue(x):dateValue(x).slice(0,4)===y))&&terms.every(t=>(x._search||'').includes(t)));visible.sort((a,b)=>sort.value==='title'?a.title.localeCompare(b.title):sort.value==='oldest'?(dateValue(a)?dateValue(b)?dateValue(a).localeCompare(dateValue(b)):-1:dateValue(b)?1:a.title.localeCompare(b.title)):(dateValue(b).localeCompare(dateValue(a))||a.title.localeCompare(b.title)));shown=0;results.replaceChildren()}const slice=visible.slice(shown,shown+20);const frag=document.createDocumentFragment();for(const x of slice){const node=document.createElement('article');node.className='result';const d=dateValue(x),summary=x.summary||'';node.innerHTML='<h2><a href="'+encodeURI(x.file).replace(/"/g,'%22')+'">'+esc(x.title)+'</a></h2><div class="meta"><span class="badge">'+esc(cats[x.category]||x.category)+'</span>'+esc(d?type(x)+': '+d:'Date not recorded')+(x.author?' · '+esc(x.author):'')+'</div>'+(summary?'<p class="snippet">'+esc(summary)+'</p>':'');frag.appendChild(node)}results.appendChild(frag);shown+=slice.length;status.textContent=visible.length+' result'+(visible.length===1?'':'s')+' found';more.hidden=shown>=visible.length}for(const el of [q,cat,year,sort])el.addEventListener(el===q?'input':'change',()=>render(true));more.addEventListener('click',()=>render(false));$('clear').addEventListener('click',()=>{q.value='';cat.value='all';year.value='all';sort.value='newest';render(true)});Promise.allSettled([
 fetch('tuvyan-search-index.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Search index HTTP '+r.status);return r.json()}),
 fetch('articles.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catalogue HTTP '+r.status);return r.json()})
]).then(parts=>{
 const index=parts[0].status==='fulfilled'&&Array.isArray(parts[0].value)?parts[0].value:[];
 const catalogue=parts[1].status==='fulfilled'&&Array.isArray(parts[1].value)?parts[1].value:[];
 if(!index.length&&!catalogue.length)throw Error('No search index or catalogue available');
 const map=new Map();
 const safeFile=f=>typeof f==='string'&&/^[a-zA-Z0-9_./%\-]+\.html(?:[?#].*)?$/.test(f)&&!f.startsWith('/')&&!f.includes('..');
 for(const x of index){if(x&&safeFile(x.file)&&x.title)map.set(x.file,{...x})}
 for(const x of catalogue){
   if(!x||!safeFile(x.file)||!x.title)continue;
   const old=map.get(x.file)||{};
   // Live catalogue is authoritative for title, category and dates. Keep existing full text.
   map.set(x.file,{...old,...x,content:old.content||'',summary:x.summary||old.summary||'',
     wordpress_date:x.wordpress_date||x.wordpress_archive_date||old.wordpress_date||'',
     author:x.author||old.author||'',tags:x.tags||old.tags||[]});
 }
 all=[...map.values()].map(x=>({...x,_search:[x.title,x.file,x.category,x.author,x.summary,...(Array.isArray(x.tags)?x.tags:[]),x.content].join(' ').toLocaleLowerCase().normalize('NFKC')}));
 const years=[...new Set(all.map(x=>dateValue(x).slice(0,4)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
 for(const y of years){const o=document.createElement('option');o.value=y;o.textContent=y;year.appendChild(o)}
 const params=new URLSearchParams(location.search);
 if(params.has('q'))q.value=params.get('q');
 if([...cat.options].some(o=>o.value===params.get('category')))cat.value=params.get('category');
 render(true);
}).catch(e=>{status.textContent='Unable to load the archive catalogue. Please check the search files and articles.json.';console.error(e})})();