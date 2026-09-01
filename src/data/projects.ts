export type Project = {
  slug: string;
  name: string;
  shortName: string;
  type: string;
  year: string;
  ai: string;
  question: string;
  belief: string;
  story: string;
  shift: string;
  summary: string;
  role: string;
  aiCollaboration: { title: string; text: string }[];
  references: { name: string; href?: string; relation: string }[];
  tools: string[];
  numbers: { value: string; label: string }[];
  process: { title: string; text: string }[];
  findings: string[];
  boundaries: string[];
  images: { src: string; alt: string; caption: string }[];
  links: { label: string; href: string; kind?: 'primary' | 'download' }[];
};

export const projects: Project[] = [
  {
    slug: 'citibike',
    name: 'CitiBike 需求预测与动态定价',
    shortName: 'CitiBike',
    type: '端到端数据科学 × 可信复核',
    year: '2026',
    ai: '首版：Claude Code + DeepSeek Pro｜复核修复：Codex + ChatGPT-sol',
    question: '如何把千万级骑行记录转成可执行的站点供需判断与定价建议，同时诚实验证模型到底靠不靠谱？',
    belief: '工作台复核改变了我对旧版高分的理解，也促使项目增加了一条更接近未来预测场景的验证分支。',
    story: '项目从2026年1—5月约1,453万条骑行记录开始。我先把单次骑行整理成站点—小时供需数据，再加入时间、天气、站点容量和历史行为特征，分别预测借车量与还车量。预测结果随后进入动态定价策略、FastAPI接口和可视化看板，形成了从数据到产品演示的完整过程。工作台复核时，我重新检查了模型在预测时刻究竟能够知道哪些信息。三个比例字段使用了当前小时已经发生的借还车结果，随机切分又把不同日期和季节的记录混合分配到训练集与测试集，因此旧版R²需要结合实验设计重新解释。',
    shift: '我保留了原课程版，因为原课程版记录了数据获取、建模、策略、API和看板怎样连接起来。随后增加修复分支：移除三个在预测开始时无法获得的字段，按时间先后划分训练、验证和测试数据，并在2.4万行样本上完成三组最小验证。修复分支的指标低于旧版，当前结果用于确认新流程可以运行，以及旧版高分确实受到特征和切分方式影响。千万级数据的完整重训、旧API和旧看板的同步更新没有继续执行，因为当前目标已经收缩为证明工作台能够帮助发现问题并推动一次可验证的修改。',
    summary: '项目完整经历了官方数据整理、分层存储、站点—小时聚合、特征工程、借还车需求预测、动态定价策略、FastAPI接口和可视化展示。后续复核增加了时间切分与安全特征版本，并保留旧版与修复版的用途差异。',
    role: '项目由本人独立完成。我负责确定业务问题、判断数据粒度、选择技术路线、拆分阶段、检查模型指标、解释工作台疑点、决定修复范围，并确认哪些结果能够公开。AI负责调研参考项目、展开代码实现、生成测试与文档初稿；最终的指标解释、错误修正和停止条件由本人确认。',
    aiCollaboration: [
      { title: '首版方案怎样形成', text: '我先把课程要求和动态定价想法交给Claude Code与DeepSeek Pro，再让AI查找需求预测、站点供需和价格激励的已有项目。方案经过讨论后被拆成数据整理、特征工程、模型训练、策略计算、API和展示页面。' },
      { title: 'AI在实施阶段负责什么', text: 'Claude Code主要生成PySpark、Pandas、scikit-learn、FastAPI和可视化代码，DeepSeek Pro参与方案讨论与解释。我逐阶段阅读输出、运行程序、检查文件和指标，并决定是否进入下一阶段。' },
      { title: '复核为什么更换了工具', text: '项目完成后，我把旧版数据和报告交给可信分析工作台，并使用Codex与ChatGPT-sol重新检查预测时点、字段来源和切分方式。不同工具给出的判断没有直接作为结论，我继续回到数据定义、代码和报告中核对。' },
      { title: '我怎样决定停止位置', text: '修复版完成了安全字段、时间切分和最小验证以后，我没有继续重做全部API与看板。当前求职展示需要证明原项目能够被复核和修改，继续重建所有旧产物不会改变这个结论，因此被列为后续工作。' },
    ],
    references: [
      { name: 'Shakleen / CitiBike-Demand-Prediction', href: 'https://github.com/Shakleen/CitiBike-Demand-Prediction', relation: '参考了大规模CitiBike数据处理、需求预测和Web接口的整体技术路线；本项目重新选择了数据时间范围、聚合口径、特征和模型。' },
      { name: 'Bikenomics — NYC Citibike Optimization', relation: '本地保留了该项目的README快照，参考了站点供需、价格激励和用户引导的产品思路。原仓库地址没有保留，因此网站暂不提供外部链接。' },
    ],
    tools: ['Python', 'PySpark', 'Pandas', 'Parquet', 'scikit-learn', 'FastAPI', 'Pyecharts', 'Codex'],
    numbers: [
      { value: '1,453万', label: '原始骑行记录' },
      { value: '438万', label: '站点—小时聚合记录' },
      { value: '99.3%', label: '站点容量匹配率' },
      { value: '3项', label: '复核识别的高风险字段' },
    ],
    process: [
      { title: '采集与存储', text: '整理2026年1—5月16个CSV文件，使用Parquet分层保存，避免每次从头读取约2.7GB原始数据。' },
      { title: '清洗与聚合', text: '统一字段、处理异常记录，再把单次骑行聚合到“站点—小时”，形成可建模的供需表。' },
      { title: '特征与建模', text: '组合时间、天气、容量和历史行为特征，训练借车量与还车量模型，并通过FastAPI提供策略演示。' },
      { title: '可信复核', text: '工作台发现3个同小时结果字段和随机切分风险；移除风险字段并改用时间切分，完成2.4万行三组对照验证。' },
      { title: '记录修正范围', text: '将旧R² 0.644标记为课程版结果，并把2.4万行的新结果说明为最小运行验证，避免读者把它理解成千万级完整重训成绩。' },
    ],
    findings: [
      '旧版高分同时受到模型、字段来源和数据切分方式影响，不能只根据一个R²判断未来预测能力。',
      '工作台把112条重复拒绝合并成总览，最终定位为少数共性问题，减少了审查噪声。',
      '修复版移除了预测时点无法获得的字段，并使用时间切分；指标下降记录了评估条件变化带来的影响。',
    ],
    boundaries: [
      '2.4万行结果用于验证修复后的代码、数据切分和指标计算能够完整运行，不能代表千万级数据完整重训后的最终精度。',
      '当前FastAPI和旧可视化仍用于展示课程版产品链路，页面中会明确标注Legacy边界。',
      '动态定价属于策略模拟，不代表真实商业环境中的因果收益。',
    ],
    images: [
      { src: '/assets/citibike/legacy-dashboard.png', alt: 'CitiBike旧版可视化看板', caption: '旧版产品看板：保留完整业务演示，但明确标注为Legacy课程版。' },
      { src: '/assets/citibike/api-demo.png', alt: 'CitiBike API交互页面', caption: 'FastAPI交互演示：把预测与策略能力包装成可调用接口。' },
      { src: '/assets/citibike/api-overview.png', alt: 'CitiBike动态定价API接口总览', caption: 'FastAPI接口总览：展示单次预测、站点预测、热点识别和页面入口，说明模型结果已经封装为可调用服务。' },
      { src: '/assets/citibike/workbench-audit.png', alt: '工作台审查CitiBike结果', caption: '工作台审查：把“暂不发布”的原因拆成可定位、可修改的问题。' },
      { src: '/assets/citibike/repair-record.png', alt: 'CitiBike时间切分修复记录', caption: '修复记录：移除高风险字段、改为时间切分，并保留前后对照。' },
    ],
    links: [
      { label: '查看 GitHub', href: 'https://github.com/mfj0924-lab/citibike-demand-pricing', kind: 'primary' },
      { label: '打开旧版看板', href: '/demos/citibike/dashboard.html' },
      { label: '查看答辩展示', href: '/demos/citibike/presentation.html' },
      { label: '下载项目报告', href: '/downloads/citibike_project_report.docx', kind: 'download' },
    ],
  },
  {
    slug: 'adventureworks',
    name: 'AdventureWorks 经营分析',
    shortName: 'AdventureWorks',
    type: 'SQL × Power BI × 经营诊断',
    year: '2026',
    ai: 'Codex + ChatGPT-sol',
    question: '销售规模增长是否带来了健康的估算毛利？问题究竟集中在哪个渠道、品类和SKU？',
    belief: '总收入和订单量说明了规模，不能单独回答经营是否健康。',
    story: '总览页显示约1.10亿美元收入和11.43%的估算毛利率，这些数字本身没有告诉我好或坏，因为没有目标，也没有合适的对照。继续按渠道拆分以后，Reseller贡献了大部分收入，估算毛利贡献却很低；问题这才从“整体表现如何”缩小到渠道、品类和SKU。',
    shift: '折扣与低毛利同时出现，只能说明两者存在关联，现有数据还不能证明折扣造成亏损；地区毛利率不同，也需要继续检查渠道和产品结构。项目将已经确认的事实、待验证原因和当前无法证明的部分分开，使三页Power BI分别承担经营总览、盈利诊断和区域分析的任务。',
    summary: '以Microsoft AdventureWorks虚构样例为数据源，使用SQL统一口径、Power BI建立星型模型和经营看板，再用工作台形成可追溯报告。分析从经营总览继续下钻到渠道、品类、SKU和区域，用更细的数据解释规模与估算毛利之间的差异。',
    role: '个人完成。本人定义经营问题与指标口径，搭建分析路径，校验SQL与Power BI结果，并对结论和边界负责。',
    aiCollaboration: [
      { title: '我先怎样确定分析问题', text: '我把课程数据、已有字段和“规模增长是否带来健康估算毛利”的问题交给Codex与ChatGPT-sol讨论。AI帮助检查还缺少哪些指标、维度和对账步骤，我根据经营含义确定销售收入、样例产品成本、估算毛利、估算毛利率、订单数和销售件数的口径。' },
      { title: 'AI怎样帮助搭建技术方案', text: 'AI提供SQL统一视图、星型模型、DAX度量值和页面结构的建议，也在Power BI出现关系、排序、条件格式和DAX错误时帮助定位原因。我在Power BI中完成导入、关系建立、度量值创建、筛选器设置和页面制作。' },
      { title: '哪些结果由我核对', text: '我使用Power Query检查整表质量，比较SQL与Power BI总额，逐页检查筛选器和指标是否联动，再根据渠道、品类、SKU和地区结果修正分析结论。AI生成的解释只有在能够由页面和口径支持时才会保留。' },
      { title: '工作台在项目末尾怎样参与', text: 'Power BI页面完成后，我再把分析就绪数据交给可信分析工作台生成可追溯报告。工作台负责保存口径、检查与结论来源，Power BI继续承担交互分析和展示。' },
    ],
    references: [
      { name: 'Microsoft AdventureWorks 示例数据', href: 'https://learn.microsoft.com/sql/samples/adventureworks-install-configure', relation: 'AdventureWorks提供虚构企业的销售、产品、客户和地区数据。本项目自行统一Internet与Reseller销售口径，并设计经营总览、盈利诊断和区域分析页面。' },
    ],
    tools: ['SQL Server', 'SQL', 'Power Query', 'Power BI', 'DAX', 'Python', '分析工作台'],
    numbers: [
      { value: '12.1万', label: '统一销售明细' },
      { value: '$1.10亿', label: '样例销售收入' },
      { value: '11.43%', label: '估算毛利率' },
      { value: '73.26%', label: 'Reseller收入占比' },
    ],
    process: [
      { title: '口径统一', text: '通过SQL视图统一Internet与Reseller销售明细，先确定一行代表什么，再计算收入、成本和估算毛利。' },
      { title: '质量检查', text: '在Power Query检查行数、唯一性、空值、错误、日期范围和渠道分类，避免“脏数据直接进图”。' },
      { title: '模型搭建', text: '建立销售事实表与日期、产品、地区、促销维表的星型模型，让筛选关系清晰可控。' },
      { title: '下钻诊断', text: '从经营总览进入渠道、品类、SKU和区域，追踪规模与盈利贡献错位。' },
      { title: '对账与边界', text: '将SQL总额与Power BI结果对账，并明确估算毛利不等于净利润、样例期间并不完整。' },
    ],
    findings: [
      'Reseller贡献约73.26%的收入，却只贡献约3.75%的估算毛利，规模与盈利贡献明显错位。',
      '2013年Reseller渠道估算毛利为负，亏损主要集中在Bikes品类与部分SKU。',
      '区域差异很大程度上由渠道与产品结构共同影响，不能直接把相关关系说成地区导致亏损。',
    ],
    boundaries: [
      'AdventureWorks是虚构样例，结论用于展示分析能力，不代表真实企业经营事实。',
      '估算毛利=销售收入−样例产品成本，不是包含期间费用、税费后的净利润。',
      '2010、2014及Reseller 2013存在不完整期间，跨年比较必须谨慎。',
    ],
    images: [
      { src: '/assets/adventureworks/overview.png', alt: 'AdventureWorks经营总览', caption: '经营总览：在同一页对照收入、估算毛利率的月度变化，以及Internet和Reseller的规模与毛利贡献错位。' },
      { src: '/assets/adventureworks/profitability.png', alt: 'AdventureWorks盈利诊断', caption: '盈利诊断：默认聚焦2013年Reseller，从负毛利SKU、折扣档和渠道×品类三个层级定位亏损集中区域。' },
      { src: '/assets/adventureworks/territory.png', alt: 'AdventureWorks区域分析', caption: '区域分析：按国家和渠道比较收入与估算毛利率，判断低毛利更接近地区差异，还是渠道及产品结构问题。' },
      { src: '/assets/adventureworks/model.png', alt: 'Power BI星型模型', caption: '数据模型：销售事实表连接日期、产品、地区与促销维表，为跨页面筛选和统一指标口径提供基础。' },
    ],
    links: [
      { label: '查看 GitHub', href: 'https://github.com/mfj0924-lab/adventureworks-business-analysis', kind: 'primary' },
      { label: '打开工作台报告', href: '/demos/adventureworks/report.html' },
      { label: '下载 Power BI 文件', href: '/downloads/AdventureWorks_经营分析.pbix', kind: 'download' },
    ],
  },
  {
    slug: 'workbench',
    name: '可信 AI 数据分析工作台',
    shortName: '可信分析工作台',
    type: '数据产品 × Agent 工作流',
    year: '2026',
    ai: 'Codex + ChatGPT-sol',
    question: 'AI能不能不只“生成一份分析”，还清楚交代数据是否可用、证据在哪里、结论为什么能信？',
    belief: '工作台记录数据、口径、证据、限制和发布决定，让分析结果能够被重新检查。',
    story: '我在阅读一篇讨论Data Agent风险的文章时，对其中一个问题产生了共鸣：企业把AI直接接到数据库以后，仍然需要回答数据口径是否一致、结论依据在哪里、谁批准结果发布。早期方案曾经计划把爬取、数据工程、分析、审核和报告全部交给一条Agent流程。继续调研以后，我把产品范围收缩到分析就绪数据进入BI之前的检查与报告过程，让现有分析工具继续完成擅长的工作。',
    shift: 'CitiBike成为工作台第一次完整的项目复核。初版界面输出了112条重复拒绝，专业词汇也让我很难快速判断问题的实际影响。这个使用过程直接推动新版修改：重复问题合并成总览；普通视图按“发生了什么、影响是什么、下一步怎么办”解释；系统规则、AI解释、人工确认和最终批准分别标明；绿色、黄色和红色状态说明当前结果能否使用。工作台保留专业证据，但普通用户不必先读完整技术报告才能知道下一步。',
    summary: '一个面向分析就绪数据的本地工作台：把模糊需求整理成Spec（任务说明书），根据风险选择探索、标准或治理模式，并按质量检查、分析、审查、AI解释和报告发布留下证据。',
    role: '个人产品设计与交付。本人定义使用场景、运行分档、证据规则、中文普通视图和验收标准；AI协助实现与测试。',
    aiCollaboration: [
      { title: '需求怎样从已有项目开始', text: '我先阅读朋友的HomeWork-PipeLine，并让AI继续查找数据流程、Agent分工和审查机制的开源项目。调研帮助我理解Spec、阶段依赖和执行记录，也让我看见原始设想包含了过多功能。' },
      { title: 'Codex与ChatGPT-sol怎样参与', text: 'Codex主要负责读取代码库、实现FastAPI、SQLite、DuckDB、Jinja2页面、测试和文档；ChatGPT-sol参与产品定位、使用流程和结果解释。我负责确定产品服务谁、哪些阶段保留、每种状态代表什么，以及哪些结果允许导出。' },
      { title: 'Skill与固定规则怎样进入项目', text: '前端修改会调用界面设计Skill，通俗解释会使用固定的中文表达规则。Skill负责提供可重复执行的检查方法；我根据实际使用反馈继续修改规则，例如要求专业术语第一次出现时立即解释，并为拒绝结果提供具体修改建议。' },
      { title: '当前Agent流程实现到哪里', text: '数值检查仍由固定代码完成，AI只解释已经生成的结果。Planner、Analyst、Reviewer和Reporter按顺序处理解释任务。当前版本没有实现多个Agent并行探索，也没有使用LangGraph或独立MCP Server。' },
    ],
    references: [
      { name: '86thAuspiciousVerse / HomeWork-PipeLine', href: 'https://github.com/86thAuspiciousVerse/HomeWork-PipeLine', relation: '参考了Spec提取、阶段执行和审核记录的组织方式。当前工作台聚焦分析输入、质量检查、结果审查和发布，并保留各阶段的证据与责任记录。' },
    ],
    tools: ['Python', 'FastAPI', 'Jinja2', 'SQLite', 'DuckDB', 'Pandas', 'LLM Adapter', 'HTML'],
    numbers: [
      { value: '3档', label: '探索/标准/治理模式' },
      { value: '5阶段', label: '质量到报告流程' },
      { value: '4种', label: '系统/AI/人工/批准责任' },
      { value: '3色', label: '可用/谨慎/暂不发布' },
    ],
    process: [
      { title: '输入合同', text: '先确认数据是什么、一行代表什么、指标怎么算、允许输出什么，避免AI边看边猜。' },
      { title: '任务分档', text: '探索模式快速找方向，标准模式完成日常分析，治理模式为高风险报告保留完整快照和审批。' },
      { title: '阶段执行', text: 'Quality检查数据，Analysis计算结果，Audit核验证据，AI负责解释，Report生成可阅读报告。' },
      { title: '责任分离', text: '明确标注系统规则发现、AI解释、人工确认与最终批准，避免把所有判断都包装成“AI说的”。' },
      { title: '普通视图', text: '默认用“发生了什么—影响是什么—下一步怎么办”解释专业输出，证据细节折叠保存。' },
    ],
    findings: [
      '稳定分析需要先固定输入、口径、证据和发布边界，再让AI解释检查结果和可能影响。',
      '同一套严格规则不适合所有任务；按风险、数据规模与用途分档，才能平衡时间、成本和可信度。',
      'CitiBike复核证明：工作台能发现实验设计疑点，但复杂判断仍需要人工理解业务后确认。',
    ],
    boundaries: [
      '当前是本地求职展示版，不是企业级多用户云平台。',
      '工作台接收分析就绪数据，不承担所有繁重的数据清洗工作。',
      '它提高的是“结果能否被检查和解释”，不能保证AI自动得到唯一正确结论。',
    ],
    images: [
      { src: '/assets/workbench/home.png', alt: '可信分析工作台首页', caption: '首页：创建分析任务，查看运行状态与历史记录。' },
      { src: '/assets/workbench/input-contract.png', alt: '工作台输入合同和运行模式', caption: '输入合同：先把数据、业务问题、用途和运行模式说清楚。' },
      { src: '/assets/citibike/audit-overview.png', alt: '工作台合并重复审查结果', caption: '普通视图：112条重复拒绝被合并成一条共性问题总览。' },
      { src: '/assets/citibike/report-warning.png', alt: '工作台报告状态提示', caption: '发布边界：关键证据不足时明确显示“暂不发布”。' },
    ],
    links: [
      { label: '查看 GitHub', href: 'https://github.com/mfj0924-lab/agent-analytics-workbench', kind: 'primary' },
      { label: '打开示例报告', href: '/demos/workbench/report.html' },
    ],
  },
  {
    slug: 'qingdao-transit',
    name: '青岛公交线路与换乘网络分析',
    shortName: '青岛公交网络',
    type: 'API采集 × 图网络分析',
    year: '2026',
    ai: 'Claude Code + DeepSeek Pro',
    question: '如何从公开地图API还原城市公交网络，并识别换乘结构与关键节点？',
    belief: '一条公交线路只是一条记录；站点之间建立关系以后，才出现网络。',
    story: '高德地图API返回线路名称、站点、坐标和轨迹，但它不会直接告诉我哪些站点承担更多换乘，也不会给出整座城市的网络结构。我先解决请求缓存、失败重试和重复记录，再把共同站点变成线路之间的连接，5,616个站点才进入同一张图。',
    shift: '地图展示空间位置，NetworkX处理节点与边，两者回答的问题不同。我把单条线路、全市分布、换乘网络和关键节点放进不同页面，避免一张“很密的地图”同时假装回答所有问题。现在它能展示结构，仍然不能代替包含班次、拥堵和步行时间的真实出行分析。',
    summary: '通过高德地图API采集公交线路和站点，完成缓存、重试、去重与结构化处理，再用NetworkX构建换乘网络，并输出交互地图与综合分析页面。',
    role: '个人完成。本人负责采集范围、网络构建口径、结果验证和展示结构；AI协助代码实现。',
    aiCollaboration: [
      { title: '我怎样把课程实例变成完整项目', text: '我先提供课程实例、目标城市和需要复现的分析结果，再与Claude Code和DeepSeek Pro讨论数据来源、采集范围、缓存方式、网络定义和展示页面。项目随后拆成API采集、数据整理、网络构建、指标计算和可视化。' },
      { title: 'AI负责哪些实现工作', text: 'Claude Code生成高德地图API请求、缓存、失败重试、数据清理、NetworkX网络构建、Folium地图和HTML展示代码；DeepSeek Pro参与技术路线与结果解释。' },
      { title: '我怎样检查网络是否建立正确', text: '我检查线路数、唯一站点数、线路轨迹和网络边数量，并分别查看单条线路地图、全市分布和换乘网络。地图用于检查空间位置，NetworkX用于计算站点连接与路径，两类结果分别保留。' },
      { title: '我怎样处理API与公开仓库', text: '高德地图密钥从代码中移除，仓库只保留环境变量配置方法、缓存数据处理逻辑、地图和报告。访问者可以查看现有产物，也可以使用自己的密钥重新采集。' },
    ],
    references: [],
    tools: ['Python', 'Amap API', 'Pandas', 'NetworkX', 'Folium', 'Plotly', 'HTML'],
    numbers: [
      { value: '874', label: '有效公交线路' },
      { value: '5,616', label: '唯一站点' },
      { value: '31万', label: '线路轨迹点' },
      { value: '25,929', label: '换乘网络边' },
    ],
    process: [
      { title: 'API采集', text: '按城市和线路请求公开地图数据，增加缓存、失败重试和请求节流，避免重复消耗额度。' },
      { title: '数据整理', text: '清理重复线路与站点，保留线路、站序、经纬度和轨迹，形成可复用的结构化数据。' },
      { title: '网络构建', text: '把站点看成节点、可换乘关系看成边，使用NetworkX计算连通性与路径特征。' },
      { title: '可视化', text: '使用Folium展示线路空间分布，使用Plotly和HTML展示网络规模、关键节点与换乘结果。' },
    ],
    findings: [
      '构建了包含5,616个站点和25,929条换乘关系的城市公交网络。',
      '平均路径长度约2.57，说明多数站点之间可通过较少换乘建立连接。',
      '数据采集、网络建模与地图展示形成了可复现的完整链路。',
    ],
    boundaries: [
      '结果受API返回范围、采集时间和线路变更影响，不等于实时公交调度系统。',
      '公开仓库不包含高德API密钥，使用者需通过环境变量自行配置。',
      '网络连通不等于实际出行体验，仍缺少班次、拥堵和步行时间。',
    ],
    images: [
      { src: '/assets/qingdao/map.png', alt: '青岛公交线路地图', caption: '线路地图：查看公交线路与站点在城市中的空间分布。' },
      { src: '/assets/qingdao/network.png', alt: '青岛公交网络分析页面', caption: '网络总览：集中展示网络规模、连通性与关键节点。' },
      { src: '/assets/qingdao/route.png', alt: '单条公交路线轨迹图', caption: '线路轨迹：检查具体线路的站点顺序和空间走向。' },
    ],
    links: [
      { label: '查看 GitHub', href: 'https://github.com/mfj0924-lab/qingdao-transit-network', kind: 'primary' },
      { label: '打开交互地图', href: '/demos/qingdao/maps/青岛公交网络可视化.html' },
      { label: '打开综合分析', href: '/demos/qingdao/maps/公交网络综合分析.html' },
      { label: '查看答辩展示', href: '/demos/qingdao/presentation.html' },
      { label: '下载项目报告', href: '/downloads/qingdao_transit_report.docx', kind: 'download' },
    ],
  },
  {
    slug: 'rnd-patent',
    name: '上市公司研发投入与专利数据整合',
    shortName: '研发与专利整合',
    type: '多源数据清洗 × 匹配验证',
    year: '2026',
    ai: 'Trae',
    question: '如何把来源和表头都不一致的研发投入、上市公司与专利数据整理成可分析的公司—年度面板？',
    belief: '每份文件都只差一点，恰好是这些差异让批量整合最费时间。',
    story: '研发投入、上市公司和专利数据来自不同文件，表头可能出现在不同位置，年份和公司名称也不完全统一。手工修一份表并不难，麻烦在于下一年、下一批文件还会出现新的“只差一点”。如果规则只对当前文件有效，合并完成也不能算真正完成。',
    shift: '我把表头位置、字段别名和匹配键整理成可识别规则，优先使用证券代码与年份连接，同时把重复键、缺失值、匹配率和未匹配记录单独输出。这样做以后，结果不再只有一张合并表，还能看见哪些数据没有进入分析，以及损失发生在哪里。',
    summary: '针对多文件、多表头和命名不统一问题，自动识别表头与字段，按证券代码和年份完成匹配，并对重复、缺失和匹配率进行验证。公开仓库使用合成样例，保护原数据授权。',
    role: '个人完成。本人定义匹配键、数据质量规则与输出结构，审核自动识别结果并完成最终验证。',
    aiCollaboration: [
      { title: '任务怎样被拆开', text: '我把课程要求、各批Excel文件和希望得到的公司—年度面板交给Trae，先讨论哪些字段必须统一、哪些键适合连接，以及需要怎样记录匹配失败。' },
      { title: 'Trae负责哪些工作', text: 'Trae生成文件扫描、表头探测、字段别名、批量读取、双键匹配和质量报告代码。我负责决定证券代码与年份作为主要匹配键，并检查自动识别是否误读说明行、合并单元格和多级表头。' },
      { title: '我怎样确认批量结果可以继续分析', text: '我检查重复键、缺失值、匹配率、异常年份和未匹配清单。程序能够输出合并表只代表代码完成运行；只有数据损失能够被定位，结果才适合进入后续分析。' },
      { title: '公开版本怎样保护原始资料', text: '真实课程数据受到授权限制，公开仓库使用结构一致的合成样例。代码、字段规则和测试可以公开，真实公司数据不随仓库发布。' },
    ],
    references: [],
    tools: ['Python', 'Pandas', 'Excel', '数据匹配', '质量检查', 'Trae'],
    numbers: [
      { value: '4.85万', label: '专利记录' },
      { value: '2.16万', label: '匹配研发记录' },
      { value: '12年', label: '2010—2021覆盖' },
      { value: '双键', label: '证券代码×年份' },
    ],
    process: [
      { title: '文件盘点', text: '识别不同年份、不同来源文件的结构差异，确定必须保留的字段与统一命名。' },
      { title: '表头识别', text: '自动探测真正的表头行，解决合并单元格、说明行和多级标题导致的读取问题。' },
      { title: '匹配整合', text: '以证券代码和年份为主键连接研发与专利数据，输出公司—年度分析表。' },
      { title: '质量验证', text: '检查重复键、缺失值、匹配率和异常年份，避免“合并成功”掩盖错配。' },
    ],
    findings: [
      '将零散文件整理为可复用的批处理流程，减少逐年手工调整表头的工作。',
      '双键匹配比仅按公司名称更稳定，能避开简称变化与同名风险。',
      '把匹配率和未匹配清单作为产物保留，让后续分析知道数据损失发生在哪里。',
    ],
    boundaries: [
      '真实原始数据受授权限制不公开，仓库只提供结构一致的合成样例。',
      '专利数量不直接等于创新质量，后续研究仍需加入专利类型、引用与行业背景。',
      '数据整合建立的是相关分析基础，不自动证明研发投入带来专利增长。',
    ],
    images: [],
    links: [
      { label: '查看 GitHub', href: 'https://github.com/mfj0924-lab/rnd-patent-data-integration', kind: 'primary' },
    ],
  },
];

export const getProject = (slug: string) => projects.find((project) => project.slug === slug);
