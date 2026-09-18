import route from '../data/visual-transit-route.json';

type Context={base:string;layout:()=>void;tableShape:(name:string,kind?:string,rows?:number)=>string;reveal:(e:HTMLElement|null,p:number,x?:number)=>void;smooth:(n:number)=>number};
const q=<T extends Element=HTMLElement>(node:ParentNode,s:string)=>node.querySelector<T>(s)!;
const steps=(labels:string[])=>`<div class="extra-steps">${labels.map((s,i)=>`<div data-appear><span>0${i+1}</span><strong>${s}</strong></div>`).join('')}</div>`;
const arrow='<div class="extra-arrow" aria-hidden="true">↓</div>';
const badge=(text:string)=>`<span class="extra-badge">${text}</span>`;
const status=(text:string,kind='ok')=>`<p class="extra-status" data-status="${kind}" role="status">${text}</p>`;
let selectedMode=1;
const modes=[['探索','保留待验证草稿','个人初步了解数据'],['标准','发布前人工批准','团队内部使用'],['治理','执行前确认任务，发布前再批准','预测、对外或高风险任务']];

export function mountExtra(section:HTMLElement,i:number,project:string,c:Context):(p:number)=>void{
 const scene=q(section,'.flow-scene'),actions=q(section,'.flow-actions'),note=q(section,'.figure-note'),handoff=q(section,'.handoff-label');
 scene.classList.add('extra-scene');
 const appear=(p:number)=>scene.querySelectorAll<HTMLElement>('[data-appear]').forEach((e,j)=>c.reveal(e,c.smooth((p-j*.10)*2.6)));
 const explain=(label:string,text:string)=>{actions.innerHTML=`<details class="sample-disclosure"><summary>${label}</summary><p>${text}</p></details>`;};
 if(project==='workbench'){
  if(i===0){
   selectedMode=1;
   scene.innerHTML=`<div class="extra-input-pair"><div data-appear>${c.tableShape('整理好的订单','combined',3)}<small>每行一张订单</small></div><div class="contract-sheet" data-appear><span>分析输入合同</span><strong>一行是什么？</strong><p>每行一张订单</p><strong>哪个字段不能重复？</strong><p>order_id</p><strong>金额用什么单位？</strong><p>元</p></div></div>${arrow}<div class="saved-input" data-appear>${badge('保存本次输入')}<strong>数据文件 ＋ 字段要求</strong></div>`;
   explain('合同是谁写的？','使用者填写或由 AI 编程助手协助整理。字段要求必须对应实际列名；例如“订单编号”对应 order_id，工作台按配置读取，不凭中文描述自动猜测。');
   note.textContent='以下三张订单为自编示例，专门说明工作台运行规则。';handoff.textContent='数据和规则齐备，确定本次用途';return appear;
  }
  if(i===1){
   scene.innerHTML=`<div class="mode-options">${modes.map(([m,,use],j)=>`<button data-mode-choice="${j}" aria-pressed="${j===1}" data-appear><span>${use}</span><strong>${m}</strong></button>`).join('')}</div><div class="mode-result" aria-live="polite"><span>标准模式</span><strong>发布前人工批准</strong><p>先确认运行计划，再执行检查与计算。</p></div>`;
   scene.querySelectorAll<HTMLButtonElement>('[data-mode-choice]').forEach(b=>b.onclick=()=>{
    selectedMode=Number(b.dataset.modeChoice);scene.querySelectorAll('[data-mode-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    q(scene,'.mode-result span').textContent=modes[selectedMode][0]+'模式';q(scene,'.mode-result strong').textContent=modes[selectedMode][1];
    document.querySelectorAll('[data-mode-publish]').forEach(e=>e.textContent=modes[selectedMode][0]+'：'+modes[selectedMode][1]);c.layout();
   });
   note.textContent='点击用途，查看对应要求。三个模式都保留运行记录；探索结果属于待验证草稿。';handoff.textContent='确认运行计划，开始检查数据';return appear;
  }
  if(i===2){
   scene.innerHTML=`<div class="extra-mini-table"><div class="mini-table-head"><span>订单编号</span><span>收入（元）</span></div>${['O1','O2','O3'].map((id,j)=>`<div class="mini-table-row" data-quality-row="${j}"><strong>${id}</strong><span>${[100,200,150][j]}</span></div>`).join('')}<div class="extra-scan" aria-hidden="true"></div></div><div class="quality-pills"><span data-appear>字段齐全</span><span data-appear>编号非空</span><span data-appear data-unique>编号唯一</span></div>${status('示例数据通过这三项检查')}`;
   actions.innerHTML='<button data-duplicate aria-pressed="false">试一条重复编号</button>';
   const b=q<HTMLButtonElement>(actions,'button');b.onclick=()=>{const bad=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(bad));b.textContent=bad?'恢复示例数据':'试一条重复编号';q(scene,'[data-quality-row="2"] strong').textContent=bad?'O2':'O3';q(scene,'[data-quality-row="2"]').classList.toggle('problem-row',bad);q(scene,'[data-unique]').textContent=bad?'编号重复':'编号唯一';const s=q(scene,'.extra-status');s.dataset.status=bad?'error':'ok';s.textContent=bad?'发现重复：O2 出现了两次':'示例数据通过这三项检查';};
   note.textContent='按钮仅演示重复检查，不改变后续求和样例。预测字段的限制需提前写入配置。';handoff.textContent='保存检查记录，标明哪些要求未满足';
   return p=>{appear(p);q(scene,'.extra-scan').style.top=`${15+c.smooth(p)*75}%`;};
  }
  if(i===3){
   scene.innerHTML=`<div class="sum-records">${[100,200,150].map((n,j)=>`<div data-appear><span>订单 O${j+1}</span><strong>${n}</strong></div>`).join('<i>＋</i>')}</div>${arrow}<div class="sum-result" data-appear><span>收入合计 · 元</span><strong>450</strong><code>SUM(revenue)</code></div><div class="saved-query" data-appear>查询与结果一并保存</div>`;
   actions.innerHTML='<button data-wb-metric="revenue" aria-pressed="true">收入合计</button><button data-wb-metric="count" aria-pressed="false">订单数</button>';
   actions.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{const sum=b.dataset.wbMetric==='revenue';actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));q(scene,'.sum-result span').textContent=sum?'收入合计 · 元':'订单数量 · 张';q(scene,'.sum-result strong').textContent=sum?'450':'3';q(scene,'.sum-result code').textContent=sum?'SUM(revenue)':'COUNT(DISTINCT order_id)';});
   note.textContent='金额来自本页自编的三张订单。按已有公式计算，不需要调用 AI。';handoff.textContent='计算结果保存后，才有可核对的结论依据';return appear;
  }
  if(i===4){
   scene.innerHTML=`<div class="evidence-pair"><div data-appear><span>待检查的结论</span><strong data-claim>450 元</strong></div><b aria-hidden="true">↔</b><div data-appear><span>本次计算结果</span><strong>450 元</strong></div></div><div class="evidence-version" data-appear><span>本次输入</span><span>本次查询</span><span>本次结果</span></div>${status('数值一致；仍需满足其他检查要求')}`;
   actions.innerHTML='<button data-evidence="valid" aria-pressed="true">对应本次结果</button><button data-evidence="value" aria-pressed="false">试一个错误数字</button><button data-evidence="version" aria-pressed="false">试引用旧版本</button><details class="sample-disclosure ai-explanation"><summary>AI 在哪里参与？</summary><p>需要时，可在审查后另行调用 AI，解释已有结果与限制。AI 建议稿和调用记录单独保存；程序本身完成数值计算和规则检查。</p><small>此处是功能说明，没有发起模型调用。</small></details>';
   actions.querySelectorAll<HTMLButtonElement>('[data-evidence]').forEach(b=>b.onclick=()=>{const mode=b.dataset.evidence;actions.querySelectorAll('[data-evidence]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));q(scene,'[data-claim]').textContent=mode==='value'?'480 元':'450 元';q(scene,'.evidence-version span:last-child').textContent=mode==='version'?'旧版本结果':'本次结果';const s=q(scene,'.extra-status');s.dataset.status=mode==='valid'?'ok':'error';s.textContent=mode==='value'?'480 与 450 不一致，需要修正结论':mode==='version'?'引用版本不对应，不能作为本次结果的依据':'数值一致；仍需满足其他检查要求';});
   note.textContent='交互分别演示数值和版本检查，不代表全部审查规则。';handoff.textContent='把结果、依据和检查状态交给报告';return appear;
  }
  scene.innerHTML=`<div class="report-ingredients"><span data-appear>检查记录</span><span data-appear>计算结果</span><span data-appear>结论依据</span></div>${arrow}<div class="extra-report" data-appear><span>本次任务报告</span><h3>结果与限制一起保留</h3><div><i class="status-dot green"></i>已有可用结论</div><div><i class="status-dot amber"></i>仍有限制或待验证</div><div><i class="status-dot red"></i>关键问题尚未解决</div><small>三种状态的含义示意；每次报告按实际检查显示。</small></div><p class="publish-mode" data-mode-publish>${modes[selectedMode][0]}：${modes[selectedMode][1]}</p>`;
  actions.innerHTML=`<a href="${c.base}/demos/workbench/report.html" target="_blank" rel="noreferrer">打开实际报告 ↗</a><a href="${c.base}/assets/workbench/home.png" target="_blank" rel="noreferrer">查看工作台页面 ↗</a>`;
  note.textContent='报告写明数据来源、结果、检查状态和适用限制。正式导出还需满足当前模式的条件。';handoff.textContent='从输入数据，到能够追查依据的报告';return appear;
 }
 if(project==='qingdao-transit'){
  if(i===0){
   scene.innerHTML=`<div class="transit-request" data-appear><span>查询青岛公交</span><strong>${route.name} · 线路详情</strong><small>已保存的项目记录</small></div><div class="request-dots" aria-hidden="true">${'<i data-appear></i>'.repeat(3)}</div><div class="api-response" data-appear><span>返回线路信息</span><strong>李村公园 → 动物园北门</strong><div><span>站点顺序</span><span>经纬度</span><span>轨迹坐标</span></div></div>`;
   actions.innerHTML='<button data-request="saved" aria-pressed="true">已保存结果</button><button data-request="retry" aria-pressed="false">遇到请求失败</button><p class="request-note" role="status">已有资料直接复用，避免重复请求。</p>';
   actions.querySelectorAll<HTMLButtonElement>('[data-request]').forEach(b=>b.onclick=()=>{actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));q(actions,'.request-note').textContent=b.dataset.request==='retry'?'记录失败并按规则重试；仍未成功的结果需要后续处理。':'已有资料直接复用，避免重复请求。';c.layout();});
   note.textContent='线路名称来自实际保存的 3 路记录。这里只演示请求流程，不访问高德 API。';handoff.textContent='接口返回的资料，进入数据整理';return appear;
  }
  if(i===1){
   scene.innerHTML=`<div class="api-source-label">线路详情</div><svg class="table-branch" viewBox="0 0 340 65" aria-hidden="true"><path pathLength="1" d="M170 0 V20 Q170 35 55 35 V65"/><path pathLength="1" d="M170 0 V65"/><path pathLength="1" d="M170 0 V20 Q170 35 285 35 V65"/></svg><div class="three-tables">${['线路','站点','轨迹'].map((s,j)=>`<button data-transit-table="${j}" aria-pressed="${j===0}" data-appear>${c.tableShape(s,'',3)}</button>`).join('')}</div><p class="table-purpose" aria-live="polite">线路表：一条线路的名称、起终点等信息。</p><div class="transit-counts"><div><strong>874</strong><span>有效线路</span></div><div><strong>5,616</strong><span>唯一站点</span></div></div>`;
   scene.querySelectorAll<HTMLButtonElement>('[data-transit-table]').forEach(b=>b.onclick=()=>{q(scene,'.table-purpose').textContent=['线路表：一条线路的名称、起终点等信息。','站点表：线路经过哪些站点，按什么顺序排列。','轨迹表：一条线路沿途的坐标点，用于画出行驶轨迹。'][Number(b.dataset.transitTable)];scene.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
   note.textContent='点击表，查看每类数据的用途。表内横线示意结构，规模数字来自项目结果。';handoff.textContent='坐标用于画地图，站名用于比较线路关系';
   return p=>{appear(p);scene.querySelectorAll<SVGPathElement>('path').forEach(e=>e.style.strokeDashoffset=String(1-c.smooth(p*2)));};
  }
  if(i===2){
   scene.innerHTML=`<div class="station-lines"><div data-appear><b>A 线</b><span>甲站</span><span data-common>乙站</span></div><div data-appear><b data-line-name>B 线</b><span data-other-common>乙站</span><span data-other-stop>丙站</span></div></div>${arrow}<svg class="pair-network" viewBox="0 0 340 110" role="img" aria-label="共同站名使两条线路建立连接"><path pathLength="1" d="M75 52 H265"/><circle cx="75" cy="52" r="28"/><circle cx="265" cy="52" r="28"/><text x="75" y="58">A 线</text><text x="265" y="58" data-pair-name>B 线</text><text x="170" y="101" class="edge-label">共同站名：乙站</text></svg>`;
   let connected=true,last=0;const draw=(p:number)=>{last=p;appear(p);q<SVGPathElement>(scene,'path').style.strokeDashoffset=String(connected?1-c.smooth((p-.15)*2):1);q(scene,'.edge-label').textContent=connected?'共同站名：乙站':'没有共同站名，不建立直接连接';scene.querySelectorAll<HTMLElement>('[data-common],[data-other-common]').forEach(e=>e.classList.toggle('matched-stop',connected));};
   actions.innerHTML='<button data-pair="yes" aria-pressed="true">A 线与 B 线</button><button data-pair="no" aria-pressed="false">A 线与 C 线</button>';
   actions.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{connected=b.dataset.pair==='yes';q(scene,'[data-line-name]').textContent=connected?'B 线':'C 线';q(scene,'[data-pair-name]').textContent=connected?'B 线':'C 线';q(scene,'[data-other-common]').textContent=connected?'乙站':'丁站';q(scene,'[data-other-stop]').textContent=connected?'丙站':'戊站';actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw(last);});
   note.textContent='A、B、C 为虚构线路，演示真实建图规则。图中的圆点代表线路。';handoff.textContent='每条线路成为一个节点，共同站名成为连接依据';return draw;
  }
  if(i===3){
   const points=[[45,60],[140,55],[260,45],[80,175],[185,185],[290,175]];
   const edges=[[0,1],[1,2],[1,3],[3,4],[4,5],[2,5]];
   scene.innerHTML=`<svg class="city-network" viewBox="0 0 340 245" role="img" aria-label="六条虚构线路组成的网络"><g>${edges.map(([a,b],j)=>`<path data-edge="${j}" pathLength="1" d="M${points[a].join(' ')} L${points[b].join(' ')}"/>`).join('')}</g>${points.map(([x,y],j)=>`<g class="network-node" data-node="${j}"><circle cx="${x}" cy="${y}" r="22"/><text x="${x}" y="${y+5}">${'ABCDEF'[j]}</text></g>`).join('')}</svg><p class="path-result" aria-live="polite">A → B → C → F，共经过 3 条连接。</p><div class="network-stats"><span>实际项目</span><strong>25,929 <small>条线路间连接</small></strong><strong>2.57 <small>平均路径长度（约）</small></strong></div>`;
   let degree=false;const mark=()=>{scene.querySelectorAll('[data-edge]').forEach((e,j)=>e.classList.toggle('chosen-edge',(degree?[0,1,2]:[0,1,5]).includes(j)));q(scene,'.path-result').textContent=degree?'B 直接连接 A、C、D，共 3 条其他线路。':'A → B → C → F，共经过 3 条连接。';};mark();
   actions.innerHTML='<button data-network-view="path" aria-pressed="true">看最短路径</button><button data-network-view="degree" aria-pressed="false">看直接连接</button>';
   actions.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{degree=b.dataset.networkView==='degree';actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));mark();});
   note.textContent='小图为虚构网络。2.57 来自实际项目的线路网络计算，单位是连接步数，不是分钟。';handoff.textContent='网络计算说明线路之间怎样到达';
   return p=>scene.querySelectorAll<SVGPathElement>('[data-edge]').forEach((e,j)=>e.style.strokeDashoffset=String(1-c.smooth((p-j*.07)*2.6)));
  }
  const pointString=route.points.map(x=>x.join(',')).join(' ');const first=route.points[0],last=route.points.at(-1)!;
  scene.innerHTML=`<div class="real-route"><span>实际 3 路轨迹 · 抽样示意</span><svg viewBox="0 0 340 275" role="img" aria-label="从保存的经纬度抽样绘制的三路公交轨迹"><path class="map-grid" d="M30 70 H310 M30 140 H310 M30 210 H310 M90 20 V250 M170 20 V250 M250 20 V250"/><polyline pathLength="1" points="${pointString}"/>${[first,last].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</svg><small>李村公园 → 动物园北门</small></div><div class="transit-products"><a href="${c.base}/demos/qingdao/maps/青岛公交网络可视化.html" target="_blank" rel="noreferrer" data-appear>打开交互地图 ↗</a><a href="${c.base}/demos/qingdao/maps/公交网络综合分析.html" target="_blank" rel="noreferrer" data-appear>打开综合分析 ↗</a></div>`;
  explain('这条曲线来自哪里？','曲线从项目保存的 3 路经纬度轨迹抽样并缩放绘制。它用于展示线路形状；完整地理底图、线路集合和网络结果请打开实际产物。');
  note.textContent='地图位置与换乘关系分别呈现。班次、拥堵与步行时间需要额外资料。';handoff.textContent='从线路资料，到可查看的地图与网络';return p=>{appear(p);q<SVGPolylineElement>(scene,'polyline').style.strokeDashoffset=String(1-c.smooth(p*1.6));};
 }
 // R&D and patents: public synthetic examples, never private company records.
 if(i===0){
  scene.innerHTML=`<div class="file-pile"><div class="rd-source" data-appear><span>研发主表</span><strong>公司 · 截止日期 · 研发投入</strong><small>000001 · 2020-12-31</small><small>000002 · 2020-12-31</small><small>000001 · 2021-12-31</small></div><div class="patent-files"><div data-appear><span>2020.csv</span><strong>年度专利</strong></div><div data-appear><span>2021.csv</span><strong>年度专利</strong></div></div></div>`;
  explain('公开样本与课程数据有什么不同？','这里的三条研发记录来自公开合成样本，用于复现处理方法。真实课程任务覆盖 2010—2021 年，原始公司级明细不公开。');
  note.textContent='合成样本来源：公开仓库 sample_data。';handoff.textContent='文件读入后，先确认字段名所在的位置';return appear;
 }
 if(i===1){
  scene.innerHTML=`<div class="header-example"><div class="sheet-explanation">说明行 / 默认列名</div><div class="detected-header"><span>股票代码</span><span>公司专利申请合计</span></div><div class="sheet-data"><span>000001</span><span>18</span></div><div class="sheet-data"><span>000002</span><span>10</span></div></div><div class="header-label" role="status">将字段名所在行设为表头</div>`;
  let normal=false,last=0;const draw=(p:number)=>{last=p;const t=normal?1:c.smooth(p);q(scene,'.sheet-explanation').style.opacity=String(1-t);q(scene,'.detected-header').style.transform=`translateY(${-t*36}px)`;scene.querySelectorAll<HTMLElement>('.sheet-data').forEach(e=>e.style.transform=`translateY(${-t*36}px)`);q(scene,'.header-label').textContent=normal?'字段已经是列名，直接读取':'找到首行字段名，提升为表头';};
  actions.innerHTML='<button data-header="extra" aria-pressed="true">表头藏在首行</button><button data-header="normal" aria-pressed="false">已经是正确表头</button>';
  actions.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{normal=b.dataset.header==='normal';actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw(last);});
  note.textContent='说明行是为了演示读取规则而加入的。程序处理两类已知表头，不自动识别任意版式。';handoff.textContent='字段位置明确，继续统一匹配条件';return draw;
 }
 if(i===2){
  scene.innerHTML=`<div class="key-normalization"><div data-appear><span>证券代码示意</span><code> 000001.SZ </code></div><i>↓ 去空格、后缀，补足六位</i><div class="normalized-code" data-appear><strong>000001</strong></div></div><div class="year-pair"><div data-appear><span>研发截止日期</span><strong>2020-12-31</strong><b>2020</b></div><div data-appear><span>专利文件名</span><strong>2020.csv</strong><b>2020</b></div></div><div class="join-key" data-appear>000001 <span>＋</span> 2020</div>`;
  note.textContent='代码格式转换为示意；实际匹配同时使用证券代码和年份。';handoff.textContent='公司与年份都一致，才是同一组资料';return appear;
 }
 if(i===3){
  scene.innerHTML=`<div class="join-input"><div data-appear><span>研发主表</span><strong>000001 · <b data-rd-year>2020</b></strong><small>研发投入 <b data-investment>1,200,000</b></small></div><div data-appear><span>年度专利表</span><strong>000001 · 2020 → 18</strong><strong>000001 · 2021 → 23</strong></div></div>${arrow}<div class="joined-row" data-appear><span>研发记录始终保留</span><div><strong>000001</strong><strong data-joined-year>2020</strong><strong data-patent-count>18 项</strong></div><small data-join-message>匹配到 2020 年专利信息</small></div>`;
  actions.innerHTML='<button data-join-year="2020" aria-pressed="true">匹配 2020</button><button data-join-year="2021" aria-pressed="false">匹配 2021</button><button data-join-year="2022" aria-pressed="false">试一个缺失年份</button>';
  actions.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{const year=b.dataset.joinYear!;const missing=year==='2022';actions.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));q(scene,'[data-rd-year]').textContent=year;q(scene,'[data-joined-year]').textContent=year;q(scene,'[data-investment]').textContent=year==='2020'?'1,200,000':year==='2021'?'1,450,000':'示意记录';q(scene,'[data-patent-count]').textContent=missing?'缺失':year==='2020'?'18 项':'23 项';q(scene,'[data-join-message]').textContent=missing?'没有对应专利记录，保留缺失；不能当成 0。':`匹配到 ${year} 年专利信息`;q(scene,'.joined-row').classList.toggle('unmatched-row',missing);});
  note.textContent='2020、2021 来自公开合成样本。2022 为额外的未匹配演示，不计入项目统计。';handoff.textContent='保留研发数据，同时区分匹配成功与未匹配';return appear;
 }
 scene.innerHTML=`<div class="match-summary"><span>原课程任务 · 汇总核验</span><strong>24,078 <small>条研发记录</small></strong><div class="match-bar" role="img" aria-label="成功匹配21605条，匹配率约89.73%"><i></i></div><div class="match-labels"><span><b>21,605</b> 成功匹配</span><span><b>89.73%</b> 匹配率</span></div></div>${arrow}<div class="file-exports"><span data-appear>合并数据<br/><strong>CSV / Excel</strong></span><span data-appear>核验记录<br/><strong>行数与匹配状态</strong></span></div>`;
 actions.innerHTML='<button data-unmatched>未匹配代表什么？</button><p class="unmatched-explanation" hidden>未匹配表示当前资料没有找到同一公司、同一年份的对应记录，不能据此判断专利数量为零。重复匹配还可能增加输出行数，需要单独核对。</p>';
 q<HTMLButtonElement>(actions,'button').onclick=()=>{const e=q(actions,'.unmatched-explanation');e.hidden=!e.hidden;c.layout();};
 note.textContent='汇总数字来自原课程任务核验说明。合成演示不复现这个总量；项目未进行统计或因果分析。';handoff.textContent='完成数据整理，供后续研究使用';return p=>{appear(p);q(scene,'.match-bar i').style.transform=`scaleX(${c.smooth(p)*.897292})`;};
}
