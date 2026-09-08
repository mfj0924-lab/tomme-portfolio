// The approved A sequence: original portrait → outward flow → homepage Tomme.
// All coordinates are CSS pixels; only the backing canvas uses device pixel ratio.
type Dot={bx:number;by:number;x:number;y:number;shade:number;phase:number;edge:boolean;heat:number};
type RGB=[number,number,number];
const reduce=()=>document.documentElement.hasAttribute('data-reduce');
const fine=matchMedia('(hover:hover) and (pointer:fine)');
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const light:RGB[]=Array.from({length:18},(_,i)=>[64+i*10,91+i*8,76+i*8]);
const dark:RGB[]=Array.from({length:18},(_,i)=>[34+i*1.1,53+i*1.6,43+i*1.1]);
const css=(c:RGB)=>`rgb(${c.map(Math.round).join(',')})`;
const point=(x:number,y:number,shade:number,phase:number,edge=false):Dot=>({bx:x,by:y,x,y,shade,phase,edge,heat:0});
const pad=20;
const entryGatherMs=1600,entryTransitionMs=2600;

function paint(ctx:CanvasRenderingContext2D,dots:Dot[],size:number,palette:RGB[]){
 for(let shade=0;shade<palette.length;shade++){
  ctx.fillStyle=css(palette[shade]);ctx.beginPath();
  for(const d of dots)if(d.shade===shade)ctx.rect(d.x-size/2,d.y-size/2,size,size);
  ctx.fill();
 }
 ctx.fillStyle='#c34e30';ctx.beginPath();
 for(const d of dots)if(d.heat>.2)ctx.rect(d.x-size/2,d.y-size/2,size,size);
 ctx.fill();
}

function initParticleName(){
 const title=document.querySelector<HTMLElement>('#home-title.particle-name');
 const canvas=document.querySelector<HTMLCanvasElement>('#name-particles');
 const ctx=canvas?.getContext('2d');if(!title||!canvas||!ctx)return null;
 const glyph=title.querySelector<HTMLElement>('.particle-name-fallback')!;
 let w=1,h=1,dots:Dot[]=[],frame=0,last=0,clock=0,visible=false,active=false,gather=0;
 let mouse={x:-1000,y:-1000};
 function size(){
  const r=glyph.getBoundingClientRect(),style=getComputedStyle(title!);w=r.width+pad*2;h=r.height+pad*2;
  const dpr=Math.min(devicePixelRatio,1.5);canvas!.width=Math.round(w*dpr);canvas!.height=Math.round(h*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0);
  const mask=document.createElement('canvas');mask.width=Math.ceil(w);mask.height=Math.ceil(h);
  const m=mask.getContext('2d',{willReadFrequently:true});if(!m)return;
  m.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;m.fillStyle='#fff';
  // Match the visible HTML fallback rather than stretching a sampled bitmap.
  if('letterSpacing' in m)m.letterSpacing=style.letterSpacing;
  const metrics=m.measureText('Tomme');
  const baseline=pad+(r.height-metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2+metrics.actualBoundingBoxAscent;
  m.fillText('Tomme',pad,baseline);
  const pixels=m.getImageData(0,0,mask.width,mask.height).data,step=2.45;
  dots=[];
  for(let y=pad;y<h-pad;y+=step)for(let x=pad;x<w-pad;x+=step){
   const ix=Math.floor(x),iy=Math.floor(y),a=pixels[(iy*mask.width+ix)*4+3];
   if(a<100)continue;
   const edge=a<245||pixels[(iy*mask.width+Math.max(0,ix-2))*4+3]<100||pixels[(Math.max(0,iy-2)*mask.width+ix)*4+3]<100;
   dots.push(point(x,y,edge?10:3,(ix*7+iy*13)*.21,edge));
  }
  canvas!.dataset.count=String(dots.length);sync();
 }
 function draw(t:number){
  frame=0;const dt=Math.min(40,t-last||16);last=t;clock+=dt;
  const moving=fine.matches&&!reduce(),easing=1-Math.exp(-dt/65),remaining=moving?1-smooth((t-gather)/650):0;
  ctx!.clearRect(0,0,w,h);
  for(const d of dots){
   let x=d.bx,y=d.by,heat=0;
   if(moving){
    if(d.edge){x+=Math.sin(clock*.00065+d.phase)*.65;y+=Math.cos(clock*.00045+d.phase)*.65}
    const dx=x-mouse.x,dy=y-mouse.y,dist=Math.hypot(dx,dy);
    if(dist<52){const force=(1-dist/52)**2*18;x+=dx/Math.max(dist,1)*force;y+=dy/Math.max(dist,1)*force;heat=1-dist/52}
    x+=Math.cos(d.phase)*remaining*70;y+=Math.sin(d.phase)*remaining*35;
   }
   d.x=moving?lerp(d.x,x,easing):d.bx;d.y=moving?lerp(d.y,y,easing):d.by;d.heat=moving?lerp(d.heat,heat,easing):0;
  }
  paint(ctx!,dots,1.85,dark);canvas!.dataset.rendered='true';
  if(active&&visible&&!document.hidden&&moving)frame=requestAnimationFrame(draw);
  canvas!.dataset.running=String(!!frame);
 }
 function sync(){
  cancelAnimationFrame(frame);frame=0;last=performance.now();
  if(active&&visible&&!document.hidden)draw(last);else canvas!.dataset.running='false';
 }
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.1});observer.observe(title);
 const resizeObserver=new ResizeObserver(size);resizeObserver.observe(glyph);
 // Font swapping must also resample the canvas, including when its box keeps the same size.
 document.fonts.addEventListener('loadingdone',size);
 title.addEventListener('pointermove',e=>{if(!fine.matches||reduce())return;const r=canvas!.getBoundingClientRect();mouse={x:e.clientX-r.left,y:e.clientY-r.top}});
 title.addEventListener('pointerleave',()=>{mouse={x:-1000,y:-1000}});
 window.addEventListener('preview:motion',sync);document.addEventListener('visibilitychange',sync);fine.addEventListener('change',sync);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();resizeObserver.disconnect();document.fonts.removeEventListener('loadingdone',size)},{once:true});
 size();
 return {
  target(){const r=canvas!.getBoundingClientRect();return dots.map(d=>({x:r.left+d.bx,y:r.top+d.by,shade:d.shade}))},
  show(assemble:boolean){active=true;gather=assemble?performance.now():0;title!.toggleAttribute('data-particles-ready',dots.length>0);sync()},
 };
}

function samplePortrait(image:HTMLImageElement):Dot[]{
 const mask=document.createElement('canvas');mask.width=200;mask.height=250;
 const ctx=mask.getContext('2d',{willReadFrequently:true});if(!ctx||!image.naturalWidth)return [];
 // Same color-based studio-background removal as the approved V3 demo.
 ctx.drawImage(image,0,0,mask.width,mask.height);
 const pixels=ctx.getImageData(0,0,mask.width,mask.height).data,dots:Dot[]=[];
 for(let y=12;y<246;y+=2)for(let x=8;x<194;x+=2){
  const i=(y*mask.width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
  if(Math.min(r,g,b)>238||(b-r>10&&g>=r&&r>40&&r<190))continue;
  const radial=((x-100)/97)**2+((y-129)/137)**2;
  if(radial>1.2||y>225&&(x+y)%6!==0)continue;
  const shade=Math.round(clamp((r*.3+g*.59+b*.11)/255)*17);
  dots.push(point(x/200,y/250,shade,(x*13+y*7)*.19,radial>.82));
 }
 return dots;
}

// True means the overlay already revealed the homepage (including an interrupted entry).
export async function runParticleIdentity():Promise<boolean>{
 const name=initParticleName(),dialog=document.querySelector<HTMLDialogElement>('#site-entrance');
 if(!dialog){name?.show(false);return false}
 const key='tomme-entered-identity-a';
 let seen=false;try{seen=sessionStorage.getItem(key)==='true'}catch{}
 if(seen||reduce()||location.hash){name?.show(!reduce()&&!location.hash);return false}
 const canvas=dialog.querySelector<HTMLCanvasElement>('#entry-stream')!,ctx=canvas.getContext('2d');
 if(!ctx){name?.show(false);return false}
 const image=dialog.querySelector<HTMLImageElement>('#entry-portrait-source')!;
 const portrait=dialog.querySelector<HTMLElement>('.entry-portrait')!;
 await new Promise<void>(resolve=>{
  let w=1,h=1,frame=0,last=0,clock=0,started=0,leaving=false,done=false,loadedAt=0,portraitDots:Dot[]=[],cloud:Dot[]=[];
  let photoBox={left:0,top:0,width:0,height:0};
  let mouse={x:-1000,y:-1000};
  let targets:ReturnType<NonNullable<typeof name>['target']>=[];
  const stars=Array.from({length:innerWidth<761?100:210},(_,i)=>{const radius=.05+(i*.41421%1)*.85;return{x:Math.sin(i*97.41)*radius,y:Math.cos(i*97.41)*radius,z:.15+(i*.618033%1),orange:i%13===0}});
  const cleanup=new AbortController(),signal=cleanup.signal;
  function finish(animateName=false){
   if(done)return;done=true;cancelAnimationFrame(frame);cleanup.abort();dialog!.close();document.body.classList.remove('entering-site');
   canvas.dataset.running='false';name?.show(animateName);try{sessionStorage.setItem(key,'true')}catch{}resolve();
   document.querySelector<HTMLElement>('#main .home-actions a')?.focus({preventScroll:true});
  }
  function resize(){
   w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0);
   const box=portrait.getBoundingClientRect(),height=box.height,width=Math.min(box.width,height*.8);
   photoBox={left:box.left+(box.width-width)/2,top:box.top,width,height};
   targets=name?.target()||[];
  }
  function load(){
   if(done||leaving)return;
   try{portraitDots=samplePortrait(image);cloud=portraitDots.map(d=>({...d}));if(portraitDots.length){loadedAt=performance.now();dialog!.dataset.portraitReady='true';canvas.dataset.portraitCount=String(portraitDots.length)}}catch{image.style.opacity='1'}
   sync();
  }
  function draw(t:number){
   frame=0;const dt=Math.min(40,t-last||16);last=t;clock+=dt;
   const p=leaving?clamp((t-started)/entryTransitionMs):0,merge=smooth((p-.28)/.72),bgFade=smooth((p-.42)/.48);
   const intro=fine.matches?1-smooth((t-loadedAt)/entryGatherMs):0;
   ctx!.clearRect(0,0,w,h);ctx!.globalAlpha=1-bgFade;ctx!.fillStyle='#1d302b';ctx!.fillRect(0,0,w,h);ctx!.globalAlpha=1;
   const cx=w/2,cy=photoBox.top+photoBox.height*.47,focal=Math.min(w,h)*.68;
   for(const star of stars){
    // Preserve the outward travel while stretching it over the slower transition.
    if(fine.matches||leaving)star.z-=dt*(leaving?(.00013+p*p*.003)*(1050/entryTransitionMs):.000025);
    if(star.z<.06){if(leaving)continue;star.z+=1}
    const x=cx+star.x*focal/star.z,y=cy+star.y*focal/star.z,tail=star.z+(leaving?.04+p*.2:.01);
    ctx!.globalAlpha=1-merge;ctx!.strokeStyle=star.orange?'#ca9b70':'#71937c';ctx!.lineWidth=leaving?1.5:.75;
    ctx!.beginPath();ctx!.moveTo(cx+star.x*focal/tail,cy+star.y*focal/tail);ctx!.lineTo(x,y);ctx!.stroke();
   }
   ctx!.globalAlpha=1;
   // Keep the relaxed portrait response from the approved V3 demonstration.
   const easing=1-Math.pow(.925,dt/16.67);
   const baseSize=Math.max(1.25,photoBox.width/200*1.25);
   for(let i=0;i<portraitDots.length;i++){
    const d=portraitDots[i];let x=photoBox.left+d.bx*photoBox.width,y=photoBox.top+d.by*photoBox.height;
    let shade=d.shade,heat=0;
    if(leaving){
     const expansion=Math.sin(Math.PI*p)*.8;
     x+=(x-cx)*expansion+Math.cos(d.phase)*Math.sin(Math.PI*p)*80;
     y+=(y-cy)*expansion+Math.sin(d.phase)*Math.sin(Math.PI*p)*60;
     const target=targets[i%Math.max(1,targets.length)];
     if(target){x=lerp(x,target.x,merge);y=lerp(y,target.y,merge);shade=Math.round(lerp(d.shade,target.shade,merge))}
     else{x+=(x-cx)*p*5;y+=(y-cy)*p*5}
     d.x=x;d.y=y;
    }else{
     if(fine.matches){
      const drift=d.edge?1:.32;x+=Math.sin(clock*.0003+d.phase)*drift;y+=Math.cos(clock*.00025+d.phase)*drift;
      const dx=x-mouse.x,dy=y-mouse.y,dist=Math.hypot(dx,dy);
      if(dist<65){const force=(1-dist/65)**2*20;x+=dx/Math.max(dist,1)*force;y+=dy/Math.max(dist,1)*force;heat=1-dist/65}
      x+=Math.cos(d.phase)*intro*85;y+=Math.sin(d.phase)*intro*60;
     }
     if(!d.heat&&d.x<=1&&d.y<=1){d.x=x;d.y=y}
     d.x=lerp(d.x,x,easing);d.y=lerp(d.y,y,easing);
    }
    d.heat=lerp(d.heat,heat,easing);cloud[i].x=d.x;cloud[i].y=d.y;cloud[i].shade=shade;cloud[i].heat=d.heat;
   }
   const palette=light.map((color,i)=>color.map((v,j)=>lerp(v,dark[i][j],bgFade)) as RGB);
   paint(ctx!,cloud,lerp(baseSize,1.85,merge),palette);
   if(portraitDots.length){canvas.dataset.rendered='true'}
   if(leaving&&p>=1){finish(false);return}
   if(!document.hidden&&(fine.matches||leaving))frame=requestAnimationFrame(draw);
   canvas.dataset.running=String(!!frame);
  }
  function sync(){cancelAnimationFrame(frame);frame=0;if(document.hidden&&leaving){finish(false);return}if(!document.hidden&&!done){last=performance.now();draw(last)}else canvas.dataset.running='false'}
  dialog!.querySelector('#enter-site')!.addEventListener('click',()=>{
   if(leaving)return;leaving=true;started=performance.now();resize();dialog!.classList.add('departing');sync();
  },{signal});
  dialog!.querySelector('#skip-entrance')!.addEventListener('click',()=>finish(false),{signal});
  dialog!.addEventListener('cancel',e=>{e.preventDefault();finish(false)},{signal});
  portrait.addEventListener('pointermove',e=>{if(fine.matches)mouse={x:e.clientX,y:e.clientY}},{signal});
  portrait.addEventListener('pointerleave',()=>{mouse={x:-1000,y:-1000}},{signal});
  window.addEventListener('resize',()=>{resize();sync()},{signal,passive:true});
  document.addEventListener('visibilitychange',sync,{signal});
  window.addEventListener('preview:motion',()=>{if(reduce())finish(false)},{signal});
  fine.addEventListener('change',sync,{signal});
  window.addEventListener('pagehide',()=>finish(false),{signal,once:true});
  image.addEventListener('load',load,{signal});image.addEventListener('error',()=>{portrait.hidden=true;resize();sync()},{signal});
  document.body.classList.add('entering-site');dialog!.showModal();resize();
  if(image.complete&&image.naturalWidth)load();else sync();
 });
 return true;
}
