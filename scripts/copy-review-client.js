const initialPages = __INITIAL_PAGES__;
const storageKey = 'tomme-copy-review-v1';
const state = { edits: {}, activePage: initialPages[0].id, onlyChanged: false, query: '' };
const toast = document.querySelector('[data-toast]');
const say = (message) => { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800); };
const safeLoad = () => { try { Object.assign(state, JSON.parse(localStorage.getItem(storageKey) || '{}')); } catch {} };
const safeSave = () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; } catch { return false; } };
safeLoad();

const pagesRoot = document.querySelector('[data-pages]');
const navRoot = document.querySelector('[data-page-nav]');
const currentText = (block) => state.edits[block.id] ?? block.text;
const findBlock = (id) => initialPages.flatMap((page) => page.blocks).find((block) => block.id === id);
const changedCount = () => Object.keys(state.edits).filter((id) => state.edits[id] !== findBlock(id)?.text).length;
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const updateStatus = () => {
  const count = changedCount();
  document.querySelector('[data-status]').textContent = count ? `已修改 ${count} 段` : '尚未修改';
};

const render = () => {
  navRoot.innerHTML = initialPages.map((page) => `<button type="button" data-page-id="${page.id}" class="${page.id === state.activePage ? 'active' : ''}">${page.title}</button>`).join('');
  pagesRoot.innerHTML = initialPages.map((page) => {
    const blocks = page.blocks.filter((block) => {
      const text = currentText(block);
      const changed = text !== block.text;
      return (!state.onlyChanged || changed) && (!state.query || text.toLowerCase().includes(state.query.toLowerCase()) || page.title.toLowerCase().includes(state.query.toLowerCase()));
    });
    const content = blocks.length ? blocks.map((block) => {
      const text = currentText(block);
      const changed = text !== block.text;
      return `<article class="copy-block ${changed ? 'changed' : ''}" data-block="${block.id}"><div class="kind">${block.label}${changed ? ' · 已改' : ''}</div><div><div class="editable" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true" data-edit="${block.id}">${escapeHtml(text)}</div><p class="original"><strong>原文：</strong>${escapeHtml(block.text)}</p></div></article>`;
    }).join('') : '<p class="empty">当前条件下没有文案。</p>';
    return `<section class="page ${page.id === state.activePage ? 'active' : ''}" data-page="${page.id}"><header class="page-head"><h2>${page.title}</h2><span>${blocks.length} 段文案</span></header><div class="copy-list">${content}</div></section>`;
  }).join('');
  updateStatus();
};

document.addEventListener('click', (event) => {
  const pageButton = event.target.closest('[data-page-id]');
  if (!pageButton) return;
  state.activePage = pageButton.dataset.pageId;
  safeSave();
  render();
  window.scrollTo({ top: 190, behavior: 'smooth' });
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-search]')) {
    state.query = event.target.value;
    render();
    const search = document.querySelector('[data-search]');
    search.value = state.query;
    search.focus();
    return;
  }
  const editable = event.target.closest('[data-edit]');
  if (!editable) return;
  const id = editable.dataset.edit;
  const original = findBlock(id)?.text || '';
  const value = editable.innerText.trim();
  if (value === original) delete state.edits[id]; else state.edits[id] = value;
  editable.closest('.copy-block').classList.toggle('changed', value !== original);
  safeSave();
  updateStatus();
});

document.querySelector('[data-only-changed]').addEventListener('click', (event) => {
  state.onlyChanged = !state.onlyChanged;
  event.currentTarget.textContent = `只看已修改：${state.onlyChanged ? '开' : '关'}`;
  safeSave();
  render();
});

const download = (name, type, content) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const markdownText = () => initialPages.map((page) => {
  const body = page.blocks.map((block) => {
    const text = currentText(block);
    if (block.tag === 'h1') return `# ${text}`;
    if (block.tag === 'h2') return `## ${text}`;
    if (block.tag === 'h3') return `### ${text}`;
    if (block.tag === 'li') return `- ${text}`;
    if (block.tag === 'blockquote') return `> ${text}`;
    return text;
  }).join('\n\n');
  return `# 页面：${page.title}\n\n${body}`;
}).join('\n\n---\n\n');

document.querySelector('[data-export-json]').addEventListener('click', () => {
  download('Tomme_网站文案修改稿.json', 'application/json', JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), edits: state.edits, pages: initialPages }, null, 2));
  say('修改稿已导出');
});
document.querySelector('[data-export-md]').addEventListener('click', () => { download('Tomme_网站文案修改稿.md', 'text/markdown;charset=utf-8', markdownText()); say('Markdown已导出'); });
document.querySelector('[data-copy]').addEventListener('click', async () => { try { await navigator.clipboard.writeText(markdownText()); say('全部文案已复制'); } catch { say('浏览器不允许复制，请导出Markdown'); } });
document.querySelector('[data-import]').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try { const imported = JSON.parse(await file.text()); state.edits = imported.edits || {}; safeSave(); render(); say('修改稿已导入'); }
  catch { say('文件无法识别，请选择导出的JSON'); }
});
document.querySelector('[data-reset]').addEventListener('click', () => {
  if (!confirm('确定撤销所有修改吗？此操作无法恢复。')) return;
  state.edits = {};
  safeSave();
  render();
  say('已恢复原稿');
});

render();
