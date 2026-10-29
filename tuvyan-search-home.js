/* TUVYAN Phase 37: integrate full archive search without altering homepage filtering. */
(()=>{'use strict';
 const input=document.getElementById('site-search'),button=document.getElementById('search-button');
 if(!input||!button)return;
 const go=()=>{const u=new URL('archive-search.html',document.baseURI);const q=input.value.trim();if(q)u.searchParams.set('q',q);window.location.assign(u.href)};
 button.addEventListener('click',e=>{e.stopImmediatePropagation();go()},true);
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go()}},true);
})();
