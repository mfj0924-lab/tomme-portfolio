import {initViewer} from './preview-viewer';
import {initWorkflow} from './preview-workflow';
import {initMotion} from './preview-motion';
const one=<T extends Element=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const all=<T extends Element=HTMLElement>(s:string)=>Array.from(document.querySelectorAll<T>(s));
const systemMotion=matchMedia('(prefers-reduced-motion:reduce)');
let reduced=systemMotion.matches;
try{reduced=reduced||localStorage.getItem('tomme-reduced-motion')==='true'}catch{}
function updateMotion(){
 document.documentElement.toggleAttribute('data-reduce',reduced);
 one('#motion').textContent=reduced?'动效已减少':'动效已开启';
 one('#motion').setAttribute('aria-pressed',String(reduced));
 if(reduced)document.getAnimations().forEach(a=>a.cancel());
 window.dispatchEvent(new CustomEvent('preview:motion'));
}
one('#motion').addEventListener('click',()=>{reduced=!reduced;try{localStorage.setItem('tomme-reduced-motion',String(reduced))}catch{}updateMotion()});
systemMotion.addEventListener('change',e=>{reduced=e.matches;updateMotion()});
updateMotion();
initViewer();initWorkflow();
function initMethods(){
 const tree=one('.method-tree');if(!tree)return;
 // Opening is immediate; siblings move from their previous positions without animating height.
 all<HTMLDetailsElement>('.method-tree details').forEach(details=>{
  details.querySelector(':scope > summary')!.addEventListener('click',event=>{
   if(reduced)return;
   event.preventDefault();
   const affected=Array.from(tree.querySelectorAll<HTMLElement>('summary')).filter(s=>!details.contains(s));
   const before=new Map(affected.map(s=>[s,s.getBoundingClientRect().top]));
   details.open=!details.open;
   for(const s of affected){s.getAnimations().forEach(a=>a.cancel());const dy=before.get(s)!-s.getBoundingClientRect().top;if(Math.abs(dy)>.5&&s.offsetHeight)s.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'})}
   if(details.open){const body=details.querySelector(':scope > div');body?.getAnimations().forEach(a=>a.cancel());body?.animate([{opacity:.15,transform:'translateY(-7px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.16,1,.3,1)'})}
  });
 });
 one('#expand-methods').addEventListener('click',()=>{
  const ds=all<HTMLDetailsElement>('.method-tree details'),expand=ds.some(d=>!d.open);
  ds.forEach(d=>d.open=expand);one('#expand-methods').textContent=expand?'收起全文':'展开全文';
 });
 const links=document.createElementNS('http://www.w3.org/2000/svg','svg');links.classList.add('method-links');links.setAttribute('aria-hidden','true');tree.prepend(links);
 function connect(){
  if(!tree.clientWidth||innerWidth<761)return;
  const bounds=tree.getBoundingClientRect(),root=one('.method-root').getBoundingClientRect(),sx=root.right-bounds.left,sy=root.top+root.height/2-bounds.top;
  links.setAttribute('viewBox',`0 0 ${tree.clientWidth} ${tree.clientHeight}`);
  links.replaceChildren(...all('.method-branch>summary').map(summary=>{
   const r=summary.getBoundingClientRect(),ex=r.left-bounds.left,ey=r.top+r.height/2-bounds.top;
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M${sx} ${sy} C${sx+55} ${sy},${ex-55} ${ey},${ex} ${ey}`);
   if((summary.parentElement as HTMLDetailsElement).open)path.classList.add('active');return path;
  }));
 }
 new ResizeObserver(connect).observe(tree);
 all<HTMLDetailsElement>('.method-branch').forEach((d,i)=>{d.id=['analysis','ai','challenge'][i];d.addEventListener('toggle',connect)});
 let frame=0;window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;connect()})},{passive:true});
 function hash(){const d=document.getElementById(location.hash.slice(1));if(d instanceof HTMLDetailsElement){d.open=true;requestAnimationFrame(()=>d.scrollIntoView({block:'start',behavior:'instant'}))}}
 hash();window.addEventListener('hashchange',hash);
}
initMethods();
function initCards(){
 const stage=one('.project-stage');if(!stage)return;
 const positions=all('[data-index]'),cards=all<HTMLAnchorElement>('[data-card]'),pickers=all('[data-pick]');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 let selected=0,hover:number|null=null,ignoreClickUntil=0;
 function render(){
  const width=stage.clientWidth,mobile=width<760,spacing=mobile?Math.min(178,width*.46):Math.min(225,width*.175);
  let hd=hover===null?null:(hover-selected+cards.length)%cards.length;if(hd!==null&&hd>2)hd-=cards.length;
  positions.forEach((p,i)=>{
   let d=(i-selected+cards.length)%cards.length;if(d>2)d-=cards.length;
   const active=hover===null?d===0:i===hover,shift=hd===null?0:d<hd?-18:d>hd?18:0;
   p.style.transform=`translate3d(${d*spacing+shift}px,${active?0:Math.abs(d)*27}px,0) rotate(${active?0:d*5.5}deg) scale(${active?1:.88})`;
   p.style.zIndex=String(active?40:20-Math.abs(d));p.classList.toggle('selected',active);
  });
  pickers.forEach((b,i)=>{b.classList.toggle('active',i===selected);b.setAttribute('aria-pressed',String(i===selected))});
  const themes=['citibike','adventureworks','workbench','qingdao-transit','rnd-patent'];
  document.body.dataset.theme=themes[hover??selected];
 }
 function choose(i:number){selected=(i+cards.length)%cards.length;hover=null;render()}
 stage.dataset.ready='true';render();
 requestAnimationFrame(()=>stage.classList.add('cards-entered'));
 pickers.forEach((b,i)=>b.addEventListener('click',()=>choose(i)));
 all('[data-arc]').forEach(b=>b.addEventListener('click',()=>choose(selected+(b.dataset.arc==='next'?1:-1))));
 stage.addEventListener('pointermove',e=>{
  if(!fine.matches||reduced)return;const r=stage.getBoundingClientRect(),spacing=Math.min(225,r.width*.175);
  const slot=Math.max(-2,Math.min(2,Math.round((e.clientX-r.left-r.width/2)/spacing))),i=(selected+slot+cards.length)%cards.length;
  if(hover!==i){hover=i;render()}
 });
 stage.addEventListener('pointerleave',()=>{hover=null;render()});
 cards.forEach((card,i)=>{
  card.addEventListener('focus',()=>{if(!card.matches(':focus-visible'))return;choose(i)});
  card.addEventListener('click',e=>{if(performance.now()<ignoreClickUntil){e.preventDefault();return}if(!fine.matches&&i!==selected){e.preventDefault();choose(i)}});
  let raf=0;
  card.addEventListener('pointermove',e=>{if(!fine.matches||reduced)return;const r=card.parentElement!.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>card.style.transform=`rotateX(${-y*5}deg) rotateY(${x*7}deg)`)});
  card.addEventListener('pointerleave',()=>{cancelAnimationFrame(raf);card.style.transform=''});
 });
 let drag:{x:number;y:number}|null=null;
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')drag={x:e.clientX,y:e.clientY}});
 stage.addEventListener('pointerup',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3){ignoreClickUntil=performance.now()+400;choose(selected+(dx<0?1:-1))}});
 stage.addEventListener('pointercancel',()=>drag=null);
 stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();choose(selected+(e.key==='ArrowRight'?1:-1));cards[selected].focus({preventScroll:true})}});
 new ResizeObserver(render).observe(stage);
}
initCards();
function initFolder(){
 const folder=one('#folder');if(!folder)return;
 const toggle=one('#folder-toggle'),select=one<HTMLSelectElement>('#gallery-select'),docs=all<HTMLButtonElement>('.folder-document');
 const pick=()=>{docs.forEach((d,i)=>d.classList.toggle('picked',i===select.selectedIndex));one('#gallery-description').textContent=docs[select.selectedIndex].dataset.caption||''};
 toggle.addEventListener('click',()=>{const open=folder.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'收起项目材料':'打开项目材料')});
 select.addEventListener('change',()=>{folder.classList.add('open');toggle.setAttribute('aria-expanded','true');pick()});
 one('#gallery-open').addEventListener('click',()=>docs[select.selectedIndex].click());
 docs.forEach((d,i)=>d.addEventListener('click',()=>{select.selectedIndex=i;pick()}));pick();
}
initFolder();
function initContacts(){
// Contact information appears only after the visitor selects a contact method.
const contact=one<HTMLDialogElement>('#contact-dialog'),number=one<HTMLInputElement>('#contact-number'),launch=one<HTMLAnchorElement>('#contact-launch');
all('[data-contact]').forEach(b=>b.addEventListener('click',()=>{
 const qq=b.dataset.contact==='qq';number.value=qq?'1877916299':'ccsjt0924';
 one('#contact-title').textContent=qq?'通过 QQ 联系我':'添加我的微信';
 one('#contact-instruction').textContent=qq?'可以复制 QQ 号添加好友，或尝试打开已安装的 QQ。':'复制微信号后，在微信“添加朋友”中搜索。';
 launch.hidden=!qq;launch.href='mqqwpa://im/chat?chat_type=wpa&uin=1877916299&version=1&src_type=web';
 one('#contact-status').textContent=qq?'是否能够打开应用取决于设备与浏览器设置。':'';
 contact.showModal();
}));
one('[data-contact-close]').addEventListener('click',()=>contact.close());
one('#contact-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(number.value);one('#contact-status').textContent='账号已复制。'}catch{number.focus();number.select();one('#contact-status').textContent='浏览器未允许自动复制，账号已选中，请手动复制。'}});
launch.addEventListener('click',()=>{one('#contact-status').textContent='若 QQ 没有打开，请复制账号后在 QQ 中搜索。'});
all('.magnetic-contact').forEach(button=>{button.addEventListener('pointermove',e=>{if(reduced||!matchMedia('(pointer:fine)').matches)return;const r=button.getBoundingClientRect();button.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.05}px,${(e.clientY-r.top-r.height/2)*.1}px)`});button.addEventListener('pointerleave',()=>button.style.transform='')});

}
if(one('#contact-dialog'))initContacts();
const toc=all<HTMLAnchorElement>('.detail-nav a[href^="#"]');
if(toc.length){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)toc.forEach(a=>a.setAttribute('aria-current',a.hash==='#'+entry.target.id?'location':'false'))}),{rootMargin:'-18% 0px -65% 0px'});all('.detail-section').forEach(section=>observer.observe(section))}
void initMotion();
