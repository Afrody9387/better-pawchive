const dictionary: Record<string, string> = {
  'Home': '首页', 'Creators': '作者', 'Search': '搜索', 'Recent': '最近更新', 'Random': '随机',
  'Posts': '帖子', 'DMs': '私信', 'Popular': '热门', 'Hash Lookup': '哈希查询', 'Tags': '标签',
  'Importer': '导入工具', 'Import': '导入', 'FAQ': '常见问题', 'Account': '账号',
  'Favorites': '关注与收藏', 'Keys': '密钥', 'Review DMs': '审核私信', 'Logout': '退出登录',
  'Login': '登录', 'Register': '注册', 'Register!': '注册！', 'Community': '社区',
  'Upload file': '上传文件', 'Favorite': '关注', 'Unfavorite': '取消关注',
  'Announcements': '公告', 'Linked Accounts': '关联账号', 'Similar Artists': '相似作者',
  'Service': '平台', 'All': '全部', 'All services': '全部平台', 'Popularity': '热度',
  'Date Indexed': '收录时间', 'Date Updated': '更新时间', 'Alphabetical Order': '名称顺序',
  'Filters': '筛选', 'AI-generated': 'AI 生成', 'Show': '显示', 'Hide': '隐藏', 'Only': '仅显示',
  'Username:': '用户名：', 'Password:': '密码：', 'Username': '用户名', 'Password': '密码',
  'Confirm password': '确认密码', 'Confirm Password:': '确认密码：',
  'Submit': '提交', 'Save': '保存', 'Cancel': '取消', 'Close': '关闭', 'Next': '下一页',
  'Previous': '上一页', 'First': '第一页', 'Last': '最后一页',
  'search for creators...': '搜索作者…', 'search for posts...': '搜索帖子…',
  'Search creators': '搜索作者', 'Search posts': '搜索帖子',
  'No artists found for your query.': '没有找到匹配的作者。', 'No posts found.': '没有找到帖子。',
  'No attachments': '无附件', 'Contact': '联系', '[Contact]': '[联系]',
  "Don't have an account?": '还没有账号？', 'Your favorites will automatically be saved.': '你的关注与收藏会自动保存。',
  'is only available to registered users.': '仅对已注册用户开放。',
  'Visit the': '已有账号，请前往', 'login page': '登录页面', 'if you have an account.': '登录。',
  'Otherwise visit the': '没有账号，请前往', 'registration page': '注册页面', 'to create one.': '创建账号。',
};

export function translateSiteLabel(value: string): string {
  const text = value.trim();
  let translated = dictionary[text];
  if (!translated) {
    const linked = text.match(/^Linked Accounts\s*\((\d+)\)$/);
    const showing = text.match(/^Showing\s+(\d+)\s*-\s*(\d+)\s+of\s+(\d+)$/);
    const attachments = text.match(/^(\d+) attachments?$/);
    if (linked) translated = `关联账号（${linked[1]}）`;
    else if (showing) translated = `显示 ${showing[1]}–${showing[2]}，共 ${showing[3]} 条`;
    else if (attachments) translated = `${attachments[1]} 个附件`;
  }
  if (!translated) return value;
  return value.replace(text, translated);
}

// HTMX can cache translated HTML. Marked control roots allow restoration after
// a history snapshot replaces the original DOM nodes.
function restoreSiteLabel(value: string): string {
  const text = value.trim();
  let original = Object.keys(dictionary).find(key => dictionary[key] === text);
  const linked = text.match(/^关联账号（(\d+)）$/);
  const showing = text.match(/^显示 (\d+)–(\d+)，共 (\d+) 条$/);
  const attachments = text.match(/^(\d+) 个附件$/);
  if (linked) original = `Linked Accounts (${linked[1]})`;
  else if (showing) original = `Showing ${showing[1]} - ${showing[2]} of ${showing[3]}`;
  else if (attachments) original = `${attachments[1]} attachment${attachments[1] === '1' ? '' : 's'}`;
  return original ? value.replace(text, original) : value;
}

// Scope translations to site controls, never blanket-translate #main.
const roots = '.global-sidebar, .global-header, .global-footer, footer:not(.post-card__footer), .tabs, .user-header__actions, .search-form, .pagination, .paginator, .paginator-wrapper, .post__actions, .post__nav, .post-card__footer, .site-section__heading, .hide-tags-filter, .tooltip, .tooltip__message--register, #main form, main form';
const excluded = 'script, style, textarea, code, pre, [contenteditable], .user-header__name, .user-card__name, .post-card__header, .post__title, .post__content, .post__body, .comment, .announcement__content, .bck-quick-follow, .bck-follow-status';

type TextRecord = { original: string; translated: string };
type AttributeRecord = { original: string; translated: string };

export function setupPageTranslation(doc: Document, enabled: () => boolean): { refresh: () => void; dispose: () => void } {
  const texts = new Map<Text, TextRecord>();
  const attributes = new Map<Element, Map<string, AttributeRecord>>();
  let disposed = false;
  let scheduled = false;
  const win = doc.defaultView!;

  function restore(): void {
    texts.forEach((record, node) => { if (node.data === record.translated) node.data = record.original; });
    attributes.forEach((records, element) => records.forEach((record, name) => {
      if (element.getAttribute(name) === record.translated) element.setAttribute(name, record.original);
    }));
    texts.clear(); attributes.clear();
    doc.querySelectorAll('[data-bck-site-translated]').forEach(root => {
      const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Text;
      while ((node = walker.nextNode() as Text)) {
        if (!node.parentElement?.closest(excluded)) node.data = restoreSiteLabel(node.data);
      }
      [root, ...Array.from(root.querySelectorAll('[placeholder], [title], [aria-label]'))].forEach(element => {
        if (element.closest(excluded)) return;
        for (const name of ['placeholder', 'title', 'aria-label']) {
          const value = element.getAttribute(name);
          if (value != null) element.setAttribute(name, restoreSiteLabel(value));
        }
      });
      root.removeAttribute('data-bck-site-translated');
    });
  }

  function refresh(): void {
    if (disposed) return;
    if (!enabled()) { restore(); return; }
    // Do not retain removed HTMX pages in memory.
    texts.forEach((_, node) => { if (!node.isConnected) texts.delete(node); });
    attributes.forEach((_, element) => { if (!element.isConnected) attributes.delete(element); });
    doc.querySelectorAll(roots).forEach(root => {
      const cached = root.hasAttribute('data-bck-site-translated');
      const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Text;
      while ((node = walker.nextNode() as Text)) {
        if (node.parentElement?.closest(excluded)) continue;
        const previous = texts.get(node);
        if (previous && node.data === previous.translated) continue;
        const original = cached ? restoreSiteLabel(node.data) : node.data;
        const translated = translateSiteLabel(original);
        if (translated !== original) { texts.set(node, { original, translated }); node.data = translated; }
        else texts.delete(node);
      }
      const elements = [root, ...Array.from(root.querySelectorAll('[placeholder], [title], [aria-label]'))];
      elements.forEach(element => {
        if (element.closest(excluded)) return;
        for (const name of ['placeholder', 'title', 'aria-label']) {
          const value = element.getAttribute(name);
          if (value == null) continue;
          const records = attributes.get(element) || new Map<string, AttributeRecord>();
          if (value === records.get(name)?.translated) continue;
          const original = cached ? restoreSiteLabel(value) : value;
          const translated = translateSiteLabel(original);
          if (translated !== original) {
            records.set(name, { original, translated }); attributes.set(element, records);
            element.setAttribute(name, translated);
          } else records.delete(name);
        }
      });
      root.setAttribute('data-bck-site-translated', 'true');
    });
  }
  const observer = new win.MutationObserver(() => {
    if (scheduled || disposed) return;
    scheduled = true;
    win.queueMicrotask(() => { scheduled = false; refresh(); });
  });
  observer.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  refresh();
  return { refresh, dispose: () => { disposed = true; observer.disconnect(); restore(); } };
}
