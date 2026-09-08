import type {FlowNode,FlowEdge} from '../data/preview-flows';
export function initWorkflow(){
 const host=document.querySelector<HTMLElement>('[data-workflow]');if(!host)return;
 const one=<T extends HTMLElement=HTMLElement>(s:string)=>host.querySelector<T>(s)!;
 const all=(s:string)=>Array.from(host.querySelectorAll<HTMLElement>(s));
 const graph=JSON.parse(one('.workflow-data').textContent!) as {nodes:FlowNode[];edges:FlowEdge[];width:number;height:number;defaultView:string};
 const canvas=one('.workflow-canvas'),world=one('.workflow-world');
 let scale=1,x=0,y=0,selected=0;const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 function paint(){world.style.transform=`translate(${x}px,${y}px) scale(${scale})`}
 function fit(){scale=Math.min(canvas.clientWidth/graph.width,canvas.clientHeight/graph.height,.95);x=(canvas.clientWidth-graph.width*scale)/2;y=(canvas.clientHeight-graph.height*scale)/2;paint()}
 function focus(index:number){const n=graph.nodes[index];scale=Math.min(innerWidth<761?.88:1,canvas.clientWidth/310);x=canvas.clientWidth/2-(n.x+115)*scale;y=canvas.clientHeight/2-(n.y+61)*scale;paint()}
 function zoom(ratio:number,cx=canvas.clientWidth/2,cy=canvas.clientHeight/2){const next=clamp(scale*ratio,.12,2.5);x=cx-(cx-x)*next/scale;y=cy-(cy-y)*next/scale;scale=next;paint()}
 function select(index:number,move=false){
  selected=index;const node=graph.nodes[index];
  all('[data-flow-step]').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index))});
  host.querySelectorAll<SVGPathElement>('[data-edge-from]').forEach(p=>{p.classList.toggle('active',p.dataset.edgeFrom===node.id||p.dataset.edgeTo===node.id)});
  const original=one(`[data-step-id="${CSS.escape(node.stepId)}"]`);
  one('#workflow-title').textContent=original.querySelector('h3')!.textContent;
  // Clone the already-rendered, escaped content; both views keep identical paragraphs and links.
  one('#workflow-text').replaceChildren(original.querySelector('.process-body')!.cloneNode(true));
  if(move)focus(index);
 }
 function changeView(view:string){const useCanvas=view==='canvas';host.dataset.view=view;canvas.hidden=!useCanvas;one('.workflow-reading').hidden=useCanvas;one('.workflow-selected').hidden=!useCanvas;one('.workflow-zoom').hidden=!useCanvas;all('[data-flow-view]').forEach(b=>{const active=b.dataset.flowView===view;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});if(useCanvas)requestAnimationFrame(()=>innerWidth<761?focus(selected):fit())}
 // Remember each step's disclosure while switching views or returning to a graph node.
 // Native details/summary still works when JavaScript is unavailable.
 host.addEventListener('toggle',event=>{
  const details=event.target;
  if(!(details instanceof HTMLDetailsElement)||!details.matches('.process-details')||!host.contains(details))return;
  host.querySelectorAll<HTMLDetailsElement>(`.process-details[data-process-step="${CSS.escape(details.dataset.processStep!)}"]`).forEach(other=>{
   if(other!==details&&other.open!==details.open)other.open=details.open;
  });
 },true);
 all('[data-flow-view]').forEach(b=>b.addEventListener('click',()=>changeView(b.dataset.flowView!)));
 all('[data-flow-zoom]').forEach(b=>b.addEventListener('click',()=>b.dataset.flowZoom==='fit'?fit():zoom(b.dataset.flowZoom==='in'?1.2:1/1.2)));
 all('[data-flow-step]').forEach((b,i)=>b.addEventListener('click',()=>select(i)));
 // Follow outgoing process edges; support edges never masquerade as the next execution stage.
 one('#trace-flow').addEventListener('click',()=>{const next=graph.edges.find(e=>e.from===graph.nodes[selected].id&&e.kind!=='support');select(next?graph.nodes.findIndex(n=>n.id===next.to):0,true)});
 canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(Math.exp(-clamp(e.deltaY,-150,150)*.002),e.clientX-r.left,e.clientY-r.top)},{passive:false});
 const pointers=new Map<number,{x:number;y:number}>();
 canvas.addEventListener('pointerdown',e=>{if(e.button!==1&&(e.target as Element).closest('button'))return;if(e.button>1)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{const previous=pointers.get(e.pointerId);if(!previous)return;if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)![1],before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y),r=canvas.getBoundingClientRect();if(before>3)zoom(after/before,(e.clientX+other.x)/2-r.left,(e.clientY+other.y)/2-r.top)}else{x+=e.clientX-previous.x;y+=e.clientY-previous.y;paint()}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,e=>pointers.delete((e as PointerEvent).pointerId)));
 canvas.addEventListener('keydown',e=>{if(e.target!==canvas)return;if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='+'||e.key==='=')zoom(1.2);if(e.key==='-')zoom(1/1.2);if(e.key==='0')fit();if(e.key.startsWith('Arrow')){x+=e.key==='ArrowLeft'?40:e.key==='ArrowRight'?-40:0;y+=e.key==='ArrowUp'?40:e.key==='ArrowDown'?-40:0;paint()}});
 new ResizeObserver(()=>{if(!canvas.hidden)innerWidth<761?focus(selected):fit()}).observe(canvas);
 select(0);changeView(graph.defaultView);
}
