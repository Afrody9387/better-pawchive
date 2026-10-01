import { EventTypes } from '../../shared/constants/eventTypes';
import { parseJumpSource } from './resolver';

let creatorsPromise: Promise<Map<string, string>> | null = null;
let creatorsFetchedAt = 0;

export async function lookupArchivedCreator(service: string, handle: string): Promise<string> {
  if (!['fanbox', 'patreon'].includes(service) || !/^[\w-]{1,100}$/.test(handle)) throw new Error('无效的作者昵称。');
  if (!creatorsPromise || Date.now() - creatorsFetchedAt > 30 * 60 * 1000) {
    creatorsFetchedAt = Date.now();
    creatorsPromise = (async () => {
      const response = await fetch('https://pawchive.pw/api/v1/creators', { headers: { Accept: 'text/css' }, credentials: 'omit' });
      if (!response.ok) throw new Error('读取 Pawchive 作者列表失败，请稍后重试。');
      const creators = await response.json();
      if (!Array.isArray(creators)) throw new Error('Pawchive 作者列表格式异常。');
      const ids = new Map<string, string>();
      for (const creator of creators) {
        if (typeof creator.public_id === 'string' && /^\d+$/.test(creator.id)) {
          const key = `${creator.service}:${creator.public_id.toLowerCase()}`;
          // Refuse ambiguous nicknames instead of linking to the wrong person.
          const id = String(creator.id);
          ids.set(key, ids.has(key) && ids.get(key) !== id ? '' : id);
        }
      }
      return ids;
    })().catch(error => { creatorsPromise = null; throw error; });
  }
  const id = (await creatorsPromise).get(`${service}:${handle.toLowerCase()}`);
  if (!id) throw new Error('Pawchive 暂未找到这个作者。请从作者主页重试，或在 Pawchive 搜索。');
  return id;
}

export function setupJumpMessageHandler(): void {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (![EventTypes.ResolveJumpCreator, EventTypes.OpenPawchiveJump].includes(message.type)) return;
    const source = sender.url || sender.tab?.url;
    let target;
    try { target = source ? parseJumpSource(new URL(source)) : null; } catch { return; }
    if (!target) return;
    if (message.type === EventTypes.ResolveJumpCreator) {
      // Use the sender's actual URL, not a page-supplied service/handle.
      if (!target.handle || target.service === 'discord') return;
      return lookupArchivedCreator(target.service, target.handle)
        .then(id => ({ id })).catch(error => ({ error: error.message }));
    }
    const destination = message.data?.url;
    if (typeof destination !== 'string' || !/^https:\/\/pawchive\.pw\/(?:patreon\/user|fanbox\/user|discord\/server)\/\d+(?:\/post\/\d+)?$/.test(destination)) return;
    return browser.tabs.create({ url: destination }).then(() => ({ opened: true }));
  });
}
