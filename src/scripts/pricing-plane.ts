import '../styles/pricing-plane.css';

// Matches the ordered branches in the original pricing_engine.py.
export function pricingMultiplier(bikes:number,docks:number,borrow:number,returns:number){
 const b=(bikes-borrow)/Math.max(bikes,1),d=(docks-returns)/Math.max(docks,1);
 let m=1,reason='差异未达到调整条件，保持基准价。';
 if(b<-.5&&d<-.5){m=Math.min(1.3+Math.abs(b+d)/2*.7,2);reason='车辆与空车位都明显不足，采用较高倍率。';}
 else if(b<-.3){m=Math.min(1+Math.abs(b)*.6,1.5);reason='车辆不足超过当前车辆数的 30%，采用涨价规则。';}
 else if(d<-.3){m=Math.min(1+Math.abs(d)*.4,1.3);reason='空车位不足超过当前空车位数的 30%，采用小幅涨价规则。';}
 else if(b>.5&&d>.5){m=Math.max(1-Math.min(b,d)*.25,.7);reason='车辆和空车位剩余比例均超过 50%，采用折扣规则。';}
 else if(b>.5){m=Math.max(1-b*.15,.8);reason='车辆剩余比例超过 50%，采用车辆余量折扣。';}
 return {b,d,m:Math.round(m*100)/100,reason};
}

export function mountPricingPlane(section:HTMLElement){
 const scene=section.querySelector<HTMLElement>('.flow-scene')!;
 const actions=section.querySelector<HTMLElement>('.flow-actions')!;
 section.classList.add('pricing-section');
 section.querySelector('h2')!.innerHTML='按供需差<br>计算建议价格';
 const examples=[
  {name:'车辆不足',bikes:10,docks:20,borrow:15,returns:5},
  {name:'车位不足',bikes:20,docks:10,borrow:5,returns:15},
  {name:'两项不足',bikes:10,docks:10,borrow:18,returns:18},
  {name:'供需充足',bikes:20,docks:20,borrow:5,returns:5},
  {name:'保持原价',bikes:20,docks:20,borrow:18,returns:18},
 ];
 let current=examples[0],progress=0,interacted=false;
 scene.innerHTML=`<div class="price-example-nav"><button data-price-prev aria-label="上一个供需示例">←</button><span><strong data-case-name>车辆不足</strong><small>切换示例，看看价格怎样变化</small></span><button data-price-next aria-label="下一个供需示例">→</button></div><div class="price-inputs"><div><span>可用车辆 → 借出需求</span><strong data-bike-input></strong></div><div><span>空车位 → 还入需求</span><strong data-dock-input></strong></div></div>
 <div class="price-plane" aria-label="横轴表示车辆供需差，纵轴表示空车位供需差。四区展示调整方向，实际价格由阈值与公式决定。">
 <span class="plane-top">空车位有余量 ↑</span><span class="plane-bottom">↓ 空车位不足</span>
 <div class="plane-area"><div class="plane-quadrant q-bike"><strong>涨价</strong><span>车辆不足</span></div><div class="plane-quadrant q-discount"><strong>折扣</strong><span>都有余量</span></div><div class="plane-quadrant q-both"><strong>较高涨价</strong><span>两项都不足</span></div><div class="plane-quadrant q-dock"><strong>小幅涨价</strong><span>车位不足</span></div>
 <svg class="plane-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="plane-axis-x" d="M0 50H100"/><path class="plane-axis-y" d="M50 0V100"/><path class="point-guide"/></svg>
 <span class="plane-origin">0</span><div class="price-point-position"><button class="price-point" aria-label="查看当前数据点的计算详情" aria-expanded="false"><span></span></button></div>
 </div><div class="plane-x"><span>← 车辆不足</span><span>车辆有余量 →</span></div></div>
 <div class="price-answer" aria-live="polite" aria-atomic="true"><p data-gap></p><div class="price-equation"><span>$4.49 × <b data-factor></b><small>基准价 × 规则倍率</small></span><i>→</i><span class="price-total"><strong data-price></strong><small>建议价格</small></span></div></div>
 <details class="price-point-details"><summary>查看这次计算的依据</summary><p class="price-reason"></p><p data-price-detail></p></details>`;
 actions.innerHTML='';
 section.querySelector<HTMLElement>('.figure-note')!.textContent='示例数量用于演示；价格按项目原公式计算。四区表示调整方向，实际调整还需达到阈值。';
 section.querySelector<HTMLElement>('.handoff-label')!.textContent='历史需求参考 → 预设价格规则 → 接口返回建议价';
 const point=scene.querySelector<HTMLButtonElement>('.price-point')!,details=scene.querySelector<HTMLDetailsElement>('.price-point-details')!;
 const popup=document.createElement('div');
 popup.className='price-point-popup';popup.id='price-point-popup';popup.setAttribute('role','tooltip');popup.hidden=true;
 scene.querySelector('.price-plane')!.append(popup);
 popup.append(scene.querySelector('.price-inputs')!,scene.querySelector('[data-gap]')!,scene.querySelector('.price-reason')!,scene.querySelector('[data-price-detail]')!);
 details.remove();point.setAttribute('aria-describedby',popup.id);
 scene.querySelector('.price-example-nav small')!.textContent='切换示例 · 指向圆点查看详情';
 section.querySelector<HTMLElement>('.figure-note')!.textContent='演示数据 · 按项目原规则计算';
 let pinned=false;
 const showPopup=(show:boolean)=>{popup.hidden=!show;point.setAttribute('aria-expanded',String(show));};
 const set=(selector:string,value:string)=>{scene.querySelector<HTMLElement>(selector)!.textContent=value;};
 const phase=(p:number,start:number,end:number)=>{const v=Math.min(1,Math.max(0,(p-start)/(end-start)));return v*v*(3-2*v);};
 const draw=()=>{
  const r=pricingMultiplier(current.bikes,current.docks,current.borrow,current.returns);
  const p=interacted?1:progress;
  const t=phase(p,.32,.72);
  scene.style.setProperty('--price-input',String(phase(p,0,.18)));
  scene.style.setProperty('--price-axis-x',String(phase(p,.08,.35)));
  scene.style.setProperty('--price-axis-y',String(phase(p,.14,.42)));
  scene.style.setProperty('--price-labels',String(phase(p,.23,.5)));
  scene.style.setProperty('--price-dot',String(phase(p,.32,.45)));
  scene.style.setProperty('--price-answer',String(phase(p,.6,.88)));
  scene.style.setProperty('--price-total',String(phase(p,.7,.98)));
  // These examples fit -100%..100%; point position expresses normalized gaps.
  const x=50+r.b*42*t,y=50-r.d*42*t;
  popup.style.top=y>50?'0':'auto';popup.style.bottom=y>50?'auto':'0';
  scene.querySelector<HTMLElement>('.price-point-position')!.style.transform=`translate(${x}%,${y}%)`;
  scene.querySelector('.point-guide')!.setAttribute('d',`M50 ${y}H${x}V50`);
  const active=r.m===1?'':r.b<0&&r.d<0?'q-both':r.b<0?'q-bike':r.d<0?'q-dock':'q-discount';
  scene.querySelectorAll('.plane-quadrant').forEach(e=>e.classList.toggle('is-active',t>.55&&e.classList.contains(active)));
  set('[data-case-name]',current.name);
  set('[data-bike-input]',`${current.bikes} 辆 → ${current.borrow} 辆`);set('[data-dock-input]',`${current.docks} 个 → ${current.returns} 辆`);
  const gap=(n:number,unit:string)=>n<0?`缺 ${-n} ${unit}`:`余 ${n} ${unit}`;
  set('[data-gap]',`车辆${gap(current.bikes-current.borrow,'辆')} · 空车位${gap(current.docks-current.returns,'个')}`);
  set('[data-factor]',r.m.toFixed(2)+'×');set('[data-price]','$'+(4.49*r.m).toFixed(2));set('.price-reason',r.reason);
  set('[data-price-detail]',`车辆差值：${current.bikes} − ${current.borrow} = ${current.bikes-current.borrow}，占当前车辆数 ${(r.b*100).toFixed(0)}%。空车位差值：${current.docks} − ${current.returns} = ${current.docks-current.returns}，占当前空车位数 ${(r.d*100).toFixed(0)}%。倍率按代码公式计算并保留两位小数。`);
  popup.querySelector('[data-price-detail]')!.textContent=`不足或剩余比例：车辆 ${(r.b*100).toFixed(0)}%，空车位 ${(r.d*100).toFixed(0)}%。`;
  point.setAttribute('aria-label',`车辆供需差 ${(r.b*100).toFixed(0)}%，空车位供需差 ${(r.d*100).toFixed(0)}%。点击查看计算详情`);
 };
 point.onpointerenter=e=>{if(e.pointerType==='mouse')showPopup(true);};
 point.onpointerleave=e=>{if(e.pointerType==='mouse'&&!pinned)showPopup(false);};
 point.onfocus=()=>showPopup(true);point.onblur=()=>{pinned=false;showPopup(false);};
 point.onclick=()=>{pinned=!pinned;showPopup(pinned);};
 point.onkeydown=e=>{if(e.key==='Escape'){pinned=false;showPopup(false);}};
 const change=(step:number)=>{pinned=false;showPopup(false);current=examples[(examples.indexOf(current)+step+examples.length)%examples.length];interacted=true;scene.classList.add('price-interacting');draw();};
 scene.querySelector<HTMLButtonElement>('[data-price-prev]')!.onclick=()=>change(-1);
 scene.querySelector<HTMLButtonElement>('[data-price-next]')!.onclick=()=>change(1);
 draw();return (p:number)=>{progress=p;draw();};
}
