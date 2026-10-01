export type Language = 'en' | 'zh';
let language: Language = 'en';
let translatePawchive = true;
const listeners = new Set<() => void>();
let initialized: Promise<void> | null = null;

const zh: Record<string, string> = {
  'Home': '首页', 'Artists': '作者', 'Posts': '帖子', 'Settings': '设置',
  'Overview': '概览', 'Summary of your tracked data': '浏览记录概览',
  'Artists Tracked': '已记录作者', 'Posts Viewed': '已读帖子',
  'Artists tracked': '已记录作者', 'Posts viewed': '已读帖子', 'Manage Data →': '管理数据 →',
  'Manage extension data and preferences': '管理扩展数据和偏好设置',
  'Language': '界面语言', 'Translate Pawchive in Chinese mode': '中文模式下汉化 Pawchive 页面',
  'Translate navigation and controls only; creator names and post content stay unchanged.': '仅汉化导航和界面控件，作者名和帖子内容保留原文。',
  'Open Pawchive jumps in a new tab': '跳转至 Pawchive 时在新标签页打开',
  'Danger Zone': '危险操作', 'Reset Database': '清空数据库',
  'This will permanently delete all tracked artists and posts. Continue?': '此操作将永久删除所有作者和帖子浏览记录。是否继续？',
  'Delete "{name}" and all their tracked posts?': '删除“{name}”及其全部帖子浏览记录？',
  'Remove "{name}" from your history?': '从浏览记录中移除“{name}”？',
  'Delete': '删除', 'Remove': '移除', 'Delete artist': '删除作者记录',
  'Open profile': '打开作者主页', '← Artists': '← 作者列表',
  'Last Viewed': '最后浏览', 'Last viewed': '最后浏览', 'Last Update': '最后更新',
  'Updated': '更新时间', 'Viewed': '浏览时间', 'Posted': '发布时间',
  'View all posts': '查看全部帖子', 'Showing posts for': '当前作者：',
  'Unknown': '未知作者', 'Untitled': '无标题',
  'No artists tracked yet.\nVisit an artist page on pawchive.pw, kemono.cr, or coomer.st to get started.': '暂无作者记录。\n访问 pawchive.pw、kemono.cr 或 coomer.st 的作者页即可开始记录。',
  'No posts tracked yet.\nVisit a post page on pawchive.pw, kemono.cr, or coomer.st to get started.': '暂无帖子记录。\n访问 pawchive.pw、kemono.cr 或 coomer.st 的帖子页即可开始记录。',
  'No posts tracked for this artist yet.': '该作者暂无帖子浏览记录。',
  '{count} artist tracked': '已记录 {count} 位作者', '{count} artists tracked': '已记录 {count} 位作者',
  '{count} post viewed': '已读 {count} 篇帖子', '{count} posts viewed': '已读 {count} 篇帖子',
  '{count} viewed / {total} total': '已读 {count} 篇 / 共 {total} 篇', '{count} viewed': '已读 {count} 篇',
  '{count} attachment': '{count} 个附件', '{count} attachments': '{count} 个附件',
  'Loading…': '加载中…', 'viewed': '已读', 'Mark as Unread': '取消已读',
  'Favorite {name}': '关注 {name}', 'Unfavorite {name}': '取消关注 {name}',
  'Log in to Pawchive to favorite': '请先登录 Pawchive 再关注',
  'Please log in to Pawchive before favoriting.': '请先登录 Pawchive，再关注作者。',
  'Favorited.': '已关注。', 'Unfavorited.': '已取消关注。',
  'Could not load favorites. Log in and try again.': '无法读取关注列表，请登录后重试。',
  'Unexpected favorites response. Please try again.': '关注列表格式异常，请重试。',
  'Your session expired. Please log in to Pawchive again.': '登录已失效，请重新登录 Pawchive。',
  'Favorite action failed. Please try again.': '关注操作失败，请稍后重试。',
  'Jump to Pawchive ↗': '跳转至 Pawchive ↗', 'Resolving creator…': '正在识别作者…',
  'Could not identify the creator ID.': '无法识别作者 ID。',
  'This page has no supported creator or server.': '当前页面没有可跳转的作者或服务器。',
  'Reading the Pixiv artwork author failed. Please try again.': '读取 Pixiv 作品作者失败，请稍后重试。',
  'Could not identify the creator. Please try their profile.': '无法识别作者，请在作者主页重试。',
  'Invalid creator handle.': '无效的作者昵称。',
  'Reading the Pawchive creator list failed. Please try again.': '读取 Pawchive 作者列表失败，请稍后重试。',
  'Unexpected Pawchive creator list format.': 'Pawchive 作者列表格式异常。',
  'Creator not found on Pawchive. Try their profile or search on Pawchive.': 'Pawchive 暂未找到这个作者。请从作者主页重试，或在 Pawchive 搜索。',
  'Could not read creator information. Refresh and try again.': '无法读取作者信息，请刷新页面重试。',
  'Could not open the page. Refresh and try again.': '打开失败，请刷新页面重试。',
  'Jump failed. Please try again.': '跳转失败，请重试。',
  'Could not save settings. Please try again.': '设置保存失败，请重试。',
};

export function t(key: string, values: Record<string, string | number> = {}): string {
  const text = language === 'zh' ? zh[key] || key : key;
  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] == null ? match : String(values[name]));
}

export function getLanguage(): Language { return language; }
export function shouldTranslatePawchive(): boolean { return language === 'zh' && translatePawchive; }
export function getTranslationPreference(): boolean { return translatePawchive; }
export function extensionApi(): typeof browser | null {
  return typeof browser !== 'undefined' ? browser : typeof chrome !== 'undefined' ? chrome as unknown as typeof browser : null;
}
export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function applyPreferences(values: { uiLanguage?: string; translatePawchive?: boolean }): void {
  if (values.uiLanguage !== undefined) language = values.uiLanguage === 'zh' ? 'zh' : 'en';
  if (values.translatePawchive !== undefined) translatePawchive = values.translatePawchive === true;
  listeners.forEach(listener => listener());
}
export async function savePreferences(values: { uiLanguage?: Language; translatePawchive?: boolean }): Promise<void> {
  const api = extensionApi();
  if (api) await api.storage.local.set(values);
  applyPreferences(values);
}
export function initializePreferences(): Promise<void> {
  if (initialized) return initialized;
  const api = extensionApi();
  if (!api) return Promise.resolve();
  initialized = api.storage.local.get(['uiLanguage', 'translatePawchive']).then(values => applyPreferences(values));
  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const values: { uiLanguage?: string; translatePawchive?: boolean } = {};
    if (changes.uiLanguage) values.uiLanguage = changes.uiLanguage.newValue || 'en';
    if (changes.translatePawchive) values.translatePawchive = changes.translatePawchive.newValue ?? true;
    if (Object.keys(values).length) applyPreferences(values);
  });
  return initialized;
}
