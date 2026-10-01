import { buildJumpUrl, creatorIdFromPage, parseJumpSource, resolveJumpUrl } from '../features/pawchiveJump/resolver';
import { setupJumpButton } from '../features/pawchiveJump/dom';
import { lookupArchivedCreator, setupJumpMessageHandler } from '../features/pawchiveJump/background';
import { EventTypes } from '../shared/constants/eventTypes';

describe('Source routes', () => {
  test.each([
    ['https://www.patreon.com/user?u=58020585&tab=posts', { service: 'patreon', id: '58020585' }],
    ['https://www.patreon.com/c/khyleri/about', { service: 'patreon', handle: 'khyleri' }],
    ['https://www.patreon.com/khyleri/posts', { service: 'patreon', handle: 'khyleri' }],
    ['https://anna-anon.fanbox.cc/posts/123', { service: 'fanbox', handle: 'anna-anon', postId: '123' }],
    ['https://www.fanbox.cc/@anna-anon/posts/123', { service: 'fanbox', handle: 'anna-anon', postId: '123' }],
    ['https://www.fanbox.cc/@anna-anon/posts', { service: 'fanbox', handle: 'anna-anon' }],
    ['https://www.pixiv.net/en/users/37736420/artworks', { service: 'fanbox', id: '37736420' }],
    ['https://www.pixiv.net/artworks/123', { service: 'fanbox', artworkId: '123' }],
    ['https://discord.com/channels/123456/789', { service: 'discord', id: '123456' }],
    ['https://www.patreon.com/settings', null],
    ['https://www.patreon.com/home', null],
    ['https://www.fanbox.cc/', null],
    ['https://www.pixiv.net/', null],
    ['https://discord.com/channels/@me/123', null],
    ['https://www.patreon.com.evil.com/c/khyleri', null],
    ['https://api.fanbox.cc/', null],
    ['http://www.patreon.com/user?u=123', null],
    ['https://fantia.jp/fanclubs/123', null],
  ])('%s', (url, expected) => expect(parseJumpSource(new URL(url))).toEqual(expected));
});

describe('Author resolution', () => {
  const lookup = jest.fn().mockResolvedValue('37736420');
  beforeEach(() => { document.head.innerHTML = ''; lookup.mockClear(); global.fetch = jest.fn(); });

  test('Fanbox nickname becomes numeric user id and retains post id', async () => {
    expect(await resolveJumpUrl(new URL('https://anna-anon.fanbox.cc/posts/123'), document, lookup)).toBe('https://pawchive.pw/fanbox/user/37736420/post/123');
    expect(lookup).toHaveBeenCalledWith('fanbox', 'anna-anon');
  });

  test('uses Fanbox public artwork metadata without requesting account information', async () => {
    document.head.innerHTML = '<meta property="og:image" content="https://pixiv.pximg.net/c/1200x630_90_a2_g5/fanbox/public/images/creator/37736420/cover/image.jpeg">';
    expect(await resolveJumpUrl(new URL('https://anna-anon.fanbox.cc/'), document, lookup)).toBe('https://pawchive.pw/fanbox/user/37736420');
    expect(lookup).not.toHaveBeenCalled();
  });

  test('ignores stale Fanbox metadata after a creator route changes', () => {
    document.head.innerHTML = '<meta property="og:url" content="https://other.fanbox.cc/"><meta property="og:image" content="https://pixiv.pximg.net/fanbox/public/images/creator/99/cover/a.jpg">';
    expect(creatorIdFromPage({ service: 'fanbox', handle: 'anna-anon' }, document)).toBeNull();
  });

  test('Patreon uses creator user id, not the campaign id', async () => {
    const campaign = { data: { id: '7106314', relationships: { creator: { data: { id: '58020585' } } } }, included: [{ type: 'user', id: '58020585', attributes: { vanity: 'khyleri' } }] };
    document.head.innerHTML = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { bootstrapEnvelope: { pageBootstrap: { campaign } } } } })}</script>`;
    expect(await resolveJumpUrl(new URL('https://www.patreon.com/c/khyleri/about'), document, lookup)).toBe('https://pawchive.pw/patreon/user/58020585');
    expect(lookup).not.toHaveBeenCalled();
    expect(creatorIdFromPage({ service: 'patreon', handle: 'other' }, document)).toBeNull();
  });

  test('Pixiv artwork uses the artwork author and never unrelated recommended user links', async () => {
    document.body.innerHTML = '<a href="https://www.pixiv.net/users/999">Recommended artist</a>';
    const fetcher = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: false, body: { id: '123', userId: '456' } }) });
    expect(await resolveJumpUrl(new URL('https://www.pixiv.net/artworks/123'), document, lookup, fetcher)).toBe('https://pawchive.pw/fanbox/user/456');
    expect(fetcher).toHaveBeenCalledWith('https://www.pixiv.net/ajax/illust/123', { credentials: 'include' });
  });

  test('failed artwork resolution does not generate an undefined destination', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: false });
    await expect(resolveJumpUrl(new URL('https://www.pixiv.net/artworks/123'), document, lookup, fetcher)).rejects.toThrow('失败');
    expect(() => buildJumpUrl({ service: 'fanbox' }, 'undefined')).toThrow();
  });

  test('Discord server id goes to server route', async () => {
    expect(await resolveJumpUrl(new URL('https://discord.com/channels/123/456'), document, lookup)).toBe('https://pawchive.pw/discord/server/123');
  });
});

describe('Jump button', () => {
  let dispose: () => void;
  const open = jest.fn().mockResolvedValue(undefined);
  beforeEach(() => { jest.useFakeTimers(); open.mockClear(); document.body.innerHTML = ''; window.fetch = jest.fn(); });
  afterEach(() => { dispose?.(); jest.useRealTimers(); });

  function sourceDocument(url: string): { doc: Document; location: { href: string } } {
    const location = { href: url };
    const win = {
      location, fetch: window.fetch,
      setInterval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window),
      addEventListener: window.addEventListener.bind(window), removeEventListener: window.removeEventListener.bind(window),
    };
    const doc = new Proxy(document, { get(target, property) {
      if (property === 'defaultView') return win;
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    return { doc, location };
  }

  test('button opens current creator, blocks duplicate clicks and follows SPA navigation', async () => {
    const { doc, location } = sourceDocument('https://www.pixiv.net/users/123');
    dispose = setupJumpButton(doc, { lookup: jest.fn(), open });
    const host = document.querySelector<HTMLElement>('#bck-pawchive-jump')!;
    const button = host.shadowRoot!.querySelector('button')!;
    expect(host.hidden).toBe(false);
    button.click();
    button.click();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenLastCalledWith('https://pawchive.pw/fanbox/user/123');
    location.href = 'https://www.pixiv.net/users/456';
    jest.advanceTimersByTime(1000);
    button.click();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(open).toHaveBeenLastCalledWith('https://pawchive.pw/fanbox/user/456');
    location.href = 'https://www.pixiv.net/';
    jest.advanceTimersByTime(1000);
    expect(host.hidden).toBe(true);
  });

  test('failed nickname lookup shows error and re-enables the button', async () => {
    const { doc } = sourceDocument('https://example.fanbox.cc/');
    document.head.innerHTML = '';
    dispose = setupJumpButton(doc, { lookup: jest.fn().mockRejectedValue(new Error('未找到作者')), open });
    const root = document.querySelector('#bck-pawchive-jump')!.shadowRoot!;
    root.querySelector('button')!.click();
    for (let index = 0; index < 8; index++) await Promise.resolve();
    expect(root.querySelector('[role="status"]')!.textContent).toBe('未找到作者');
    expect(root.querySelector('button')!.disabled).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  test('resolves current route on click and hides on unsupported SPA pages', async () => {
    window.history.replaceState({}, '', '/en/users/123');
    // jsdom runs on localhost; source parsing is tested separately with full URLs.
    dispose = setupJumpButton(document, { lookup: jest.fn(), open });
    const host = document.querySelector<HTMLElement>('#bck-pawchive-jump')!;
    expect(host.hidden).toBe(true);
    expect(host.shadowRoot!.querySelector('button')!.textContent).toContain('Pawchive');
    jest.advanceTimersByTime(3000);
    expect(document.querySelectorAll('#bck-pawchive-jump')).toHaveLength(1);
    expect(open).not.toHaveBeenCalled();
  });
});

test('public nickname lookup matches service + exact public_id and refuses unknown creators', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [
    { service: 'fanbox', public_id: 'creator', id: '123' },
    { service: 'patreon', public_id: 'creator', id: '456' },
  ] });
  expect(await lookupArchivedCreator('fanbox', 'creator')).toBe('123');
  expect(await lookupArchivedCreator('patreon', 'CREATOR')).toBe('456');
  await expect(lookupArchivedCreator('patreon', 'missing')).rejects.toThrow('暂未找到');
});

test('background refuses foreign senders and destinations outside Pawchive', async () => {
  let listener: any;
  const tabsCreate = jest.fn().mockResolvedValue({});
  (globalThis as any).browser = { runtime: { onMessage: { addListener: (fn: any) => { listener = fn; } } }, tabs: { create: tabsCreate } };
  setupJumpMessageHandler();
  expect(listener({ type: EventTypes.OpenPawchiveJump, data: { url: 'https://pawchive.pw/fanbox/user/123' } }, { url: 'https://evil.com/' })).toBeUndefined();
  expect(listener({ type: EventTypes.OpenPawchiveJump, data: { url: 'https://evil.com/' } }, { url: 'https://www.pixiv.net/users/123' })).toBeUndefined();
  await listener({ type: EventTypes.OpenPawchiveJump, data: { url: 'https://pawchive.pw/fanbox/user/123' } }, { url: 'https://www.pixiv.net/users/123' });
  expect(tabsCreate).toHaveBeenCalledTimes(1);
  delete (globalThis as any).browser;
});
