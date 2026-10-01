import { setupQuickFollow } from '../features/quickFollow/dom';
import { normalizePostResponse } from '../core/services/apiClient';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const card = (service = 'patreon', id = '123') => `<a class="user-card" href="/${service}/user/${id}"><div class="user-card__info"><div class="user-card__name">Artist</div></div></a>`;
const response = (data: unknown, status = 200) => ({ ok: status < 400, status, redirected: false, json: async () => data });

describe('Pawchive quick follow', () => {
  let dispose: () => void;
  let fetchMock: jest.Mock;
  beforeEach(() => {
    window.history.replaceState({}, '', '/artists');
    window.localStorage.clear();
    window.localStorage.setItem('logged_in', 'yes');
    document.body.innerHTML = card() + card('fanbox');
    fetchMock = jest.fn().mockResolvedValue(response([]));
    window.fetch = fetchMock;
  });
  afterEach(() => { dispose?.(); document.body.innerHTML = ''; });

  test('loads account state and toggles without navigating or mixing services', async () => {
    dispose = setupQuickFollow();
    await tick();
    const buttons = document.querySelectorAll<HTMLButtonElement>('.bck-quick-follow');
    const navigation = jest.fn();
    document.querySelector('a')!.addEventListener('click', navigation);
    buttons[0].click();
    await tick();
    expect(navigation).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenLastCalledWith(`${location.origin}/api/v1/favorites/creator/patreon/123`, { method: 'POST', credentials: 'include' });
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(JSON.parse(localStorage.getItem('favs')!)).toEqual([{ id: '123', service: 'patreon' }]);
    buttons[0].click();
    await tick();
    expect(fetchMock).toHaveBeenLastCalledWith(`${location.origin}/api/v1/favorites/creator/patreon/123`, { method: 'DELETE', credentials: 'include' });
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });

  test('shows existing follows and handles dynamically inserted similar cards once', async () => {
    fetchMock.mockResolvedValue(response([{ id: '123', service: 'patreon' }]));
    dispose = setupQuickFollow();
    await tick();
    document.body.insertAdjacentHTML('beforeend', card());
    await tick();
    expect(document.querySelectorAll('.bck-quick-follow')).toHaveLength(3);
    expect(document.querySelectorAll('.bck-quick-follow[aria-pressed="true"]')).toHaveLength(2);
  });

  test('does not write for logged-out visitors', async () => {
    localStorage.removeItem('logged_in');
    dispose = setupQuickFollow();
    document.querySelector<HTMLButtonElement>('button')!.click();
    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector('[role="status"]')!.textContent).toContain('登录');
  });

  test('failed writes preserve favorite state and allow retry', async () => {
    dispose = setupQuickFollow();
    await tick();
    fetchMock.mockResolvedValue(response(null, 401));
    const button = document.querySelector<HTMLButtonElement>('button')!;
    button.click();
    await tick();
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('[role="status"]')!.textContent).toContain('重新登录');
  });

  test('does not guess or mutate when initial state cannot be loaded', async () => {
    fetchMock.mockResolvedValue(response(null, 503));
    dispose = setupQuickFollow();
    await tick();
    document.querySelector<HTMLButtonElement>('button')!.click();
    await tick();
    expect(fetchMock.mock.calls.every(([url]) => url.includes('account/favorites'))).toBe(true);
  });

  test('blocks duplicate writes while pending', async () => {
    dispose = setupQuickFollow();
    await tick();
    let finish: (value: unknown) => void;
    fetchMock.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const button = document.querySelector<HTMLButtonElement>('button')!;
    button.click();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    finish!(response(null));
    await tick();
    expect(button.disabled).toBe(false);
  });

  test('syncs native and cross-tab favorite cache updates', async () => {
    dispose = setupQuickFollow();
    await tick();
    localStorage.setItem('favs', JSON.stringify([{ id: '123', service: 'fanbox' }]));
    window.dispatchEvent(new StorageEvent('storage', { key: 'favs' }));
    expect(document.querySelectorAll('.bck-quick-follow[aria-pressed="true"]')).toHaveLength(1);
  });
});

test('normalizes Pawchive flat posts and preserves Kemono wrapped responses', () => {
  const post = { id: 'p1', title: 'Title', published: '2026-09-30', file: null, attachments: [{ path: '/audio.mp3', name: 'audio.mp3' }] };
  expect(normalizePostResponse(post)).toEqual({ post, attachments: post.attachments });
  const wrapped = { post, attachments: post.attachments };
  expect(normalizePostResponse(wrapped)).toBe(wrapped);
});
