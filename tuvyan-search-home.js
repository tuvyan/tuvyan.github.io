/* TUVYAN homepage search: use the same working search engine as Advanced Search. */
(()=>{'use strict';
 const input=document.getElementById('site-search');
 const button=document.getElementById('search-button');
 if(!input||!button)return;
 const go=(event)=>{
   if(event){event.preventDefault();event.stopImmediatePropagation();}
   const url=new URL('search/',document.baseURI);
   const query=input.value.trim();
   if(query)url.searchParams.set('q',query);
   window.location.assign(url.href);
 };
 button.addEventListener('click',go,true);
 input.addEventListener('keydown',event=>{if(event.key==='Enter')go(event);},true);
})();
