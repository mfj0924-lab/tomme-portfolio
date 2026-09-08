import {initTitleHover} from './preview-title-hover';
import {runParticleIdentity} from './preview-particle-identity';
const reduce=()=>document.documentElement.hasAttribute('data-reduce');
const ease='cubic-bezier(.16,1,.3,1)';
function animate(el:Element,frames:Keyframe[],duration=520,delay=0){
 if(reduce())return;
 el.getAnimations().forEach(a=>a.cancel());
 el.animate(frames,{duration,delay,easing:ease,fill:'backwards'});
}
function initAmbient(){
 const canvas=document.querySelector<HTMLCanvasElement>('#ambient-stream');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 let w=1,h=1,frame=0,last=0,clock=0;
 const home=document.body.dataset.page==='home';
 const count=home?78:34;
 const nodes=Array.from({length:count},(_,i)=>({x:(i*.618033)%1,y:(i*.37131)%1,phase:i*2.41}));
 function draw(time:number){
  frame=0;clock+=Math.min(40,time-last||16);last=time;
  ctx!.clearRect(0,0,w,h);
  for(const n of nodes){
   const px=((n.x+clock*.000008)%1)*w,py=n.y*h+Math.sin(clock*.00018+n.phase)*19;
   // Keep reading columns quiet; motion remains visible around their perimeter.
   const edge=px<w*.1||px>w*.86||py>h*.82;
   ctx!.fillStyle=edge?'rgba(71,107,80,.34)':'rgba(71,107,80,.12)';
   ctx!.fillRect(px,py,2.2,2.2);ctx!.fillRect(px+7,py+.5,edge?16:7,1);
  }
   if(!canvas!.dataset.rendered)canvas!.dataset.rendered='true';
  if(!document.hidden&&!reduce())frame=requestAnimationFrame(draw);
 }
 function sync(){cancelAnimationFrame(frame);frame=0;last=performance.now();canvas!.dataset.running=String(!document.hidden&&!reduce());if(!document.hidden)draw(last)}
 function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,1.5);canvas!.width=Math.round(w*d);canvas!.height=Math.round(h*d);ctx!.setTransform(d,0,0,d,0,0);sync()}
 window.addEventListener('resize',resize,{passive:true});window.addEventListener('preview:motion',sync);document.addEventListener('visibilitychange',sync);resize();
}
function initCapabilities(){
 const scene=document.querySelector<HTMLElement>('.capability-scene');if(!scene)return;
 const buttons=Array.from(document.querySelectorAll<HTMLElement>('[data-capability]'));
 const text:Record<string,string>={business:'从需求出发，确定要回答的问题。',data:'整理数据，建立模型，并把结果展示出来。',ai:'与 AI 展开实现，再检查结果与实际任务是否一致。'};
 const select=(key:string)=>{
  if(scene.dataset.sceneFocus===key&&scene.dataset.ready)return;scene.dataset.sceneFocus=key;scene.dataset.ready='true';
  buttons.forEach(b=>{const active=b.dataset.capability===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  scene.querySelectorAll<HTMLElement>('[data-scene-node]').forEach(n=>n.classList.toggle('associated',n.dataset.sceneNode!.split(' ').includes(key)));
  scene.querySelectorAll<SVGPathElement>('[data-link]').forEach(p=>{p.classList.toggle('active',p.dataset.link===key);if(p.dataset.link===key&&!reduce()){const length=p.getTotalLength();animate(p,[{strokeDasharray:`${length}`,strokeDashoffset:length},{strokeDasharray:`${length}`,strokeDashoffset:0}],720)}});
  document.querySelector('#scene-caption')!.textContent=text[key];
 };
 buttons.forEach(b=>{b.addEventListener('click',()=>select(b.dataset.capability!));b.addEventListener('focus',()=>select(b.dataset.capability!));b.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)select(b.dataset.capability!)})});
 select('business');
}
function titleReveal(el:HTMLElement){
 // Whole words / Chinese phrases retain their shapes; original accessible text stays in place.
 animate(el,[{clipPath:'inset(0 0 100% 0)',transform:'translateY(32px)',opacity:.2},{clipPath:'inset(0 0 0% 0)',transform:'translateY(0)',opacity:1}],700);
}
export async function initMotion(){
 initAmbient();initCapabilities();initTitleHover();
 const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  const target=entry.target as HTMLElement;
  target.hasAttribute('data-title-reveal')?titleReveal(target):animate(target,[{opacity:.15,transform:'translateY(26px)'},{opacity:1,transform:'translateY(0)'}],540);
  reveal.unobserve(target);
 }),{threshold:.08,rootMargin:'0px 0px -25px 0px'});
 const enteredFromOverlay=await runParticleIdentity();
 document.querySelectorAll<HTMLElement>('[data-title-reveal],[data-reveal],.detail-section>h2,.detail-section>p,.collaboration-steps>article,.reference-list>article,.workflow-reading>li').forEach(el=>{
  const box=el.getBoundingClientRect();
  // The canvas background has already revealed this content in its final position.
  // Still observe content below the fold so subsequent scroll reveals are retained.
  if(enteredFromOverlay&&el.closest('.home-cover')&&box.top<innerHeight&&box.bottom>0)return;
  reveal.observe(el);
 });
 if(!enteredFromOverlay){
  document.querySelectorAll<HTMLElement>('.capability').forEach((el,i)=>animate(el,[{opacity:.1,transform:'translateY(26px)'},{opacity:1,transform:'translateY(0)'}],570,120+i*75));
  const scene=document.querySelector('.capability-scene');if(scene)animate(scene,[{opacity:.2,transform:'translateY(28px) rotate(1.4deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}],850,80);
  const contacts=document.querySelector('.home-contacts');if(contacts)animate(contacts,[{opacity:.2,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],520,280);
 }
}
