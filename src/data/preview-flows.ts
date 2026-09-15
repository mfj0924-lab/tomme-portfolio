import type {ProcessStep} from './preview-processes';
// Graph geometry references the same complete steps used by the reading view.
export type FlowNode={id:string;stepId:string;title:string;text:string;x:number;y:number;group?:string};
export type FlowEdge={from:string;to:string;kind?:'support'};
export function flowFor(slug:string,steps:ProcessStep[]){
 const node=(stepId:string,x:number,y:number,group?:string,id=stepId,title?:string):FlowNode=>{
  const step=steps.find(s=>s.id===stepId);
  if(!step)throw new Error(`Missing process step: ${slug}/${stepId}`);
  return {id,stepId,title:title||step.title,text:step.text,x,y,group};
 };
 let nodes:FlowNode[]=steps.map((s,i)=>node(s.id,32+i*300,74));
 let edges:FlowEdge[]=steps.slice(1).map((s,i)=>({from:steps[i].id,to:s.id}));
 let width=steps.length*300+24,height=330;
 const defaultView=['citibike','adventureworks','workbench'].includes(slug)?'illustrated':slug==='rnd-patent'?'canvas':'read';
 if(slug==='workbench'){
  nodes=[
   node('input',32,35,'运行准备',undefined,'确认任务说明'),
   node('mode',332,35,'运行准备',undefined,'选择任务分档'),
   node('quality',32,255,'主要阶段',undefined,'质量检查'),
   node('analysis',332,255,'主要阶段',undefined,'计算数据结果'),
   node('audit',632,255,'主要阶段',undefined,'结果审查'),
   node('report',932,255,'主要阶段',undefined,'生成报告'),
   node('publish',1232,255,'按规则确认',undefined,'批准与导出'),
   node('explain',632,475,'用户另行触发',undefined,'可选 AI 解释'),
  ];
  edges=[{from:'input',to:'mode'},{from:'mode',to:'quality'},
   {from:'quality',to:'analysis'},{from:'analysis',to:'audit'},
   {from:'audit',to:'report'},{from:'report',to:'publish'},
   {from:'audit',to:'explain',kind:'support'}];
  width=1510;height=685;
 }else if(slug==='rnd-patent'){
  nodes=[
   node('input',32,35,'输入','rnd','研发投入主表'),
   node('input',32,275,'输入','patent','年度专利文件'),
   node('headers',332,155,undefined,undefined,'识别表头'),
   node('keys',632,155,undefined,undefined,'统一代码与年份'),
   node('merge',932,155,undefined,undefined,'按公司与年份匹配'),
   node('verify',1232,155,'输出与核对',undefined,'核验与导出'),
  ];
  edges=[{from:'rnd',to:'headers'},{from:'patent',to:'headers'},
   {from:'headers',to:'keys'},{from:'keys',to:'merge'},{from:'merge',to:'verify'}];
  width=1510;height=500;
 }
 return {nodes,edges,width,height,defaultView};
}
