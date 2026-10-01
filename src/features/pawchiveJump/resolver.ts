export type JumpTarget = {
  service: 'patreon' | 'fanbox' | 'discord';
  id?: string;
  handle?: string;
  artworkId?: string;
  postId?: string;
};

export function parseJumpSource(url: URL): JumpTarget | null {
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  const path = url.pathname;
  if (host === 'patreon.com' || host === 'www.patreon.com') {
    const numeric = url.searchParams.get('u');
    if (/^\/user\/?$/.test(path) && numeric && /^\d+$/.test(numeric)) return { service: 'patreon', id: numeric };
    const creator = path.match(/^\/(?:c\/)?([\w-]+)(?:\/(?:about|posts|membership|shop|collections)(?:\/.*)?)?\/?$/);
    const reserved = new Set(['home', 'login', 'logout', 'signup', 'settings', 'explore', 'search', 'posts', 'user', 'join', 'checkout', 'messages', 'notifications', 'policy', 'create', 'c', 'account']);
    if (creator && !reserved.has(creator[1].toLowerCase())) return { service: 'patreon', handle: creator[1] };
    // Individual posts need the creator identity from the page, not the post id.
    if (/^\/posts\/[^/]+/.test(path)) return { service: 'patreon' };
  }
  if (host === 'www.fanbox.cc' || host === 'fanbox.cc') {
    const creator = path.match(/^\/@([\w-]+)(?:\/posts(?:\/(\d+))?|\/(?:plans|profile))?\/?$/);
    if (creator) return { service: 'fanbox', handle: creator[1], postId: creator[2] };
  } else if (/^[\w-]+\.fanbox\.cc$/.test(host) && !['api.fanbox.cc', 'downloads.fanbox.cc'].includes(host)) {
    const post = path.match(/^\/posts\/(\d+)\/?$/);
    if (path === '/' || post || /^\/(?:plans|profile|posts)\/?$/.test(path)) {
      return { service: 'fanbox', handle: host.split('.')[0], postId: post?.[1] };
    }
  }
  if (host === 'www.pixiv.net') {
    const user = path.match(/^\/(?:[a-z]{2}\/)?users\/(\d+)(?:\/.*)?$/);
    if (user) return { service: 'fanbox', id: user[1] };
    const legacy = path.match(/^\/fanbox\/creator\/(\d+)/);
    if (legacy) return { service: 'fanbox', id: legacy[1] };
    const artwork = path.match(/^\/(?:[a-z]{2}\/)?artworks\/(\d+)\/?$/);
    if (artwork) return { service: 'fanbox', artworkId: artwork[1] };
  }
  if (host === 'discord.com') {
    const guild = path.match(/^\/channels\/(\d+)(?:\/.*)?$/);
    if (guild) return { service: 'discord', id: guild[1] };
  }
  return null;
}

export function buildJumpUrl(target: JumpTarget, id: string): string {
  if (!/^\d+$/.test(id)) throw new Error('无法识别作者 ID。');
  return `https://pawchive.pw/${target.service}/${target.service === 'discord' ? 'server' : 'user'}/${id}`
    + (target.postId ? `/post/${target.postId}` : '');
}

export function creatorIdFromPage(target: JumpTarget, doc: Document): string | null {
  if (target.service === 'fanbox' && target.handle) {
    const canonical = doc.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content;
    if (canonical) {
      try {
        if (parseJumpSource(new URL(canonical))?.handle !== target.handle) return null;
      } catch { return null; }
    }
    const image = doc.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content || '';
    try {
      const url = new URL(image);
      if (url.hostname === 'pixiv.pximg.net') {
        const id = url.pathname.match(/\/fanbox\/public\/images\/(?:creator|user)\/(\d+)\//)?.[1];
        if (id) return id;
      }
    } catch { /* Fall back to the public archive lookup. */ }
  }
  if (target.service === 'patreon') {
    try {
      const data = JSON.parse(doc.querySelector('#__NEXT_DATA__')?.textContent || 'null');
      const campaign = data?.props?.pageProps?.bootstrapEnvelope?.pageBootstrap?.campaign;
      const id = campaign?.data?.relationships?.creator?.data?.id;
      if (typeof id === 'string' && /^\d+$/.test(id)) {
        if (!target.handle) return id;
        const user = campaign.included?.find((item: any) => item.type === 'user' && item.id === id);
        if (user?.attributes?.vanity?.toLowerCase() === target.handle.toLowerCase()) return id;
      }
    } catch { /* Do not evaluate inline page code. */ }
  }
  return null;
}

export async function resolveJumpUrl(
  url: URL, doc: Document,
  lookup: (service: 'patreon' | 'fanbox', handle: string) => Promise<string>,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const target = parseJumpSource(url);
  if (!target) throw new Error('当前页面没有可跳转的作者或服务器。');
  let id = target.id || creatorIdFromPage(target, doc);
  if (!id && target.artworkId) {
    const response = await fetcher(`https://www.pixiv.net/ajax/illust/${target.artworkId}`, { credentials: 'include' });
    if (!response.ok) throw new Error('读取 Pixiv 作品作者失败，请稍后重试。');
    const data = await response.json();
    if (!data.error && String(data.body?.id) === target.artworkId) id = String(data.body.userId || '');
  }
  if (!id && target.handle && target.service !== 'discord') id = await lookup(target.service, target.handle);
  if (!id) throw new Error('无法识别作者，请在作者主页重试。');
  return buildJumpUrl(target, id);
}
