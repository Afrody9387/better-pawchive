import { applyPreferences, getLanguage, initializePreferences, savePreferences, shouldTranslatePawchive, t } from '../shared/i18n';
import { setupPageTranslation } from '../features/pageTranslation/dom';
import { renderSettings } from '../ui/management/pages/settings';
import { renderArtists } from '../ui/management/pages/artists';
import { renderPostCard } from '../ui/management/components/postCard';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Language preferences', () => {
  afterEach(() => { applyPreferences({ uiLanguage: 'en', translatePawchive: true }); delete (globalThis as any).browser; });

  test('Chinese labels and interpolated counts switch back to English', () => {
    applyPreferences({ uiLanguage: 'zh' });
    expect(t('Settings')).toBe('设置');
    expect(t('{count} posts viewed', { count: 3 })).toBe('已读 3 篇帖子');
    expect(shouldTranslatePawchive()).toBe(true);
    applyPreferences({ translatePawchive: false });
    expect(shouldTranslatePawchive()).toBe(false);
    applyPreferences({ uiLanguage: 'en' });
    expect(t('Settings')).toBe('Settings');
  });

  test('settings persist and change language through the actual select', async () => {
    const set = jest.fn().mockResolvedValue(undefined);
    (globalThis as any).browser = { storage: { local: { set, get: jest.fn().mockResolvedValue({}) } } };
    const settings = renderSettings({ reset: jest.fn() } as any, jest.fn(), jest.fn());
    const select = settings.querySelector<HTMLSelectElement>('#ui-language')!;
    select.value = 'zh'; select.dispatchEvent(new Event('change'));
    await tick();
    expect(set).toHaveBeenCalledWith({ uiLanguage: 'zh' });
    expect(getLanguage()).toBe('zh');
    const updated = renderSettings({ reset: jest.fn() } as any, jest.fn(), jest.fn());
    expect(updated.querySelector('h1')!.textContent).toBe('设置');
    expect(updated.querySelector<HTMLSelectElement>('#ui-language')!.value).toBe('zh');
    const checkbox = updated.querySelector<HTMLInputElement>('#translate-pawchive')!;
    checkbox.checked = false; checkbox.dispatchEvent(new Event('change'));
    await tick();
    expect(set).toHaveBeenLastCalledWith({ translatePawchive: false });
    expect(shouldTranslatePawchive()).toBe(false);
  });

  test('failed saves keep previous language and show a recoverable settings error', async () => {
    (globalThis as any).browser = { storage: { local: {
      set: jest.fn().mockRejectedValue(new Error('storage error')), get: jest.fn().mockResolvedValue({}),
    } } };
    await expect(savePreferences({ uiLanguage: 'zh' })).rejects.toThrow('storage error');
    expect(getLanguage()).toBe('en');
    const settings = renderSettings({ reset: jest.fn() } as any, jest.fn(), jest.fn());
    const select = settings.querySelector<HTMLSelectElement>('#ui-language')!;
    select.value = 'zh'; select.dispatchEvent(new Event('change'));
    await tick();
    expect(select.disabled).toBe(false);
    expect(select.value).toBe('en');
    expect(settings.querySelector('[role="status"]')!.textContent).toContain('Could not save');
  });

  test('loads saved preferences and follows language changes from another extension tab', async () => {
    let changed: (changes: any, area: string) => void;
    (globalThis as any).browser = { storage: {
      local: { get: jest.fn().mockResolvedValue({ uiLanguage: 'zh', translatePawchive: false }) },
      onChanged: { addListener: (listener: typeof changed) => { changed = listener; } },
    } };
    await initializePreferences();
    expect(getLanguage()).toBe('zh');
    expect(shouldTranslatePawchive()).toBe(false);
    changed!({ translatePawchive: { newValue: true } }, 'local');
    expect(shouldTranslatePawchive()).toBe(true);
    changed!({ uiLanguage: { newValue: 'en' } }, 'sync');
    expect(getLanguage()).toBe('zh');
    changed!({ uiLanguage: { newValue: 'en' } }, 'local');
    expect(getLanguage()).toBe('en');
  });

  test('management translates controls and counts without changing names or titles', () => {
    applyPreferences({ uiLanguage: 'zh' });
    const artist = { id: '123', name: 'Home', content_origin: 'patreon', hostname: 'pawchive.pw' };
    const artists = renderArtists([artist], [], jest.fn(), jest.fn(), jest.fn());
    expect(artists.querySelector('h1')!.textContent).toBe('作者');
    expect(artists.querySelector('.artist-card-name')!.textContent).toBe('Home');
    const card = renderPostCard({ id: '456', artist_id: '123', name: 'Settings', viewed_at: '', attachment_count: 2 }, artist, jest.fn());
    expect(card.querySelector('.post-card-title')!.textContent).toBe('Settings');
    expect(card.querySelector('.attachment-chip')!.textContent).toBe('📎 2 个附件');
    expect(card.querySelector('button')!.textContent).toBe('移除');
  });
});

describe('Pawchive page translation', () => {
  let translation: ReturnType<typeof setupPageTranslation>;
  let enabled = true;
  beforeEach(() => {
    enabled = true;
    document.body.innerHTML = `<nav class="global-sidebar"><a href="/artists">Creators</a><a>Search</a></nav>
      <div id="main"><h1 class="user-header__name">Home</h1><div class="user-card__name">Search</div>
      <ul class="tabs"><li><a href="/similar">Similar Artists</a></li><li>Linked Accounts (2)</li></ul>
      <form class="search-form"><input placeholder="search for creators..." value="Home"><select><option value="favorited">Popularity</option></select></form>
      <article class="post-card"><header class="post-card__header">Favorite</header><footer class="post-card__footer"><div>2 attachments</div></footer></article>
      <div class="post__content"><p>Home Search Favorite</p><footer>Home</footer></div>
      <div class="user-header__actions"><button class="native-favorite"><span>☆</span><span>Favorite</span></button></div></div>`;
    translation = setupPageTranslation(document, () => enabled);
  });
  afterEach(() => { translation.dispose(); document.body.innerHTML = ''; });

  test('translates site controls while preserving content, links and form data', () => {
    expect(document.querySelector('.global-sidebar a')!.textContent).toBe('作者');
    expect(document.querySelector('.tabs')!.textContent).toContain('相似作者');
    expect(document.querySelector('.tabs')!.textContent).toContain('关联账号（2）');
    expect(document.querySelector('input')!.placeholder).toBe('搜索作者…');
    expect(document.querySelector('input')!.value).toBe('Home');
    expect(document.querySelector('option')!.value).toBe('favorited');
    expect(document.querySelector('option')!.textContent).toBe('热度');
    expect(document.querySelector('.user-header__name')!.textContent).toBe('Home');
    expect(document.querySelector('.user-card__name')!.textContent).toBe('Search');
    expect(document.querySelector('.post-card__header')!.textContent).toBe('Favorite');
    expect(document.querySelector('.post__content')!.textContent).toBe('Home Search FavoriteHome');
    expect(document.querySelector('.tabs a')!.getAttribute('href')).toBe('/similar');
  });

  test('preserves native click handlers and follows native favorite state changes', async () => {
    const button = document.querySelector('.native-favorite')!;
    const click = jest.fn(); button.addEventListener('click', click);
    (button as HTMLButtonElement).click(); expect(click).toHaveBeenCalledTimes(1);
    button.querySelectorAll('span')[1].textContent = 'Unfavorite';
    await tick();
    expect(button.textContent).toBe('☆取消关注');
    enabled = false; translation.refresh();
    expect(button.textContent).toBe('☆Unfavorite');
  });

  test('restores original labels and placeholders when disabled', () => {
    enabled = false; translation.refresh();
    expect(document.querySelector('.global-sidebar a')!.textContent).toBe('Creators');
    expect(document.querySelector('input')!.placeholder).toBe('search for creators...');
    expect(document.querySelector('.tabs')!.textContent).toContain('Linked Accounts (2)');
    expect(document.querySelector('option')!.textContent).toBe('Popularity');
  });

  test('restores translated history snapshots inserted after translation is disabled', async () => {
    const snapshot = document.querySelector('.tabs')!.outerHTML;
    enabled = false; translation.refresh();
    document.querySelector('.tabs')!.remove();
    document.getElementById('main')!.insertAdjacentHTML('beforeend', snapshot);
    await tick();
    expect(document.querySelector('.tabs')!.textContent).toContain('Similar Artists');
    expect(document.querySelector('.tabs')!.hasAttribute('data-bck-site-translated')).toBe(false);
  });

  test('translates asynchronously inserted pages and restores cached HTMX snapshots', async () => {
    const snapshot = document.querySelector('.tabs')!.outerHTML;
    document.querySelector('.tabs')!.remove();
    await tick();
    document.getElementById('main')!.insertAdjacentHTML('beforeend', snapshot + '<h1 class="site-section__heading">Favorites</h1>');
    await tick();
    expect(document.querySelector('.site-section__heading')!.textContent).toBe('关注与收藏');
    enabled = false; translation.refresh();
    expect(document.querySelector('.tabs')!.textContent).toContain('Similar Artists');
    expect(document.querySelector('.site-section__heading')!.textContent).toBe('Favorites');
  });
});
