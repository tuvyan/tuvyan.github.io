/* TUVYAN Phase 15: curated reading series and clearly marked suggested related titles.
   Data is managed in Studio; article contents are never edited by this script. */
(function(){'use strict';
  var path=decodeURIComponent(location.pathname.replace(/^\/+/,''));
  var parts=path.split('/');
  var rootIndex=parts.indexOf('tuvyan.github.io');
  if(rootIndex>=0)parts=parts.slice(rootIndex+1);
  var file=parts.join('/');
  if(!/\.html$/i.test(file))return;
  var base=new URL('/',location.origin);
  function elt(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
  function makeLink(target,title,label){var a=elt('a','tuvyan-reading-link');a.href=new URL(target.split('/').map(encodeURIComponent).join('/'),base).href;a.appendChild(elt('span','tuvyan-reading-kicker',label));a.appendChild(elt('strong','',title));return a;}
  function json(name){return fetch(new URL(name,base),{cache:'no-cache'}).then(function(r){if(!r.ok)throw Error(name+' HTTP '+r.status);return r.json();});}
  Promise.all([json('tuvyan-reading-links.json'),json('tuvyan-related-reading.json'),json('articles.json')]).then(function(data){
    var curated=data[0],suggestions=data[1],catalog=data[2],titles={},panel=elt('aside','tuvyan-reading-panel');
    panel.setAttribute('aria-label','Continue reading on TUVYAN');
    catalog.forEach(function(a){if(a.file&&a.title)titles[a.file]=a.title;});
    var groups=(curated.series||[]).filter(function(s){return Array.isArray(s.articles)&&s.articles.indexOf(file)>=0;});
    groups.forEach(function(s){var idx=s.articles.indexOf(file),group=elt('section','tuvyan-reading-group');
      group.appendChild(elt('p','tuvyan-reading-eyebrow','READING SERIES'));
      group.appendChild(elt('h2','',s.name));group.appendChild(elt('p','tuvyan-reading-position','Article '+(idx+1)+' of '+s.articles.length));
      var nav=elt('nav','tuvyan-reading-nav');nav.setAttribute('aria-label','Series navigation');
      if(idx>0&&titles[s.articles[idx-1]])nav.appendChild(makeLink(s.articles[idx-1],titles[s.articles[idx-1]],'← Previous in series'));
      if(idx+1<s.articles.length&&titles[s.articles[idx+1]])nav.appendChild(makeLink(s.articles[idx+1],titles[s.articles[idx+1]],'Next in series →'));
      group.appendChild(nav);
      var details=elt('details','tuvyan-reading-all');details.appendChild(elt('summary','','View all articles in this series'));
      var list=elt('ol');s.articles.forEach(function(target){if(!titles[target])return;var li=elt('li');if(target===file)li.appendChild(elt('strong','',titles[target]+' (current)'));else{var a=elt('a','',titles[target]);a.href=makeLink(target,titles[target],'').href;li.appendChild(a);}list.appendChild(li);});details.appendChild(list);group.appendChild(details);panel.appendChild(group);
    });
    var related=((curated.related||{})[file]||[]).filter(function(target){return target!==file&&titles[target];});
    if(related.length){var group=elt('section','tuvyan-reading-group');group.appendChild(elt('p','tuvyan-reading-eyebrow','RELATED READING'));group.appendChild(elt('h2','','Selected connections'));var nav=elt('nav','tuvyan-reading-nav');related.forEach(function(target){nav.appendChild(makeLink(target,titles[target],'Read related article →'));});group.appendChild(nav);panel.appendChild(group);}
    var proposals=((suggestions.links||{})[file]||[]).filter(function(target){return target!==file&&titles[target]&&related.indexOf(target)<0&&!groups.some(function(s){return s.articles.indexOf(target)>=0;});}).slice(0,4);
    if(proposals.length){var group=elt('section','tuvyan-reading-group tuvyan-reading-suggested');group.appendChild(elt('p','tuvyan-reading-eyebrow','EXPLORE THE ARCHIVE'));group.appendChild(elt('h2','','Other articles with similar titles'));group.appendChild(elt('p','tuvyan-reading-position','Suggested by title similarity; not an editorially confirmed series.'));var nav=elt('nav','tuvyan-reading-nav');proposals.forEach(function(target){nav.appendChild(makeLink(target,titles[target],'Explore article →'));});group.appendChild(nav);panel.appendChild(group);}
    if(!panel.children.length)return;
    var main=document.querySelector('main');if(main)main.insertAdjacentElement('afterend',panel);else{var footer=document.querySelector('footer');if(footer)footer.insertAdjacentElement('beforebegin',panel);else document.body.appendChild(panel);}
  }).catch(function(e){console.warn('TUVYAN reading connections:',e.message);});
})();
