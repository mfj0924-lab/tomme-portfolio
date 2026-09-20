import {extraCopy} from '../data/visual-flow-extra-content';
import {mountExtra} from './visual-flow-extra';
import { data } from '../data/visual-flow-content';
import samples from '../data/visual-project-samples.json';

const root=document.querySelector<HTMLElement>('#visual-project')!;
const stories=document.querySelector<HTMLElement>('#stories')!;
const base=root.dataset.base||'';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let direct=motionQuery.matches;
const formal=root.dataset.formal==='true';
let project=formal?root.dataset.initialProject!:(data[location.hash.slice(1)]?location.hash.slice(1):'citibike');
let sections:HTMLElement[]=[];
let animations:Array<(p:number)=>void>=[];
let lastProgress:number[]=[];
let path:SVGPathElement;
let routeLength=0;
let routeHeight=0;
let carrier:HTMLElement;
let queued=false;
let lastMode='';
let currentPoint={x:0,y:0};
let sectionGeometry:Array<{top:number;height:number;sceneTop:number}>=[];

const copy={
 ...extraCopy,
 citibike:[
  ['先检查每条骑行记录','读取时间，检查起终点，按编号去重。','PySpark','Raw → Bronze'],
  ['按站点和小时统计借出与还入','按站点与小时汇总骑行数据，再加入时间、业务和天气字段。','PySpark','Bronze → Silver'],
  ['分别留出训练、验证和测试数据','训练用来学习，验证用于比较，测试集用于最终评估。','randomSplit','80% / 10% / 10%'],
  ['训练模型，再评估预测误差','多棵树分别学习，合并预测后检查误差。','PySpark MLlib','随机森林'],
  ['按供需差计算建议价格','现有产品读取 CSV 的需求参考，再按规则计算价格。','Python','供需差 → 价格规则'],
  ['通过接口查询需求和价格','选择站点和时间，经过接口查询，显示建议价。','FastAPI','CSV → 规则 → 看板'],
  ['检查预测时能否取得这些字段','复核字段是否提前可得，并用时间切分做冒烟测试。','工作台 + 训练脚本','复核 → 修复 → 验证'],
 ],
 adventureworks:[
  ['合并直销与经销商销售明细','直销与经销商使用相同字段，记录上下追加。','SQL Server','UNION ALL'],
  ['检查记录和金额是否一致','核对类型、缺失、重复和金额，确认明细可以继续使用。','SQL / Power Query','检查与整理'],
  ['将日期、产品等资料关联到销售明细','日期、产品、地区、促销通过编号关联到销售明细。','Power BI','一对多关系'],
  ['按所选范围计算收入与估算毛利','筛选范围改变，公式保持一致。','DAX','求和 · 去重计数 · 比率'],
  ['从渠道差异继续查到具体商品','经销商 → 年份 → 产品，定位值得继续核查的部分。','Power BI','筛选与下钻'],
  ['用三页看板展示分析结果','三页展示结果；另按订单汇总后交给工作台检查。','Power BI / SQL','展示与复核'],
 ]
};

const tableShape=(name:string,kind='',rows=4)=>`<div class="table-shape ${kind}"><div class="table-top"><span class="table-symbol">▤</span><strong>${name}</strong></div><div class="table-columns"><i></i><i></i><i></i></div>${Array.from({length:rows},(_,i)=>`<div class="shape-row" style="--row:${i}"><i></i><i></i><i></i></div>`).join('')}</div>`;
const tree=()=>`<svg viewBox="0 0 160 120" class="tree-art" aria-hidden="true"><path d="M80 12 L42 54 M80 12 L118 54 M42 54 L18 106 M42 54 L64 106 M118 54 L96 106 M118 54 L142 106"/>${[[80,12],[42,54],[118,54],[18,106],[64,106],[96,106],[142,106]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</svg>`;
const reveal=(e:HTMLElement|null,p:number,x=0)=>{if(!e)return;e.style.opacity=String(clamp(p));e.style.transform=`translate(${x*(1-clamp(p))}px,${18*(1-clamp(p))}px)`;};
function $<T extends Element=HTMLElement>(node:ParentNode,selector:string){return node.querySelector<T>(selector)!;}

function render(){
 const p=data[project];
 root.dataset.project=project;
 const colors:Record<string,string[]>={citibike:['#087d78','#e2efea'],adventureworks:['#98613b','#f2e8db'],workbench:['#587243','#e8efdd'],'qingdao-transit':['#706093','#ece7f3'],'rnd-patent':['#977432','#f3ead5']};
 document.documentElement.style.setProperty('--accent',colors[project][0]);
 document.documentElement.style.setProperty('--soft',colors[project][1]);
 for(const [id,value]of Object.entries({'project-type':p.type,'project-title':p.title,'project-question':p.question,'project-outcome':p.outcome}))document.getElementById(id)!.textContent=value;
 document.querySelectorAll<HTMLButtonElement>('[data-project]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.project===project)));
 document.getElementById('journey')!.innerHTML=p.stages.map((s,i)=>`<button data-stage="${i}"><span>0${i+1}</span>${s.name}</button>`).join('');
 const text=copy[project as keyof typeof copy];
 stories.innerHTML=`<svg class="flow-route" aria-hidden="true"><path class="route-base"/><path class="route-ink"/><g class="route-connectors"></g><g class="route-dots"></g></svg><div class="flow-carrier" aria-hidden="true"><div class="carrier-glyph">${'<i></i>'.repeat(9)}</div><span></span></div>${text.map(([title,summary,tool,method],i)=>`<section class="flow-section ${i%2?'reverse':''}" id="flow-${i}" aria-labelledby="flow-title-${i}"><div class="flow-copy"><span class="chapter-number">0${i+1}</span><p class="chapter-name">${p.stages[i].name}</p><h2 id="flow-title-${i}">${title}</h2><p class="chapter-summary">${summary}</p><div class="method-tags"><span>${tool}</span><span>${method}</span></div><details class="flow-details"><summary>方法与依据</summary><p>${p.stages[i].tools}</p><p>${p.stages[i].limit}</p><a href="${base}/projects/${project}/details/">完整项目介绍 ↗</a></details></div><div class="flow-visual"><div class="flow-scene"></div><div class="flow-actions"></div><p class="figure-note"></p></div><div class="handoff-label"></div></section>`).join('')}<div class="flow-finish"><span>●</span><h2>${({citibike:'离线实验、产品演示与复核，分别有据可查。',adventureworks:'从销售数据，到可以继续追问的经营结果。',workbench:'每项结果，保留对应的依据与限制。','qingdao-transit':'看清线路的位置，也看清线路之间的关系。','rnd-patent':'资料整理完成，后续研究有了共同的数据基础。'} as Record<string,string>)[project]}</h2><a href="${base}/projects/${project}/details/">查看完整介绍与项目材料 ↗</a></div>`;
 sections=Array.from(stories.querySelectorAll('.flow-section'));
 animations=sections.map((section,i)=>project==='citibike'?mountBike(section,i):project==='adventureworks'?mountAdventure(section,i):mountExtra(section,i,project,{base,layout,tableShape,reveal,smooth}));
 carrier=$<HTMLElement>(stories,'.flow-carrier');path=$<SVGPathElement>(stories,'.route-ink');
 lastMode='';lastProgress=[];
 sections.forEach(s=>s.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',layout)));
 document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.onclick=()=>sections[Number(b.dataset.stage)].scrollIntoView({behavior:direct?'instant':'smooth',block:'start'}));
 if(formal&&['citibike','adventureworks'].includes(project))stories.querySelector('.flow-finish')?.classList.add('flow-finish-quiet');
 layout();
}

function mountBike(section:HTMLElement,i:number){
 const scene=$<HTMLElement>(section,'.flow-scene'),actions=$<HTMLElement>(section,'.flow-actions'),note=$<HTMLElement>(section,'.figure-note'),handoff=$<HTMLElement>(section,'.handoff-label');
 const raw=samples.citibike.raw;const focus=raw[0];
 if(i===0){
  scene.innerHTML=`<div class="ride-card"><span>一条真实的骑行记录</span><div class="ride-stations"><div><small>借出站点</small><strong>西42街与第八大道</strong></div><i>↓</i><div><small>还入站点</small><strong>东58街与麦迪逊大道</strong></div></div><p>05:36 借出 → 05:42 还入</p></div><div class="clean-checks"><span>时间可读取</span><span>站点齐全</span><span>按编号去重</span></div><div class="clean-result"><b>✓</b><span>这条记录保留下来</span></div>`;
  actions.innerHTML='<button data-record>查看原始记录</button><div class="inline-record" hidden></div>';
  actions.querySelector('button')!.onclick=()=>{const target=$<HTMLElement>(actions,'.inline-record');target.hidden=!target.hidden;target.innerHTML=`<p>骑行编号：<code>${focus.ride_id}</code></p><p>借出站点：${focus.start_station_name}（站点编号 ${focus.start_station_id}）</p><p>还入站点：${focus.end_station_name}（站点编号 ${focus.end_station_id}）</p><p>${focus.started_at} → ${focus.ended_at}</p><p>electric_bike：电动车 · member：会员</p>`;layout();};
  note.textContent='使用真实记录，不额外制造缺失或重复。';handoff.textContent='同一条骑行记录，继续进入汇总';
  return p=>{section.style.setProperty('--clean',String(p));scene.querySelectorAll<HTMLElement>('.clean-checks span').forEach((e,j)=>reveal(e,smooth((p-.08-j*.13)*4)));reveal($<HTMLElement>(scene,'.clean-result'),smooth((p-.5)*3));};
 }
 if(i===1){
  scene.innerHTML=`<div class="ride-cloud">${raw.map((r,j)=>`<span class="ride-bit ${j===0?'selected':''}" style="--n:${j}">${j===0?'这次骑行':r.start_station_id==='6602.05'&&r.started_at.startsWith('2026-01-02 05:')?'借出':'还入'}</span>`).join('')}</div><div class="hour-record"><small>Silver · 站点小时数据</small><strong>西42街站 <em>05 点</em></strong><div class="hour-count"><span><b data-out>0</b> 借出</span><span><b data-in>0</b> 还入</span></div></div><div class="field-add"><span>＋ 时间</span><span>＋ 业务</span><span>＋ 天气</span></div>`;
  note.textContent='2026-01-02，12 条真实骑行对应 11 次借出、1 次还入。';
  actions.innerHTML='<button data-fields>展开字段与来源</button><div class="inline-record" hidden></div>';
  actions.querySelector('button')!.onclick=()=>{const e=$<HTMLElement>(actions,'.inline-record');e.hidden=!e.hidden;e.innerHTML='<p>时间：1 月 2 日 05 点。业务：电动车比例 90.91%。天气：气温 −4.4°C。</p><p>来源：原始 CSV 与 Silver Parquet；按原管道日期字段显示。Parquet 直接读取时间相差 8 小时。</p><p>Gold 做过标准化与 PCA，最终模型实际读取 Silver。同小时业务字段风险见最后的复核。</p>';layout();};
  handoff.textContent='多条骑行 → 一条站点小时记录';
  return p=>{scene.querySelectorAll<HTMLElement>('.ride-bit').forEach((e,j)=>{const t=smooth((p-j*.015)*2.4);e.style.transform=`translate(${(5.5-j)*3*t}px,${t*58}px) scale(${1-t*.65})`;e.style.opacity=String(1-t*.88);});reveal($<HTMLElement>(scene,'.hour-record'),smooth(p*3));$<HTMLElement>(scene,'[data-out]').textContent=String(Math.round(11*smooth(p*2)));$<HTMLElement>(scene,'[data-in]').textContent=p>.3?'1':'0';scene.querySelectorAll<HTMLElement>('.field-add span').forEach((e,j)=>reveal(e,smooth((p-.48-j*.13)*6),20));};
 }
 if(i===2){
  scene.innerHTML=`<div class="split-source"><span>站点小时记录</span><strong>西42街站 · 借出 11 / 还入 1</strong></div><div class="split-boxes">${[['训练','80%'],['验证','10%'],['测试','10%']].map(([a,b])=>`<div><strong>${a}</strong><small>${b}</small><div class="slot-area"></div></div>`).join('')}</div><div class="moving-rows">${Array.from({length:30},(_,j)=>`<i data-j="${j}" ${j===0?'class="followed"':''}></i>`).join('')}</div>`;
  actions.innerHTML='<button data-split="random" aria-pressed="true">随机分组</button><button data-split="time" aria-pressed="false">时间分组对照</button>';
  let time=false,current=0;
  const update=(p:number)=>{current=p;const boxes=Array.from(scene.querySelectorAll<HTMLElement>('.split-boxes>div'));const parent=scene.getBoundingClientRect();scene.querySelectorAll<HTMLElement>('.moving-rows i').forEach((e,j)=>{const n=time?j:j*7%30;const group=n<24?0:n<27?1:2;const rank=group===0?n:n-(group===1?24:27);const r=boxes[group].getBoundingClientRect();const t=smooth((p-j*.009)*1.65);const startX=parent.width/2+(j%6-3)*13;const targetX=r.left-parent.left+12+(rank%4)*15;const targetY=r.top-parent.top+60+Math.floor(rank/4)*13;e.style.transform=`translate(${startX+(targetX-startX)*t}px,${60+(targetY-60)*t}px)`;e.style.background=['var(--accent)','#d8ad52','#d68465'][group];});};
  actions.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{time=b.dataset.split==='time';actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));note.textContent=time?'对照：较早的数据训练，后续数据验证和测试；实际按不同小时切分。':'色块数量和这条记录的分组位置为原理示意，原版没有保存单条分组日志。';update(current);});
  note.textContent='真实记录继续进入训练输入；色块数量与具体分组位置为示意。';handoff.textContent='训练组继续参与学习；验证和测试留作评估';return update;
 }
 if(i===3){
  scene.innerHTML=`<div class="learning-input">训练记录 <span>↓</span></div><div class="forest">${tree()+tree()+tree()}</div><div class="combine-predictions"><span>多棵树的预测取平均</span><i>↓</i></div><div class="score"><small>原版借出模型 · 测试集</small><strong>R² <b data-score>0.644</b></strong><span data-rmse>RMSE 3.04</span></div><div class="model-stop"><span>保存离线模型</span><b>●</b><small>尚未接入 API</small></div>`;
  actions.innerHTML='<button data-model="0" aria-pressed="true">借出量</button><button data-model="1" aria-pressed="false">还入量</button>';
  actions.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{const m=samples.citibike.metrics[Number(b.dataset.model)];$<HTMLElement>(scene,'[data-score]').textContent=m.test_r2.toFixed(3);$<HTMLElement>(scene,'[data-rmse]').textContent='RMSE '+m.test_rmse.toFixed(2);$<HTMLElement>(scene,'.score small').textContent=`原版${b.dataset.model==='0'?'借出':'还入'}模型 · 测试集`;actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  note.textContent='树的分支为学习原理示意，指标取自训练记录。R² 不是准确率。';handoff.innerHTML='<strong>离线模型保存在这里。</strong><span>下方继续介绍已有 CSV 驱动的产品演示。</span>';
  return p=>{scene.querySelectorAll<HTMLElement>('.tree-art').forEach((e,j)=>{reveal(e,smooth((p-.05-j*.1)*4));e.style.setProperty('--draw',String(smooth((p-.1-j*.08)*3)));});reveal($<HTMLElement>(scene,'.combine-predictions'),smooth((p-.35)*4));reveal($<HTMLElement>(scene,'.score'),smooth((p-.52)*4));reveal($<HTMLElement>(scene,'.model-stop'),smooth((p-.78)*5));};
 }
 if(i===4){
  scene.innerHTML='<div class="csv-entry"><small>实际产品输入 · pricing_analysis.csv</small><strong>站点 6535.04 · 17 点</strong><span>借出需求 19 · 还入需求 11</span></div><div class="vertical-calculation"><div><span>可用车辆</span><b data-available>28</b></div><i>↓ 按供需差计算</i><div><span>规则倍率</span><b data-multiplier>1.00</b></div><i>↓ × $4.49</i><div class="final-price"><span>建议价</span><b data-price>$4.49</b></div></div>';
  actions.innerHTML='<label for="flow-supply">调整可用车辆</label><input id="flow-supply" type="range" min="5" max="40" value="28"/><button data-reset>恢复原始值</button>';
  const input=$<HTMLInputElement>(actions,'input');const calc=()=>{const n=Number(input.value),br=(n-19)/Math.max(n,1),dr=18/29;let m=1;if(br<-.3)m=Math.min(1+Math.abs(br)*.6,1.5);else if(br>.5&&dr>.5)m=Math.max(1-Math.min(br,dr)*.25,.7);m=Math.round(m*100)/100;$<HTMLElement>(scene,'[data-available]').textContent=String(n);$<HTMLElement>(scene,'[data-multiplier]').textContent=m.toFixed(2);$<HTMLElement>(scene,'[data-price]').textContent='$'+(4.49*m).toFixed(2);};input.oninput=calc;actions.querySelector('button')!.onclick=()=>{input.value='28';calc();};
  note.textContent='原始 CSV 建议价为 $4.49；滑块仅改变可用车辆，空桩固定为 29。';handoff.textContent='规则计算的结果，继续交给接口与页面';
  return p=>scene.querySelectorAll<HTMLElement>('.vertical-calculation>div').forEach((e,j)=>reveal(e,smooth((p-j*.23)*3),10));
 }
 if(i===5){
  scene.innerHTML=`<div class="api-stack"><div class="api-request"><small>页面发起请求</small><strong>6535.04 · 2026-01-20 17 点</strong></div><i>↓</i><div class="api-engine">读取 CSV <span>→</span> 计算规则</div><i>↓</i><div class="mini-dashboard"><div class="window-bar"><i></i><i></i><i></i><span>站点价格建议</span></div><small>6535.04 · 17 点</small><strong>$4.49</strong><span>示例响应</span><div class="mini-chart">${[30,48,67,55,82,63,38,46].map(h=>`<i style="height:${h}%"></i>`).join('')}</div></div></div>`;
  actions.innerHTML=`<a href="${base}/demos/citibike/dashboard.html" target="_blank">打开现有看板 ↗</a>`;note.textContent='按真实代码路径展示。此页面不调用后端，离线 Spark 模型尚未接入。';handoff.textContent='页面可以展示结果；随后复核数据与模型的限制';
  return p=>scene.querySelectorAll<HTMLElement>('.api-stack>div').forEach((e,j)=>reveal(e,smooth((p-j*.25)*3)));
 }
 scene.innerHTML='<div class="risk-chips"><span>电动车比例</span><span>会员比例</span><span>平均骑行时长</span></div><p class="risk-message">目标小时结束后，统计才完整</p><div class="review-bars">'+[['旧字段 · 随机',.633],['去三字段 · 随机',.121],['去三字段 · 时间',.095]].map(([name,value])=>`<div><span>${name}</span><i style="--bar:${Number(value)/.633}"></i><b>${Number(value).toFixed(3)}</b></div>`).join('')+'</div>';
 actions.innerHTML='<button data-risk>为什么移除这三个字段？</button><p class="inline-record" hidden>预测 08—09 点时，这三个字段统计的是 08—09 点实际发生的骑行。08 点无法提前拿到完整统计；平均时长还需要等待骑行结束。</p>';
 actions.querySelector('button')!.onclick=()=>{const e=$<HTMLElement>(actions,'.inline-record');e.hidden=!e.hidden;layout();};note.textContent='2.4 万行冒烟测试；第三组测试样本变化，成绩差异不能全部归因于时间切分。';handoff.textContent='保留原版结果，同时说明修复范围和未解决限制';
 return p=>{scene.querySelectorAll<HTMLElement>('.risk-chips span').forEach((e,j)=>{const t=smooth((p-j*.13)*3);e.style.opacity=String(1-t*.55);e.style.transform=`translateX(${t*20}px)`;e.style.textDecoration=t>.6?'line-through':'none';});scene.querySelectorAll<HTMLElement>('.review-bars i').forEach((e,j)=>e.style.transform=`scaleX(${smooth((p-.3-j*.13)*3)})`);};
}

function mountAdventure(section:HTMLElement,i:number){
 const scene=$<HTMLElement>(section,'.flow-scene'),actions=$<HTMLElement>(section,'.flow-actions'),note=$<HTMLElement>(section,'.figure-note'),handoff=$<HTMLElement>(section,'.handoff-label');
 if(i===0){
  scene.innerHTML=`<div class="source-tables">${tableShape('网络直销','internet',3)}${tableShape('经销商','reseller',3)}</div><div class="merge-arrows"><span>╲</span><b>UNION ALL</b><span>╱</span></div><div class="merged-table">${tableShape('统一销售明细','combined',6)}<span>121,253 条商品明细</span></div>`;
  note.textContent='表的结构为示意；两种渠道上下追加，保留渠道字段。';handoff.textContent='两张表 → 一张销售明细表';
  return p=>{scene.querySelectorAll<HTMLElement>('.source-tables .table-shape').forEach((e,j)=>{const t=smooth(p);e.style.transform=`translate(${j?-t*16:t*16}px,${t*18}px)`;});scene.querySelectorAll<HTMLElement>('.combined .shape-row').forEach((e,j)=>reveal(e,smooth((p-.2-j*.075)*3),j<3?-30:30));reveal($<HTMLElement>(scene,'.merged-table'),smooth((p-.1)*3));};
 }
 if(i===1){
  scene.innerHTML=`<div class="inspected-table">${tableShape('销售明细','combined',5)}<div class="scan-line"></div></div><div class="quality-checklist"><span>检查字段类型</span><span>检查缺失与重复</span><span>核对行数与金额</span></div>`;
  actions.innerHTML='<button data-quality>查看检查原则</button><div class="inline-record" hidden><p>检查明细编号是否唯一；同一订单可以有多条商品记录，不能按订单号直接删重复。</p><p>SQL 核对行数、金额和关联；Power Query 检查类型、空值与错误。</p></div>';actions.querySelector('button')!.onclick=()=>{const e=$<HTMLElement>(actions,'.inline-record');e.hidden=!e.hidden;layout();};
  note.textContent='动画展示检查步骤，不制造项目不存在的异常。';handoff.textContent='经过检查的销售明细，继续建立关联';
  return p=>{$<HTMLElement>(scene,'.scan-line').style.top=`${15+smooth(p)*75}%`;scene.querySelectorAll<HTMLElement>('.quality-checklist span').forEach((e,j)=>reveal(e,smooth((p-.1-j*.2)*3)));};
 }
 if(i===2){
  scene.innerHTML=`<div class="relation-art"><div class="dimension-row"><button data-dimension="0">日期</button><button data-dimension="1">产品</button><button data-dimension="2">地区</button><button data-dimension="3">促销</button></div><svg viewBox="0 0 400 90" aria-hidden="true">${[50,150,250,350].map(x=>`<path d="M${x} 0 C${x} 55 200 35 200 90"/>`).join('')}</svg>${tableShape('销售明细','combined',3)}<div class="relation-key">ProductKey → ProductKey</div></div>`;
  const keys=['OrderDateKey → DateKey','ProductKey → ProductKey','SalesTerritoryKey → SalesTerritoryKey','PromotionKey → PromotionKey'];scene.querySelectorAll<HTMLButtonElement>('[data-dimension]').forEach(b=>b.onclick=()=>{$<HTMLElement>(scene,'.relation-key').textContent=keys[Number(b.dataset.dimension)];scene.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  scene.querySelectorAll('button')[1].setAttribute('aria-pressed','true');note.textContent='点击说明表，查看关联键。说明表的键应唯一，关系为一对多。';handoff.textContent='同一张明细表，现在可以按日期、产品与地区查看';
  return p=>{scene.querySelectorAll<SVGPathElement>('path').forEach((e,j)=>{e.style.strokeDashoffset=String(180*(1-smooth((p-j*.12)*2.5)));});};
 }
 if(i===3){
  scene.innerHTML=`<div class="metric-source">${tableShape('销售明细','combined',2)}</div><div class="metric-fan">↓</div><div class="metric-grid">${['销售收入','产品成本','估算毛利','估算毛利率','订单数','销售件数'].map((x,j)=>`<button data-metric="${j}">${x}</button>`).join('')}</div><p class="metric-formula">估算毛利 = 销售收入 − 样例产品成本</p>`;
  const formulas=['销售收入 = 所选明细的 SalesAmount 合计','产品成本 = 所选明细的 TotalProductCost 合计','估算毛利 = 销售收入 − 样例产品成本','估算毛利率 = 总估算毛利 ÷ 总销售收入','订单数 = 按渠道和订单编号去重计数','销售件数 = OrderQuantity 合计'];scene.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{$<HTMLElement>(scene,'.metric-formula').textContent=formulas[Number(b.dataset.metric)];scene.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  note.textContent='点击指标看公式。估算毛利没有扣除全部经营费用。';handoff.textContent='有了指标，开始比较渠道表现';
  return p=>scene.querySelectorAll<HTMLElement>('.metric-grid button').forEach((e,j)=>reveal(e,smooth((p-j*.075)*2.5),j%2?10:-10));
 }
 if(i===4){
  scene.innerHTML='<div class="drill-summary"><div><span>经销商收入占比</span><i style="--size:.7326"></i><b>73.26%</b></div><div><span>经销商毛利占比</span><i style="--size:.0375"></i><b>3.75%</b></div></div><div class="drill-stair"><button data-depth="0">全部渠道 <span>↓</span></button><button data-depth="1">经销商 <span>↓</span></button><button data-depth="2">2013 年 <span>↓</span></button><button data-depth="3">自行车 <strong>出现负估算毛利</strong></button></div>';
  let chosen:number|null=null;let latest=0;const update=(p:number)=>{latest=p;scene.querySelectorAll<HTMLElement>('.drill-summary i').forEach(e=>e.style.transform=`scaleX(${smooth(p*3)})`);scene.querySelectorAll<HTMLElement>('.drill-stair button').forEach((e,j)=>{const t=chosen===null?smooth((p-.2-j*.14)*5):j<=chosen?1:.18;reveal(e,t,25);});};
  scene.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{chosen=Number(b.dataset.depth);note.textContent=['先比较整体收入与估算毛利。','经销商收入占比高，但毛利贡献明显偏低。','继续聚焦 2013 年；该渠道当年数据未覆盖完整年度。','自行车出现负估算毛利，值得核查售价、折扣和成本，不能直接确定原因。'][chosen];update(latest);});
  actions.innerHTML='<button data-auto>随滚动逐层下钻</button>';actions.querySelector('button')!.onclick=()=>{chosen=null;update(latest);};note.textContent='实际项目结果。点击任一层查看含义，也可跟随滚动逐层深入。';handoff.textContent='从渠道差异，定位到年份与产品';return update;
 }
 scene.innerHTML=`<div class="report-stack">${[['overview','经营总览'],['profitability','盈利诊断'],['territory','区域分析']].map(([f,t])=>`<a href="${base}/assets/adventureworks/${f}.png" target="_blank"><img loading="lazy" src="${base}/assets/adventureworks/${f}.png" alt="${t}真实看板"/><span>${t} ↗</span></a>`).join('')}</div><div class="order-export"><span>121,253 条明细</span><i>↓ 按订单汇总</i><strong>31,455 张订单</strong><small>交给工作台检查</small></div>`;
  note.textContent='点击查看真实看板。工作台的订单检查不能替代整份 Power BI 文件审计。';handoff.textContent='三页经营看板 + 订单级复核';
  const example=samples.adventureworks.sales[0];actions.innerHTML=`<details class="sample-disclosure"><summary>需要时再看真实明细示例</summary><p>${esc(example.sales_line_id)} · 收入 ${esc(example.revenue)}</p></details>`;
  return p=>{scene.querySelectorAll<HTMLElement>('.report-stack a').forEach((e,j)=>reveal(e,smooth((p-j*.16)*3),j%2?20:-20));reveal($<HTMLElement>(scene,'.order-export'),smooth((p-.55)*3));};
}

function layout(){
 if(!sections.length)return;
 const w=stories.clientWidth;
 const mobile=innerWidth<=760;
 const finish=$<HTMLElement>(stories,'.flow-finish');
 const height=finish.offsetTop+finish.offsetHeight;
 routeHeight=height;
 const svg=$<SVGSVGElement>(stories,'.flow-route');svg.setAttribute('viewBox',`0 0 ${w} ${height}`);svg.style.height=height+'px';
 const storiesTop=stories.getBoundingClientRect().top;
 sectionGeometry=sections.map(s=>({top:s.offsetTop,height:s.offsetHeight,sceneTop:$<HTMLElement>(s,'.flow-scene').getBoundingClientRect().top-storiesTop}));
 const center=mobile?23:w/2;
 const amplitude=mobile?9:Math.min(67,w*.06);
 const points=[{x:center,y:0},...sectionGeometry.flatMap((r,i)=>[{x:center+(i%2?-amplitude:amplitude),y:r.top+r.height*.22},{x:center+(i%2?amplitude:-amplitude),y:r.top+r.height*.76}]),{x:center,y:height-140}];
 let d=`M${points[0].x},${points[0].y}`;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dy=b.y-a.y;d+=` C${a.x},${a.y+dy*.48} ${b.x},${b.y-dy*.48} ${b.x},${b.y}`;}
 path.setAttribute('d',d);$<SVGPathElement>(stories,'.route-base').setAttribute('d',d);routeLength=path.getTotalLength();path.style.strokeDasharray=String(routeLength);
 const connectors=$<SVGGElement>(stories,'.route-connectors');
 connectors.innerHTML=mobile?'':sections.map((s,i)=>{const visual=$<HTMLElement>(s,'.flow-visual');const y=s.offsetTop+visual.offsetTop+55;const x=i%2?visual.offsetLeft+visual.offsetWidth+12:visual.offsetLeft-12;return `<path d="M${center} ${y-55} C${center} ${y} ${x} ${y-35} ${x} ${y}"/><circle cx="${x}" cy="${y}" r="3"/>`;}).join('');
 $<SVGGElement>(stories,'.route-dots').innerHTML=sectionGeometry.map((r,i)=>`<circle cx="${center+(i%2?-amplitude:amplitude)}" cy="${r.top+r.height*.22}" r="5"/>`).join('');
 lastProgress=[];update();
}
function pointAtY(y:number){let lo=0,hi=routeLength;for(let j=0;j<14;j++){const mid=(lo+hi)/2;if(path.getPointAtLength(mid).y<y)lo=mid;else hi=mid;}const length=(lo+hi)/2;return {point:path.getPointAtLength(length),length};}
const shapes:Record<string,number[][]>={
 raw:[[-10,-9],[0,-7],[10,-10],[-10,0],[0,3],[10,0],[-10,10],[0,8],[10,10]],
 clean:[[-9,-8],[0,-8],[9,-8],[-9,0],[0,0],[9,0],[-9,8],[0,8],[9,8]],
 hour:[[-9,-5],[0,-5],[9,-5],[-9,1],[0,1],[9,1],[-9,7],[0,7],[9,7]],
 split:[[-12,-10],[-12,-3],[-12,4],[-12,11],[0,-5],[0,2],[0,9],[12,0],[12,7]],
 model:[[0,-13],[-9,-4],[9,-4],[-14,6],[-5,6],[5,6],[14,6],[-9,13],[9,13]],
 csv:[[-9,-8],[0,-8],[9,-8],[-9,0],[0,0],[9,0],[-9,8],[0,8],[9,8]],
 price:[[-10,9],[-10,3],[-10,-3],[0,9],[0,3],[10,9],[10,3],[10,-3],[10,-9]],
 checked:[[-13,0],[-10,4],[-7,8],[-4,12],[0,8],[4,4],[8,0],[12,-4],[15,-8]],
 tables:[[-13,-10],[-13,-2],[-13,6],[-6,-10],[-6,-2],[-6,6],[9,-5],[9,3],[9,11]],
 table:[[-9,-8],[0,-8],[9,-8],[-9,0],[0,0],[9,0],[-9,8],[0,8],[9,8]],
 linked:[[0,0],[-13,-12],[0,-12],[13,-12],[-13,0],[13,0],[-13,12],[0,12],[13,12]],
 metrics:[[-10,-9],[0,-9],[10,-9],[-10,0],[0,0],[10,0],[-10,9],[0,9],[10,9]],
 focus:[[-9,-9],[0,-9],[9,-9],[-9,0],[0,0],[9,0],[-9,9],[0,9],[9,9]],
 report:[[-10,9],[-10,3],[-10,-3],[0,9],[0,3],[10,9],[10,3],[10,-3],[10,-9]],
};
function carrierMode(index:number,p:number){
 const bike=[['raw','骑行记录'],['clean','清洗后的记录'],['hour','站点小时'],['split','训练数据'],['model','离线模型'],['price','价格结果'],['report','页面结果'],['checked','复核记录']];
 const aw=[['tables','两张销售表'],['table','销售明细'],['clean','检查后的明细'],['linked','关联后的明细'],['metrics','经营指标'],['focus','定位差异'],['report','经营看板']];
 const extras:Record<string,string[][]>={workbench:[['tables','数据与合同'],['table','任务输入'],['linked','运行规则'],['checked','检查记录'],['metrics','计算结果'],['checked','结论依据'],['report','任务报告']],'qingdao-transit':[['raw','线路编号'],['csv','接口资料'],['tables','整理后的表'],['linked','线路连接'],['focus','网络结果'],['report','地图与网络']],'rnd-patent':[['tables','年度文件'],['raw','读入的表'],['clean','统一表头'],['linked','公司与年份'],['table','合并结果'],['checked','核验与导出']]};
 const modes=project==='citibike'?bike:project==='adventureworks'?aw:extras[project];
 const entering=project==='citibike'&&index===4?['csv','CSV 参考']:modes[index];
 const leaving=modes[index+1];
 const t=smooth((p-.24)/.48);
 const [mode,label]=t<.5?entering:leaving;
 if(lastMode!==mode){carrier.dataset.mode=mode;$<HTMLElement>(carrier,'span').textContent=label;lastMode=mode;}
 const a=shapes[entering[0]],b=shapes[leaving[0]];
 const scale=innerWidth<=760?.67:innerWidth<=950?.82:1;
 carrier.querySelectorAll<HTMLElement>('.carrier-glyph i').forEach((e,j)=>{const x=(a[j][0]+(b[j][0]-a[j][0])*t)*scale,y=(a[j][1]+(b[j][1]-a[j][1])*t)*scale;e.style.transform=`translate(${x}px,${y}px)`;});
 // The model is not connected to the API. Hide the carried artifact across that boundary.
 const branch=project==='citibike'&&index===4;
 carrier.style.opacity=direct?'0':branch&&p<.22?String(clamp(p/.22)): '1';
}
function update(){
 if(!routeLength)return;
 const top=stories.getBoundingClientRect().top;
 const target=clamp((innerHeight*.53-top)/(routeHeight-150))*(routeHeight-150);
 const found=pointAtY(target);currentPoint=found.point;
 path.style.strokeDashoffset=String(direct?0:routeLength-found.length);
 carrier.style.transform=`translate(${currentPoint.x}px,${currentPoint.y}px) translate(-50%,-50%)`;
 let active=0;
 // Begin when the illustration enters the lower-middle viewport. A short,
 // independent scroll distance controls playback speed rather than starting early.
 const animationTravel=Math.max(160,Math.min(260,innerHeight*.27));
 sectionGeometry.forEach((r,i)=>{const p=direct?1:clamp((innerHeight*.72-(top+r.sceneTop))/animationTravel);if(p!==lastProgress[i]){animations[i](p);sections[i].style.setProperty('--p',String(p));lastProgress[i]=p;}if(target>=r.top)active=i;});
 const r=sectionGeometry[active];carrierMode(active,clamp((target-r.top)/r.height));
 document.querySelectorAll('[data-stage]').forEach((b,i)=>{if(i===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 stories.classList.toggle('direct-view',direct);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update();});}
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',layout);
document.getElementById('motion-toggle')!.addEventListener('click',()=>{direct=!direct;const b=document.getElementById('motion-toggle')!;b.setAttribute('aria-pressed',String(direct));b.textContent=direct?'恢复随滚动变化':'直接看完整结果';lastProgress=[];update();});
motionQuery.addEventListener('change',e=>{direct=e.matches;lastProgress=[];update();});
document.querySelectorAll<HTMLButtonElement>('[data-project]').forEach(b=>b.onclick=()=>{if(formal){location.href=`${base}/projects/${b.dataset.project}/`;return;}project=b.dataset.project!;history.replaceState(null,'',`#${project}`);render();window.scrollTo({top:0,behavior:'instant'});});
addEventListener('hashchange',()=>{const name=location.hash.slice(1);if(!formal&&data[name]&&name!==project){project=name;render();}});
render();
