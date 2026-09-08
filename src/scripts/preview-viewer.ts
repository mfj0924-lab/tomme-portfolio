type Shot={src:string;alt?:string;title?:string;caption:string};
export function initViewer(){
 const dialog=document.querySelector<HTMLDialogElement>('#image-dialog')!;
 const image=dialog.querySelector<HTMLImageElement>('#full-image')!,viewport=dialog.querySelector<HTMLElement>('.image-viewport')!;
 const get=<T extends HTMLElement=HTMLElement>(s:string)=>dialog.querySelector<T>(s)!;
 const shelf=document.querySelector<HTMLElement>('.window-shelf')!;
 let shots:Shot[]=[],index=0,scale=1,x=0,y=0,fitMode=true,origin:HTMLElement|null=null;
 const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 function paint(){
  if(!image.naturalWidth)return;
  const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
  x=iw<=viewport.clientWidth?(viewport.clientWidth-iw)/2:clamp(x,viewport.clientWidth-iw,0);
  y=ih<=viewport.clientHeight?(viewport.clientHeight-ih)/2:clamp(y,viewport.clientHeight-ih,0);
  image.style.width=image.naturalWidth+'px';image.style.height=image.naturalHeight+'px';
  image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  get('#image-zoom-value').textContent=Math.round(scale*100)+'%';
  dialog.querySelectorAll<HTMLElement>('[data-image-zoom]').forEach(b=>b.classList.toggle('active',b.dataset.imageZoom===(fitMode?'fit':Math.abs(scale-1)<.001?'native':'')));
 }
 function fit(){if(!image.naturalWidth||!viewport.clientWidth)return;fitMode=true;scale=Math.min(viewport.clientWidth/image.naturalWidth,viewport.clientHeight/image.naturalHeight,1);x=0;y=0;paint()}
 function zoom(next:number,cx=viewport.clientWidth/2,cy=viewport.clientHeight/2){next=clamp(next,.08,5);fitMode=false;x=cx-(cx-x)*next/scale;y=cy-(cy-y)*next/scale;scale=next;paint()}
 function show(next:number){
  index=clamp(next,0,shots.length-1);const shot=shots[index];if(!shot)return;
  get('#viewer-title').textContent=shot.alt||shot.title||'项目截图';get('#full-caption').textContent=shot.caption;
  get('#image-position').textContent=`${index+1} / ${shots.length}`;
  get<HTMLAnchorElement>('#viewer-original').href=shot.src;image.alt=shot.alt||shot.title||'项目截图';
  get<HTMLButtonElement>('.image-prev').disabled=index===0;get<HTMLButtonElement>('.image-next').disabled=index===shots.length-1;
  dialog.querySelectorAll<HTMLElement>('.image-nav').forEach(b=>b.hidden=shots.length<2);
  fitMode=true;image.style.opacity='0';image.onload=()=>{fit();image.style.opacity='1'};
  image.onerror=()=>{image.style.opacity='0';get('#full-caption').textContent=shot.caption+' 图片未能读取，请尝试打开原文件。'};
  image.src=shot.src;if(image.complete&&image.naturalWidth){fit();image.style.opacity='1'}
  const nextShot=shots[index+1];if(nextShot){const preload=new Image();preload.src=nextShot.src}
 }
 document.querySelectorAll<HTMLElement>('[data-image]').forEach(trigger=>trigger.addEventListener('click',e=>{
  if(e instanceof MouseEvent&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;
  e.preventDefault();origin=trigger;
  const data=trigger.closest('[data-gallery-root]')?.querySelector('.gallery-data');
  shots=data?JSON.parse(data.textContent!):[{src:trigger.dataset.image!,title:trigger.dataset.title,caption:trigger.dataset.caption||''}];
  index=Math.max(0,shots.findIndex(s=>s.src===trigger.dataset.image));shelf.hidden=true;
  if(!dialog.open)dialog.showModal();show(index);
 }));
 dialog.querySelectorAll<HTMLElement>('[data-image-direction]').forEach(b=>b.addEventListener('click',()=>show(index+Number(b.dataset.imageDirection))));
 dialog.querySelectorAll<HTMLElement>('[data-image-zoom]').forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.imageZoom;action==='fit'?fit():zoom(action==='native'?1:scale*(action==='in'?1.25:.8))}));
 viewport.addEventListener('wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();zoom(scale*Math.exp(-clamp(e.deltaY,-140,140)*.002),e.clientX-r.left,e.clientY-r.top)},{passive:false});
 const pointers=new Map<number,{x:number;y:number}>();let swipe:{x:number;y:number;allowed:boolean}|null=null;
 viewport.addEventListener('pointerdown',e=>{if(e.button>1)return;e.preventDefault();viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)swipe={x:e.clientX,y:e.clientY,allowed:e.pointerType==='touch'&&fitMode};else if(swipe)swipe.allowed=false});
 viewport.addEventListener('pointermove',e=>{
  const previous=pointers.get(e.pointerId);if(!previous)return;
  if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)![1];const before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y),r=viewport.getBoundingClientRect();if(before>3)zoom(scale*after/before,(e.clientX+other.x)/2-r.left,(e.clientY+other.y)/2-r.top)}
  else if(!swipe?.allowed){x+=e.clientX-previous.x;y+=e.clientY-previous.y;paint()}
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 });
 viewport.addEventListener('pointerup',e=>{if(swipe?.allowed&&pointers.size===1){const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?1:-1))}pointers.delete(e.pointerId);swipe=null});
 ['pointercancel','lostpointercapture'].forEach(type=>viewport.addEventListener(type,e=>{pointers.delete((e as PointerEvent).pointerId);swipe=null}));
 viewport.addEventListener('dblclick',e=>{const r=viewport.getBoundingClientRect();fitMode?zoom(1,e.clientX-r.left,e.clientY-r.top):fit()});
 dialog.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','+','=','-','0'].includes(e.key))e.preventDefault();
  if(e.key==='ArrowLeft')show(index-1);if(e.key==='ArrowRight')show(index+1);
  if(e.key==='+'||e.key==='=')zoom(scale*1.25);if(e.key==='-')zoom(scale*.8);if(e.key==='0')fit();
 });
 dialog.querySelectorAll<HTMLElement>('[data-window]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.window==='maximize'){dialog.classList.toggle('maximized');b.setAttribute('aria-pressed',String(dialog.classList.contains('maximized')));return}
  dialog.close();if(b.dataset.window==='minimize')shelf.hidden=false;
 }));
 dialog.addEventListener('close',()=>{pointers.clear();swipe=null;origin?.focus({preventScroll:true})});
 document.querySelector('#restore-window')!.addEventListener('click',()=>{dialog.showModal();shelf.hidden=true;if(fitMode)fit()});
 new ResizeObserver(()=>{if(dialog.open)fitMode?fit():paint()}).observe(viewport);
}
