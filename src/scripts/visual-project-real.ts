import samples from '../data/visual-project-samples.json';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const money=(n:number)=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const reveal=(e:HTMLElement,p:number,x=0)=>{e.style.opacity=String(p);e.style.transform=`translate(${x*(1-p)}px,${20*(1-p)}px)`;};
const raw=samples.citibike.raw;
const focus=raw.find(r=>r.ride_id==='85744AF35D7F2DF5')!;
const departure=(r:typeof focus)=>r.start_station_id==='6602.05'&&r.started_at.startsWith('2026-01-02 05:');
function context(section:HTMLElement,tool:string,method:string,source:string){
 const scene=section.querySelector<HTMLElement>('[data-ui="scene"]')!;
 const controls=section.querySelector<HTMLElement>('[data-ui="scene-controls"]')!;
 const caption=section.querySelector<HTMLElement>('[data-ui="scene-caption"]')!;
 section.querySelector('.method-strip')?.remove();
 scene.insertAdjacentHTML('beforebegin',`<div class="method-strip"><span>${tool}</span><span>${method}</span><span class="source-tag">真实记录 · 动画演示</span></div>`);
 section.querySelector('.story-details')!.insertAdjacentHTML('beforeend',`<p class="source-detail">数据来源：${esc(source)}</p>`);
 return {scene,controls,caption};
}
const record=(label:string,main:string,sub:string)=>`<div class="tracked-record"><small>${label}</small><strong>${main}</strong><span>${sub}</span></div>`;
export function trainingScene(section:HTMLElement){
 const {scene,controls,caption}=context(section,'PySpark MLlib','随机森林 · 学习与评估',samples.citibike.source.metrics);
 const m=samples.citibike.metrics[0];
 controls.innerHTML='<button data-model="bike">借出量模型</button><button data-model="dock" class="secondary">还入量模型</button>';
 scene.innerHTML=`<div class="training-story"><div class="training-input">${record('训练集中的站点小时记录','字段 → 借出量','6602.05 · 11 次借出')}<span class="small-label">这条记录的分组位置为示意</span></div><div class="forest">${[0,1,2].map(i=>`<svg viewBox="0 0 180 135" aria-label="决策树学习过程示意"><path d="M90 16 L46 65 M90 16 L134 65 M46 65 L20 118 M46 65 L72 118 M134 65 L112 118 M134 65 L160 118"/><g>${[[90,16],[46,65],[134,65],[20,118],[72,118],[112,118],[160,118]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g><text x="90" y="92" text-anchor="middle">树 ${i+1}</text></svg>`).join('')}</div><div class="training-phases"><span>① 学习训练记录</span><span>② 合并多棵树的预测</span><span>③ 在未参与学习的数据上评估</span></div><div class="score-panel"><div><small>验证集 R²</small><strong data-score="val">${m.val_r2.toFixed(3)}</strong></div><div><small>测试集 R²</small><strong data-score="test">${m.test_r2.toFixed(3)}</strong></div><div><small>测试集 RMSE</small><strong data-score="rmse">${m.test_rmse.toFixed(2)}</strong></div></div><p class="training-boundary">原版训练结果 → 保存离线模型。API 尚未调用这个模型。</p></div>`;
 controls.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{const m=samples.citibike.metrics[b.dataset.model==='bike'?0:1];scene.querySelector('.training-input .tracked-record strong')!.textContent=b.dataset.model==='bike'?'字段 → 借出量':'字段 → 还入量';scene.querySelector('.training-input .tracked-record span')!.textContent=b.dataset.model==='bike'?'6602.05 · 11 次借出':'6602.05 · 1 次还入';scene.querySelector('[data-score="val"]')!.textContent=m.val_r2.toFixed(3);scene.querySelector('[data-score="test"]')!.textContent=m.test_r2.toFixed(3);scene.querySelector('[data-score="rmse"]')!.textContent=m.test_rmse.toFixed(2);controls.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
 caption.textContent='树的数量与分支仅作原理示意；指标读取原版训练记录。R² 不是准确率，RMSE 表示预测误差的量级。';
 return(p:number)=>{reveal(scene.querySelector('.training-input')!,clamp(p*5));scene.querySelectorAll<HTMLElement>('.forest svg').forEach((e,i)=>{reveal(e,clamp((p-.13-i*.1)*5),-30);e.style.setProperty('--draw',String(clamp((p-.2-i*.08)*4)));});scene.querySelectorAll<HTMLElement>('.training-phases span').forEach((e,i)=>reveal(e,clamp((p-.2-i*.18)*5)));reveal(scene.querySelector('.score-panel')!,clamp((p-.65)*4));reveal(scene.querySelector('.training-boundary')!,clamp((p-.82)*6));};
}
export function enhanceRealScene(section:HTMLElement,project:string,step:number,base:string):((p:number)=>void)|undefined{
 if(project==='citibike'&&step===0){
  const {scene,controls,caption}=context(section,'PySpark → Parquet','转换时间 · 检查站点 · 按骑行编号去重',samples.citibike.source.raw+' → '+samples.citibike.source.bronze);
  controls.innerHTML='<button data-expand>查看这条记录的原始字段</button>';
  scene.innerHTML=`<div class="real-clean"><div class="record-route">${record('Raw · 一行就是一次骑行',focus.ride_id,focus.rideable_type+' · '+focus.member_casual)}<div class="route-arrow">↓</div><div class="clean-gates"><span>时间可读取 ✓</span><span>起终点齐全 ✓</span><span>编号检查 ✓</span></div><div class="route-arrow">↓</div><div class="clean-output">${record('Bronze · 保留的骑行记录',focus.ride_id,'6602.05 → 6839.04 · 05:36 → 05:42')}</div></div><div class="raw-fields" hidden>${Object.entries(focus).map(([k,v])=>`<div><code>${esc(k)}</code><span>${esc(v)}</span></div>`).join('')}</div></div>`;
  controls.querySelector('button')!.onclick=()=>{const e=scene.querySelector<HTMLElement>('.raw-fields')!;e.hidden=!e.hidden;controls.querySelector('button')!.textContent=e.hidden?'查看这条记录的原始字段':'收起原始字段';};
  caption.textContent='真实骑行 85744…2DF5 通过检查并保留。这里不额外制造重复或缺失记录。';
  return p=>{scene.querySelectorAll<HTMLElement>('.clean-gates span').forEach((e,i)=>reveal(e,clamp((p-.1-i*.16)*6),25));reveal(scene.querySelector('.clean-output')!,clamp((p-.65)*4));};
 }
 if(project==='citibike'&&step===1){
  const {scene,controls,caption}=context(section,'PySpark','拆分借还事件 → 按站点与小时汇总',samples.citibike.source.silver);
  controls.innerHTML='<button data-rides>查看组成这条汇总的 12 条骑行</button>';
  scene.innerHTML=`<div class="aggregation-story"><div class="event-stream">${raw.map(r=>`<span class="event-dot ${r.ride_id===focus.ride_id?'tracked':''}" title="${r.ride_id}">${r.ride_id===focus.ride_id?'85744…':departure(r)?'借出':'还入'}</span>`).join('')}</div><div class="route-arrow">↓ 汇总到同一个站点小时</div>${record('Silver · 2026-01-02 05 点','站点 6602.05','W 42 St & 8 Ave')}<div class="demand-counts"><div><strong data-count="out">0</strong><span>次借出</span></div><div><strong data-count="in">0</strong><span>次还入</span></div></div><div class="feature-additions"><div class="feature-chip"><b>＋ 时间字段</b><span>1 月 · 2 日 · 05 点</span></div><div class="feature-chip"><b>＋ 业务字段</b><span>电动车比例 90.91%</span></div><div class="feature-chip"><b>＋ 天气字段</b><span>气温 −4.4°C</span></div></div><div class="real-rides" hidden>${raw.map(r=>`<div><code>${r.ride_id}</code><span>${departure(r)?'借出 '+r.started_at.slice(11,19):'还入 '+r.ended_at.slice(11,19)}</span></div>`).join('')}</div></div>`;
  controls.querySelector('button')!.onclick=()=>{const e=scene.querySelector<HTMLElement>('.real-rides')!;e.hidden=!e.hidden;};
  section.querySelector('.story-details')!.insertAdjacentHTML('beforeend',`<p>${esc(samples.citibike.source.timeNote)}</p><p>Gold 另行保存标准化和 PCA 结果，最终训练读取 Silver；同小时业务字段的风险在最后复核阶段说明。</p>`);
  caption.textContent='已核对 12 条原始骑行与 Silver：11 次借出、1 次还入。85744…2DF5 是其中一次借出。';
  return p=>{scene.querySelectorAll<HTMLElement>('.event-dot').forEach((e,i)=>{const t=clamp(p*2.4-i*.035);e.style.opacity=String(1-t*.75);e.style.transform=`translateY(${t*40}px) scale(${1-t*.3})`;});scene.querySelector('[data-count="out"]')!.textContent=String(Math.round(11*clamp(p*2)));scene.querySelector('[data-count="in"]')!.textContent=p>.3?'1':'0';scene.querySelectorAll<HTMLElement>('.feature-chip').forEach((e,i)=>reveal(e,clamp((p-.45-i*.15)*7),50));};
 }
 if(project==='citibike'&&step===2){
  const {scene,controls,caption}=context(section,'PySpark randomSplit','80% 学习 · 10% 验证 · 10% 测试','src/train_pipeline/abstract_pipeline.py');
  controls.innerHTML='<button data-mode="random">原版随机分组</button><button data-mode="time" class="secondary">对照时间分组</button>';
  scene.innerHTML=`<div class="split-story">${record('从上一阶段继续','6602.05 · 05 点','真实汇总：借出 11 · 还入 1')}<div class="split-arrows"><i></i><i></i><i></i></div><div class="split-bins">${[['训练集','80%','学习规律'],['验证集','10%','检查与比较'],['测试集','10%','最后评估']].map(([a,b,c])=>`<div><strong>${a} <small>${b}</small></strong><div class="bin-slots"></div><span>${c}</span></div>`).join('')}</div><div class="split-particles">${Array.from({length:30},(_,i)=>`<i class="split-particle ${i===0?'tracked':''}">${i===0?'6602.05':''}</i>`).join('')}</div></div>`;
  let time=false;let current=0;
  const animate=(p:number)=>{current=p;const bins=scene.querySelectorAll<HTMLElement>('.split-bins>div');const parent=scene.querySelector<HTMLElement>('.split-story')!.getBoundingClientRect();scene.querySelectorAll<HTMLElement>('.split-particle').forEach((e,i)=>{const n=time?i:(i*7)%30;const group=n<24?0:n<27?1:2;const rect=bins[group].getBoundingClientRect();const t=clamp((p-i*.012)*1.8);const sx=parent.width/2+(i%6-3)*17;const tx=rect.left-parent.left+16+(i%4)*19;const sy=92+(i%3)*8;const ty=rect.top-parent.top+58+Math.floor((time?i:n)%24/4)*15;e.style.left=`${sx+(tx-sx)*t}px`;e.style.top=`${sy+(ty-sy)*t}px`;e.style.background=['var(--accent)','#e9bb58','#da765e'][group];e.style.opacity=String(clamp(p*8));});};
  controls.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{time=b.dataset.mode==='time';caption.textContent=time?'修复方式按先后时间分组；图中比例为示意。单条记录原来的分组归属没有保存，动画不声称还原原始归属。':'真实 Silver 记录参与训练输入；图中小块数量和记录落入哪组仅为分组机制示意。';animate(current);});
  caption.textContent='真实汇总进入训练输入；色块数量与单条记录分组位置为示意，不是原版分组日志。';
  return animate;
 }
 if(project==='citibike'&&step===3){
  const row=samples.citibike.pricing;
  const {scene,controls,caption}=context(section,'Python 价格规则','供需差 → 规则倍率 → 建议价','data/processed/pricing_analysis.csv + src/pricing/pricing_engine.py');
  scene.innerHTML=`<div class="real-price"><p class="branch">继续查看产品演示：这里使用已有 CSV 中的需求数据，离线模型尚未接入。</p>${record('真实 CSV · '+row.event_hour,'站点 '+row.station_id,'借出需求 19 · 还入需求 11')}<div class="price-equation"><div><small>可用车辆</small><strong data-available>28</strong></div><b>→</b><div><small>代码规则倍率</small><strong data-multiple>1.00</strong></div><b>× $4.49 →</b><div><small>建议价</small><strong data-price>$4.49</strong></div></div><p class="rule-reason"></p></div>`;
  controls.innerHTML='<label for="real-supply">调整可用车辆（交互假设）</label><input id="real-supply" type="range" min="5" max="40" value="28"/><button data-reset class="secondary">恢复 CSV 中的 28 辆</button>';
  const input=controls.querySelector('input')!;
  const calc=()=>{const n=Number(input.value);const br=(n-19)/Math.max(n,1),dr=(29-11)/29;let m=1;let reason='供需在代码设定的正常范围内。';if(br<-.3){m=Math.min(1+Math.abs(br)*.6,1.5);reason='车辆短缺：按短缺比例加价，最高 1.5 倍。';}else if(br>.5&&dr>.5){m=Math.max(1-Math.min(br,dr)*.25,.7);reason='车辆与空桩均有较多余量，按规则折扣。';}m=Math.round(m*100)/100;scene.querySelector('[data-available]')!.textContent=String(n);scene.querySelector('[data-multiple]')!.textContent=m.toFixed(2);scene.querySelector('[data-price]')!.textContent='$'+(4.49*m).toFixed(2);scene.querySelector('.rule-reason')!.textContent=reason;};input.oninput=calc;controls.querySelector('button')!.onclick=()=>{input.value='28';calc();};calc();
  caption.textContent='CSV 原值：可用 28 辆、空桩 29 个、倍率 1.00、建议价 $4.49。滑块只改变可用车辆，其他条件固定。';
  return p=>scene.querySelectorAll<HTMLElement>('.price-equation>div').forEach((e,i)=>reveal(e,clamp(p*3-i*.55),30));
 }
 if(project==='citibike'&&step===4){
  const {scene,caption}=context(section,'FastAPI → 页面','请求 → CSV 参考 → 规则 → 响应','src/api/routers/predict.py');
  const replacements=[['A 站 · 08 点','6535.04 · 17 点'],['4.49 × 1.25','4.49 × 1.00'],['$5.61','$4.49']];
  let html=scene.innerHTML;for(const[a,b]of replacements)html=html.split(a).join(b);scene.innerHTML=html;
  caption.textContent='真实 CSV 行：2026-01-20 17 点，站点 6535.04。按接口代码与价格规则演示，浏览器不调用真实后端。';
  section.querySelector('.story-details')!.insertAdjacentHTML('beforeend',`<a href="${base}/demos/citibike/dashboard.html" target="_blank">打开现有看板 ↗</a>`);
  return p=>{scene.querySelectorAll<HTMLElement>('.api-node').forEach((e,i)=>reveal(e,clamp(p*7-i),25));scene.querySelector<HTMLElement>('.api-line i')!.style.width=`${p*100}%`;reveal(scene.querySelector('.api-result')!,clamp((p-.75)*4));};
 }
 if(project==='adventureworks'&&step<=3){
  const sales=samples.adventureworks.sales;
  const {scene,controls,caption}=context(section,step===3?'Power BI · DAX':'SQL Server / Power Query',['UNION ALL · 上下追加','按明细编号检查唯一性','ProductKey · 关联商品名称','筛选记录 → 求和 → 计算毛利'][step],samples.adventureworks.source);
  const cards=(rows:typeof sales)=>rows.map(r=>`<div class="sales-record"><code>${r.sales_line_id}</code><span>${r.channel==='Internet'?'直销':'经销商'} · ProductKey ${r.ProductKey}</span><strong>$${money(Number(r.revenue))}</strong></div>`).join('');
  if(step===0){controls.innerHTML='';scene.innerHTML=`<div class="sales-merge"><div class="sales-sources"><div><small>Internet 直销表</small>${cards(sales.slice(0,2))}</div><div><small>Reseller 经销商表</small>${cards(sales.slice(2))}</div></div><div class="route-arrow">↓ UNION ALL · 保留三条明细</div><div class="sales-target">${cards(sales)}</div></div>`;caption.textContent='这三条记录取自项目真实导出表。统一列后上下追加，渠道标记与明细编号保留。';return p=>scene.querySelectorAll<HTMLElement>('.sales-target .sales-record').forEach((e,i)=>reveal(e,clamp((p-i*.18)*2.5),i<2?-80:80));}
  if(step===1){controls.innerHTML='';scene.innerHTML=`<div class="quality-real">${cards(sales)}<div class="check-results"><span>3 个明细编号 · 无重复 ✓</span><span>3 条成本 · 无缺失 ✓</span><span>商品编号 · 可关联 ✓</span></div></div>`;caption.textContent='检查这三条真实示例，编号唯一且成本完整。这里只说明示例的检查结果，完整数据质量另有项目报告。';return p=>scene.querySelectorAll<HTMLElement>('.check-results span').forEach((e,i)=>reveal(e,clamp((p-i*.2)*3),25));}
  if(step===2){controls.innerHTML='<button data-product>切换另一条真实明细</button>';let selected=0;let progress=0;const draw=()=>{const r=sales[selected];const prod=(samples.adventureworks.products as Record<string,{product_name:string}>)[r.ProductKey];scene.innerHTML=`<div class="key-match">${record('销售明细',r.sales_line_id,'ProductKey = '+r.ProductKey)}<div class="key-connector">${r.ProductKey} ↔ ${r.ProductKey}</div>${record('产品表 · 通过相同编号找到',prod.product_name,'ProductKey = '+r.ProductKey)}<div class="joined-result">${prod.product_name} · 收入 $${money(Number(r.revenue))}</div></div>`;reveal(scene.querySelector('.joined-result')!,clamp((progress-.5)*3));};draw();controls.querySelector('button')!.onclick=()=>{selected=(selected+1)%sales.length;draw();};caption.textContent='动画展示真实 ProductKey 匹配。完整模型还关联日期、地区和促销表；展开说明可查看关联键。';return p=>{progress=p;reveal(scene.querySelector('.key-connector')!,clamp(p*3));reveal(scene.querySelector('.joined-result')!,clamp((p-.5)*3));};}
  if(step===3){controls.innerHTML='<button data-channel="all">三条示例</button><button data-channel="Internet" class="secondary">直销两条</button><button data-channel="Reseller" class="secondary">经销商一条</button>';scene.innerHTML='<div class="actual-metrics"><div class="metric-records"></div><div class="price-equation"><div><small>收入合计</small><strong data-r></strong></div><b>−</b><div><small>成本合计</small><strong data-c></strong></div><b>＝</b><div><small>估算毛利</small><strong data-g></strong></div></div><p class="actual-margin"></p></div>';const calc=(ch:string)=>{const rows=sales.filter(r=>ch==='all'||r.channel===ch);const r=rows.reduce((n,x)=>n+Number(x.revenue),0),c=rows.reduce((n,x)=>n+Number(x.cost),0);scene.querySelector('.metric-records')!.innerHTML=rows.map(r=>`<span>${r.sales_line_id}</span>`).join('');scene.querySelector('[data-r]')!.textContent=money(r);scene.querySelector('[data-c]')!.textContent=money(c);scene.querySelector('[data-g]')!.textContent=money(r-c);scene.querySelector('.actual-margin')!.textContent=`估算毛利率 = ${money(r-c)} ÷ ${money(r)} = ${((r-c)/r*100).toFixed(2)}%`;};calc('all');controls.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>calc(b.dataset.channel!));caption.textContent='金额按上面三条真实明细计算；不是全项目总额。切换筛选范围，计算公式保持不变。';return p=>scene.querySelectorAll<HTMLElement>('.price-equation>div,.actual-margin').forEach((e,i)=>reveal(e,clamp(p*4-i*.6),20));}
 }
 if(project==='adventureworks'&&step===5){
  const {scene,controls,caption}=context(section,'Power BI → 工作台','明细用于展示 · 按订单汇总后检查','项目已有 Power BI 看板截图');controls.innerHTML='';scene.innerHTML=`<div class="actual-reports">${[['overview','经营总览'],['profitability','盈利诊断'],['territory','区域分析']].map(([file,name])=>`<a href="${base}/assets/adventureworks/${file}.png" target="_blank"><img loading="lazy" src="${base}/assets/adventureworks/${file}.png" alt="${name}真实看板截图"/><strong>${name} ↗</strong></a>`).join('')}<p>121,253 条销售明细 → 按订单汇总 → 31,455 张订单 → 工作台</p></div>`;caption.textContent='这是已有看板的真实截图，点击可查看大图。订单汇总检查不能替代对整份 Power BI 文件的独立审计。';return p=>scene.querySelectorAll<HTMLElement>('a').forEach((e,i)=>reveal(e,clamp(p*3-i*.45),35));
 }
 return undefined;
}
