/** The stationary letter slot receives hover; only its glyph moves. */
export function initTitleHover(){
 document.querySelectorAll<HTMLElement>('.home-copy h1,.page-heading h1,.project-heading h1').forEach(title=>{
  if(title.hasAttribute('data-hover-title')||title.classList.contains('particle-name'))return;
  const readable=title.cloneNode(true) as HTMLElement;
  readable.querySelectorAll('[aria-hidden="true"]').forEach(el=>el.remove());
  title.setAttribute('aria-label',readable.textContent?.trim()||'');
  const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT,{
   acceptNode(node){return node.parentElement?.closest('[aria-hidden="true"]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}
  });
  const nodes:Text[]=[];while(walker.nextNode())nodes.push(walker.currentNode as Text);
  for(const node of nodes){
   if(!node.textContent?.trim())continue;
   const run=document.createElement('span');run.className='title-run';run.setAttribute('aria-hidden','true');
   // Keep Latin words together when they fit, but allow long project names to wrap on phones.
   for(const token of node.textContent.split(/([A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*)/g)){
    const word=/^[A-Za-z0-9]/.test(token)?document.createElement('span'):null;
    if(word){word.className='title-word';run.append(word)}
    const parent=word||run;
    for(const char of Array.from(token)){
     if(/\s/.test(char)){parent.append(document.createTextNode(char));continue}
     const slot=document.createElement('span'),glyph=document.createElement('span');
     slot.className='title-letter';glyph.className='title-glyph';glyph.textContent=char;
     slot.append(glyph);parent.append(slot);
    }
   }
   node.replaceWith(run);
  }
  title.setAttribute('data-hover-title','');
 });
}
