import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputDir = resolve(root, '..', '个人网站资料');
const htmlOutput = join(outputDir, 'Tomme_个人网站文案离线校对.html');
const markdownOutput = join(outputDir, 'Tomme_个人网站文案初稿.md');

const pages = [
  ['首页', 'dist/index.html'],
  ['分析方法', 'dist/method/index.html'],
  ['AI协作', 'dist/ai-collaboration/index.html'],
  ['关于我', 'dist/about/index.html'],
  ['项目｜CitiBike', 'dist/projects/citibike/index.html'],
  ['项目｜AdventureWorks', 'dist/projects/adventureworks/index.html'],
  ['项目｜可信分析工作台', 'dist/projects/workbench/index.html'],
  ['项目｜青岛公交网络', 'dist/projects/qingdao-transit/index.html'],
  ['项目｜研发与专利整合', 'dist/projects/rnd-patent/index.html'],
];

const decode = (value) => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n[ \t]+/g, '\n')
  .replace(/[ \t]{2,}/g, ' ')
  .trim();

const labelByTag = { h1: '主标题', h2: '章节标题', h3: '小标题', p: '正文', li: '列表项', blockquote: '判断句', figcaption: '图片说明' };
const data = pages.map(([title, file], pageIndex) => {
  const source = readFileSync(join(root, file), 'utf8');
  const main = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? source;
  const clean = main.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const blocks = [];
  const pattern = /<(h1|h2|h3|p|li|blockquote|figcaption)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of clean.matchAll(pattern)) {
    const tag = match[1].toLowerCase();
    const text = decode(match[2]);
    if (!text || text.length < 2) continue;
    if (blocks.some((block) => block.text === text && block.tag === tag)) continue;
    blocks.push({ id: `p${pageIndex}-b${blocks.length}`, tag, label: labelByTag[tag], text });
  }
  return { id: `page-${pageIndex}`, title, blocks };
});

const markdown = data.map((page) => {
  const body = page.blocks.map((block) => {
    if (block.tag === 'h1') return `# ${block.text}`;
    if (block.tag === 'h2') return `## ${block.text}`;
    if (block.tag === 'h3') return `### ${block.text}`;
    if (block.tag === 'li') return `- ${block.text}`;
    if (block.tag === 'blockquote') return `> ${block.text}`;
    return block.text;
  }).join('\n\n');
  return `# 页面：${page.title}\n\n${body}`;
}).join('\n\n---\n\n');

const escapedData = JSON.stringify(data).replace(/</g, '\\u003c');
const clientScript = readFileSync(join(root, 'scripts/copy-review-client.js'), 'utf8').replace('__INITIAL_PAGES__', escapedData);
const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Tomme｜个人网站文案离线校对</title>
  <style>
    :root{--ink:#10192b;--muted:#59677d;--line:#d8e0ec;--paper:#f4f7fb;--white:#fff;--blue:#285cff;--blue-soft:#e7edff;--coral:#ff674d;--yellow:#ffd65a;--radius:14px;font-family:"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);line-height:1.7}button,input{font:inherit}button{cursor:pointer}.app{max-width:1180px;margin:auto;padding:24px}.hero{padding:32px 0 24px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end;border-bottom:1px solid var(--line)}h1{max-width:12ch;margin:0;font-size:clamp(2.4rem,7vw,5rem);line-height:1.02;letter-spacing:-.04em}.hero p{max-width:65ch;margin:18px 0 0;color:var(--muted)}.status{padding:10px 12px;color:#16398e;background:var(--blue-soft);border-radius:10px;font-size:.82rem;font-weight:800}.toolbar{position:sticky;top:0;z-index:10;margin:0 -12px;padding:12px;display:flex;gap:8px;overflow-x:auto;background:rgba(244,247,251,.96);border-bottom:1px solid var(--line);backdrop-filter:blur(12px)}.toolbar button,.import-label{flex:0 0 auto;padding:9px 12px;color:var(--ink);background:var(--white);border:1px solid var(--line);border-radius:10px;font-weight:750}.toolbar .primary{color:#fff;background:var(--blue);border-color:var(--blue)}.toolbar .danger{color:#a42519}.import-label input{display:none}.filters{padding:18px 0;display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:10px}.filters input{width:100%;padding:12px 14px;background:#fff;border:1px solid var(--line);border-radius:10px}.page-nav{display:flex;gap:8px;overflow-x:auto;padding:0 0 18px}.page-nav button{flex:0 0 auto;padding:8px 12px;color:var(--muted);background:transparent;border:0;border-bottom:2px solid transparent}.page-nav button.active{color:var(--blue);border-color:var(--blue);font-weight:850}.page{display:none}.page.active{display:block}.page-head{padding:36px 0 20px;display:flex;justify-content:space-between;align-items:end;gap:16px}.page-head h2{margin:0;font-size:clamp(1.8rem,5vw,3.3rem);line-height:1.1}.page-head span{color:var(--muted);font-size:.82rem}.copy-list{display:grid;gap:14px}.copy-block{display:grid;grid-template-columns:86px 1fr;gap:14px;padding:16px 0;border-top:1px solid var(--line)}.kind{padding-top:12px;color:var(--muted);font-size:.75rem;font-weight:800}.editable{min-height:52px;padding:11px 12px;background:#fff;border:1px solid transparent;border-radius:10px;outline:none;white-space:pre-wrap}.editable:hover{border-color:#b8c4d7}.editable:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(40,92,255,.12)}.copy-block.changed .kind{color:var(--coral)}.copy-block.changed .editable{background:#fff8f5;border-color:#ffc2b7}.original{display:none;margin:8px 0 0;padding:8px 12px;color:var(--muted);background:#edf1f7;border-radius:8px;font-size:.78rem}.copy-block.changed .original{display:block}.empty{padding:60px 0;color:var(--muted);text-align:center}.help{margin:50px 0 20px;padding:22px;color:#fff;background:var(--ink);border-radius:14px}.help strong{color:var(--yellow)}.help p{margin:.4rem 0}.toast{position:fixed;right:18px;bottom:18px;z-index:30;max-width:320px;padding:12px 14px;color:#fff;background:var(--ink);border-radius:10px;box-shadow:0 16px 40px rgba(16,25,43,.25);opacity:0;transform:translateY(12px);pointer-events:none;transition:.2s}.toast.show{opacity:1;transform:none}
    @media(max-width:700px){.app{padding:16px}.hero{grid-template-columns:1fr}.toolbar{margin-inline:-16px;padding-inline:16px}.filters{grid-template-columns:1fr}.copy-block{grid-template-columns:1fr;gap:2px}.kind{padding-top:0}.editable{font-size:1rem}.page-head{align-items:start;flex-direction:column}.help{border-radius:10px}}
  </style>
</head>
<body>
  <!-- THESIS: 这是一份可以带上火车、离线修改并完整交回的网站文案校对本。界面服务于逐段阅读和修改，不模拟正式网站。 -->
  <main class="app">
    <header class="hero"><div><h1>把网站里的话，重新变成我的话。</h1><p>点击任意白色文字块即可修改。修改稿会尽量自动保存在当前浏览器；下车前请务必导出JSON或Markdown，再把文件发回电脑。</p></div><div class="status" data-status>尚未修改</div></header>
    <div class="toolbar" aria-label="文案操作">
      <button class="primary" type="button" data-export-json>导出修改稿 JSON</button>
      <button type="button" data-export-md>导出 Markdown</button>
      <button type="button" data-copy>复制全部</button>
      <label class="import-label">导入修改稿<input type="file" accept="application/json,.json" data-import /></label>
      <button class="danger" type="button" data-reset>撤销全部修改</button>
    </div>
    <div class="filters"><input type="search" data-search placeholder="搜索某句话、项目或关键词" aria-label="搜索文案" /><button type="button" data-only-changed>只看已修改：关</button></div>
    <nav class="page-nav" data-page-nav aria-label="页面目录"></nav>
    <div data-pages></div>
    <aside class="help"><strong>在手机上怎么用</strong><p>1. 直接点文字修改；2. 某段变成浅红色，代表它已被改过；3. 每隔一段时间导出一次JSON；4. 最后把JSON发给我，我可以准确替换回网站。</p><p>如果浏览器提示不能自动保存，不影响编辑，但一定要手动导出。</p></aside>
  </main>
  <div class="toast" role="status" aria-live="polite" data-toast></div>
  <script>${clientScript}</script>
</body>
</html>`;

mkdirSync(dirname(htmlOutput), { recursive: true });
writeFileSync(htmlOutput, html, 'utf8');
writeFileSync(markdownOutput, markdown, 'utf8');
console.log(`HTML: ${htmlOutput}`);
console.log(`Markdown: ${markdownOutput}`);
console.log(`Pages: ${data.length}; blocks: ${data.reduce((sum, page) => sum + page.blocks.length, 0)}`);
