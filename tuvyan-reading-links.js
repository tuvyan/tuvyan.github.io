/* TUVYAN related reading, Phase 9. Add/edit relationships in tuvyan-reading-links.json. */
(function(){
  'use strict';
  var file=decodeURIComponent(location.pathname.split('/').pop()||'');
  if(!file || !/\.html$/i.test(file)) return;
  function element(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt)n.textContent=txt;return n;}
  function link(file,title,label){var a=element('a','tuvyan-reading-link');a.href='./'+encodeURIComponent(file);a.appendChild(element('span','tuvyan-reading-kicker',label));a.appendChild(element('strong','',title));return a;}
  Promise.all([
    fetch('./tuvyan-reading-links.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw Error('Reading links unavailable');return r.json();}),
    fetch('./articles.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw Error('Article index unavailable');return r.json();})
  ]).then(function(data){
    var cfg=data[0],catalog=data[1],titles={};catalog.forEach(function(x){if(x.file&&x.title)titles[x.file]=x.title;});
    var membership=(cfg.series||[]).filter(function(s){return Array.isArray(s.articles)&&s.articles.indexOf(file)!==-1;});
    var related=((cfg.related||{})[file]||[]).filter(function(x){return x!==file&&titles[x];});
    if(!membership.length&&!related.length)return;
    var container=element('aside','tuvyan-reading-panel');container.setAttribute('aria-label','Continue reading on TUVYAN');
    membership.forEach(function(s){
      var idx=s.articles.indexOf(file),group=element('section','tuvyan-reading-group');
      group.appendChild(element('p','tuvyan-reading-eyebrow','READING SERIES'));
      group.appendChild(element('h2','',s.name));
      group.appendChild(element('p','tuvyan-reading-position','Article '+(idx+1)+' of '+s.articles.length));
      var nav=element('nav','tuvyan-reading-nav');nav.setAttribute('aria-label','Series navigation');
      if(idx>0&&titles[s.articles[idx-1]])nav.appendChild(link(s.articles[idx-1],titles[s.articles[idx-1]],'← Previous in series'));
      if(idx+1<s.articles.length&&titles[s.articles[idx+1]])nav.appendChild(link(s.articles[idx+1],titles[s.articles[idx+1]],'Next in series →'));
      group.appendChild(nav);
      var details=element('details','tuvyan-reading-all');details.appendChild(element('summary','','View all articles in this series'));
      var ol=element('ol');s.articles.forEach(function(f){if(!titles[f])return;var li=element('li');if(f===file){li.appendChild(element('strong','',titles[f]+' (current)'));}else{var a=element('a','',titles[f]);a.href='./'+encodeURIComponent(f);li.appendChild(a);}ol.appendChild(li);});details.appendChild(ol);group.appendChild(details);container.appendChild(group);
    });
    if(related.length){var group=element('section','tuvyan-reading-group');group.appendChild(element('p','tuvyan-reading-eyebrow','RELATED READING'));group.appendChild(element('h2','','Explore similar subjects'));var nav=element('nav','tuvyan-reading-nav');nav.setAttribute('aria-label','Related articles');related.forEach(function(f){nav.appendChild(link(f,titles[f],'Read related article →'));});group.appendChild(nav);container.appendChild(group);}
    var anchor=document.querySelector('main');if(anchor&&anchor.parentNode){anchor.insertAdjacentElement('afterend',container);}else{var footer=document.querySelector('footer');if(footer)footer.insertAdjacentElement('beforebegin',container);else document.body.appendChild(container);}
  }).catch(function(err){console.warn('TUVYAN reading links:',err.message);});
}());
