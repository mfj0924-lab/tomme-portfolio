import { projects } from './projects';
import { sitePath } from '../utils/sitePath';
import { projectProcesses } from './preview-processes';
export const projectVisuals = [
 {name:'CitiBike',title:'需求预测与动态定价',kind:'bike',color:'#d9e8ee',ink:'#173a4a',spot:'#fa693d',label:'从骑行记录，到站点供需与定价建议。',tags:'数据处理 / 预测模型 / API',image:'citibike/legacy-dashboard.png',href:'citibike'},
 {name:'AdventureWorks',title:'经营分析',kind:'business',color:'#f3dfce',ink:'#593d2f',spot:'#e88446',label:'销售规模之外，继续看盈利质量。',tags:'SQL / Power BI / 商业判断',image:'adventureworks/overview.png',href:'adventureworks'},
 {name:'AI 工作台',title:'可信数据分析',kind:'agent',color:'#dfe5cf',ink:'#34462c',spot:'#b2c65a',label:'让任务、检查与判断都有据可查。',tags:'Agent / 数据产品 / 结果审查',image:'workbench/home.png',href:'workbench'},
 {name:'青岛公交',title:'线路与换乘网络',kind:'transit',color:'#e2dff0',ink:'#493c68',spot:'#a295cb',label:'沿着站点，理解线路之间的关系。',tags:'API 采集 / 地图 / NetworkX',image:'qingdao/network.png',href:'qingdao-transit'},
 {name:'研发与专利',title:'多源数据整合',kind:'patent',color:'#eddfbd',ink:'#594922',spot:'#d4a645',label:'把不同来源，整理成可研究的数据。',tags:'实体匹配 / 公司 × 年份',image:null,href:'rnd-patent'},
];

// Approved project content shared by the public pages and compatible preview URLs.
export const portfolioProjects = projects.map(p => ({...p,
 ...(p.slug==='workbench'?{
  summary:'一个面向分析就绪数据的本地工作台：确认任务说明，根据风险选择探索、标准或治理模式，依次完成质量检查、分析、审查和报告；AI 解释由用户另行触发，发布与导出按相应规则确认。',
  numbers:p.numbers.map(n=>n.label==='质量到报告流程'?{value:'4阶段',label:'质量、分析、审查、报告'}:n),
 }:{}),
 ...(p.slug==='qingdao-transit'?{
  story:'高德地图 API 提供公交线路、站点、坐标和轨迹。我把线路、站点与轨迹分别整理后，用地图查看城市中的空间分布，再按共同站名建立线路之间的连接。项目采集得到 874 条有效线路和 5,616 个唯一站点；网络分析进一步说明哪些线路可以直接换乘，以及线路之间的可达关系。',
  shift:'地图用于查看站点与线路的位置，NetworkX 用于计算线路之间的连接与路径。单条线路、全市分布、换乘网络和综合指标分别展示，读者可以根据问题选择页面。班次、拥堵和步行时间需要额外数据支持，现有分析聚焦线路连接结构。',
  findings:[
   '采集数据包含 874 条有效线路、5,616 个唯一站点；换乘网络以线路为节点，按共同站名建立连接，记录了 25,929 条线路间连接。',
   '原项目记录的平均路径长度约为 2.57。这个指标对应线路节点之间的连接步数，代码在网络不完全连通时使用最大连通部分计算。',
   '交互地图、综合分析和答辩展示分别保留空间位置、网络指标与过程说明，相关代码和数据脚本可以继续核对。',
  ],
  aiCollaboration:p.aiCollaboration.map(item=>({...item,text:item.text.replace('NetworkX用于计算站点连接与路径','NetworkX用于计算线路连接与路径')})),
 }:{}),
 process:projectProcesses[p.slug as keyof typeof projectProcesses],
 visual:projectVisuals.find(v=>v.href===p.slug)!,
}));
// Public navigation uses the canonical routes; /preview/ remains a compatible entry.
export const previewPath = (path='') => sitePath('/'+path);
