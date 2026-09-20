
// Normal links remain usable without JavaScript or storage.
const key='project-reading-transition';
const read=(k:string)=>{try{return sessionStorage.getItem(k);}catch{return null;}};
const write=(k:string,v:string)=>{try{sessionStorage.setItem(k,v);}catch{}};
const remove=(k:string)=>{try{sessionStorage.removeItem(k);}catch{}};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let busy=false;
function curtain(title:string){
 const el=document.createElement('div');el.className='project-transition';el.setAttribute('aria-hidden','true');
 for(let i=0;i<6;i++)el.append(document.createElement('i'));
 const label=document.createElement('strong');label.textContent=title;el.append(label);document.body.append(el);return el;
}
async function animate(el:HTMLElement,cover:boolean,reverse:boolean){
 const pieces=Array.from(el.querySelectorAll('i'));
 const promises=pieces.map((p,i)=>{
 const distance=Math.abs(i-2.5)-.5;
 return p.animate([{transform:`scaleY(${cover?0:1})`},{transform:`scaleY(${cover?1:0})`}],{duration:210,delay:(reverse?2-distance:distance)*25,easing:'cubic-bezier(.23,1,.32,1)',fill:'forwards'}).finished;
 });
 el.querySelector('strong')!.animate([{opacity:cover?0:1},{opacity:cover?1:0}],{duration:160,fill:'forwards'});
 await Promise.all(promises);
}
async function arrive(){
 const raw=read(key);if(!raw)return;
 remove(key);
 try{
 const info=JSON.parse(raw);if(info.path!==location.pathname||Date.now()-info.time>15000)return;
 if(info.back){const y=Number(read('project-scroll:'+location.pathname)||0);if(document.readyState!=='complete')await new Promise<void>(resolve=>addEventListener('load',()=>resolve(),{once:true}));await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));window.scrollTo({top:y,behavior:'instant'});}
 if(info.motion&&!reduced()){const el=curtain(info.title);await animate(el,false,info.back);el.remove();}
 }catch{}
}
document.addEventListener('click',async e=>{
 const a=(e.target as Element).closest<HTMLAnchorElement>('a[href]');
 if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
 const url=new URL(a.href);if(url.origin!==location.origin)return;
 const match=location.pathname.match(/^(.*\/projects\/(citibike|adventureworks)\/)(details\/)?$/);
 if(!match)return;
 const back=!!match[3];if(url.pathname!==(back?match[1]:match[1]+'details/'))return;
 e.preventDefault();if(busy)return;busy=true;
 if(!back)write('project-scroll:'+location.pathname,String(scrollY));
 const title=match[2]==='citibike'?'CitiBike':'AdventureWorks';const motion=!reduced()&&e.detail!==0;
 write(key,JSON.stringify({path:url.pathname,time:Date.now(),back,title,motion}));
 if(motion){try{await animate(curtain(title),true,back);}catch{}}
 location.assign(url.href);
});
addEventListener('pageshow',()=>{busy=false;document.querySelectorAll('.project-transition').forEach(e=>e.remove());});
arrive();
