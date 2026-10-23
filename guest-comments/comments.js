/* TUVYAN guest comments — Phase 1. No API keys or private data belong in this file. */
(async function(){
const root=document.getElementById('tuvyan-guest-comments');if(!root)return;
const cfg=await fetch('/guest-comments/config.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}));
const page=location.pathname.replace(/^\//,'');
const style=document.createElement('style');style.textContent=`#tuvyan-guest-comments{max-width:850px;margin:3rem auto;padding:1.5rem;border-top:1px solid #bbb;font-family:inherit}#tuvyan-guest-comments label{display:block;margin-top:1rem;font-weight:600}#tuvyan-guest-comments input,#tuvyan-guest-comments textarea{width:100%;box-sizing:border-box;padding:.65rem;border:1px solid #999;border-radius:6px;font:inherit}#tuvyan-guest-comments button{margin-top:1rem;padding:.7rem 1.3rem;border:0;border-radius:6px;background:#224f47;color:white;cursor:pointer}#tuvyan-guest-comments .approved{padding:.8rem 0;border-bottom:1px solid #ddd}#tuvyan-guest-comments .muted{opacity:.8;font-size:.9rem}`;document.head.appendChild(style);
const h=document.createElement('h2');h.textContent='Reader comments';root.appendChild(h);
const note=document.createElement('p');note.textContent='You can send a comment without a GitHub account. Submissions are reviewed before publication. Please avoid sharing private information.';root.appendChild(note);
const list=document.createElement('div');root.appendChild(list);
try{const all=await fetch('/guest-comments/approved-comments.json',{cache:'no-store'}).then(r=>r.json());const comments=all[page]||[];for(const c of comments){const item=document.createElement('div');item.className='approved';const b=document.createElement('strong');b.textContent=c.name||'Reader';const d=document.createElement('small');d.className='muted';d.textContent=' · '+(c.date||'');const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=c.comment||'';item.append(b,d,p);list.appendChild(item)}}catch(e){}
if(!cfg.formsubmit_email){const p=document.createElement('p');p.className='muted';p.textContent='Guest submissions will open once the site owner configures the moderation inbox.';root.appendChild(p);return}
const form=document.createElement('form');form.method='POST';form.action='https://formsubmit.co/'+encodeURIComponent(cfg.formsubmit_email);
const make=(tag,name,label,required=true)=>{const l=document.createElement('label');l.textContent=label;const el=document.createElement(tag);el.name=name;el.required=required;if(tag==='textarea')el.rows=5;l.appendChild(el);form.appendChild(l);return el};
make('input','name','Your display name');const msg=make('textarea','message','Your comment');msg.maxLength=4000;
for(const [k,v] of Object.entries({_subject:'TUVYAN comment awaiting review: '+page,_captcha:'true',_template:'table',page_url:location.href})){const el=document.createElement('input');el.type='hidden';el.name=k;el.value=v;form.appendChild(el)}
const honey=document.createElement('input');honey.type='text';honey.name='_honey';honey.tabIndex=-1;honey.autocomplete='off';honey.style.position='absolute';honey.style.left='-9999px';form.appendChild(honey);
const btn=document.createElement('button');btn.type='submit';btn.textContent='Send comment for approval';form.appendChild(btn);root.appendChild(form);
const privacy=document.createElement('p');privacy.className='muted';privacy.textContent='Submission uses FormSubmit, an external service. Your display name, comment and page URL are emailed to the site owner. No public posting occurs automatically.';root.appendChild(privacy);
})();