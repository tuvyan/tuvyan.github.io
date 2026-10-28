(()=>{'use strict';
const root=document.createElement('nav');root.className='tuvyan-article-navigation';root.setAttribute('aria-label','Article navigation');
const here=decodeURIComponent(location.pathname).replace(/^\/+/, '');
const rootPrefix=here.includes('/')?'../':'';
const safe=(v)=>typeof v==='string'&&v.length<240&&!v.startsWith('/')&&!v.includes('..')&&!/^[a-z]+:/i.test(v)&&/\.html?(?:$|[?#])/i.test(v);
const mk=(href,label)=>{const a=document.createElement('a');a.href=rootPrefix+href;a.textContent=label;return a};
const section=(heading)=>{const div=document.createElement('div');div.className='tuvyan-nav-group';const h=document.createElement('h2');h.textContent=heading;div.append(h);root.append(div);return div};
const main=section('Explore TUVYAN');main.append(mk('search/','Search the archive'),mk('paperspublications.html','Papers & Publications'),mk('gus-saboy-memorial.html','Gus Saboy Memorial'));
const cleanTitle=s=>s.replace(/\.html?$/i,'').replace(/^.*\//,'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
Promise.allSettled([fetch(rootPrefix+'tuvyan-reading-links.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}),fetch(rootPrefix+'tuvyan-related-reading.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()})]).then(results=>{
const unique=new Set();const links=[];const add=p=>{if(safe(p)&&p!==here&&!unique.has(p)){unique.add(p);links.push(p)}};
const a=results[0].status==='fulfilled'?results[0].value:{};
if(a.related&&Array.isArray(a.related[here]))a.related[here].forEach(add);
if(Array.isArray(a.series))a.series.forEach(s=>{const list=s.articles||[];const ix=list.indexOf(here);if(ix>=0){if(ix>0)add(list[ix-1]);if(ix+1<list.length)add(list[ix+1])}});
const b=results[1].status==='fulfilled'?results[1].value:{};
if(b.links&&Array.isArray(b.links[here]))b.links[here].forEach(add);
if(links.length){const sec=section('Related reading');links.slice(0,6).forEach(p=>sec.append(mk(p,cleanTitle(p))))}
});
const holder=document.querySelector('article')||document.querySelector('main')||document.body;
holder.append(root);
})();