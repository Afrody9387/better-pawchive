import { t, subscribeLanguage } from '../../shared/i18n';
type Favorite = { id: string; service: string };

// Uses Pawchive's account favorites, including its native "favs" cache.
// No extension database is used for follows; the site's session stays on-site.
export function setupQuickFollow(doc: Document = document): () => void {
  const win = doc.defaultView!;
  let favorites: Favorite[] | null = null;
  let loading: Promise<void> | null = null;
  const pending = new Set<string>();
  let disposed = false;
  let lastNotice: string | null = null;
  const loggedIn = () => win.localStorage.getItem('logged_in') === 'yes';
  const key = (artist: Favorite) => JSON.stringify([artist.service, artist.id]);

  function artistFor(card: HTMLElement): Favorite | null {
    const link = card.matches('a[href]') ? card : card.querySelector('a[href]');
    if (!link) return null;
    const url = new URL(link.getAttribute('href')!, win.location.href);
    const match = url.pathname.match(/^\/([^/]+)\/user\/([^/]+)\/?$/);
    if (url.origin !== win.location.origin || !match) return null;
    return { service: decodeURIComponent(match[1]), id: decodeURIComponent(match[2]) };
  }

  function render(): void {
    if (lastNotice) {
      const status = doc.querySelector('.bck-follow-status');
      if (status && status.textContent !== t(lastNotice)) status.textContent = t(lastNotice);
    }
    doc.querySelectorAll<HTMLElement>('.user-card').forEach(card => {
      const artist = artistFor(card);
      if (!artist) return;
      card.classList.add('bck-follow-card');
      let button = card.querySelector<HTMLButtonElement>('.bck-quick-follow');
      if (!button) {
        button = doc.createElement('button');
        button.type = 'button';
        button.className = 'bck-quick-follow';
        card.appendChild(button);
      }
      const followed = loggedIn() && !!favorites?.some(fav => key(fav) === key(artist));
      const busy = pending.has(key(artist));
      const text = busy ? '…' : followed ? '★' : '☆';
      if (button.textContent !== text) button.textContent = text;
      button.disabled = busy;
      button.setAttribute('aria-pressed', String(followed));
      const name = card.querySelector('.user-card__name')?.textContent?.trim() || artist.id;
      button.title = loggedIn() ? t(followed ? 'Unfavorite {name}' : 'Favorite {name}', { name }) : t('Log in to Pawchive to favorite');
      button.setAttribute('aria-label', button.title);
      if (favorites !== null || !loggedIn()) card.classList.toggle('user-card--fav', followed);
    });
  }

  function notice(message: string): void {
    lastNotice = message;
    let status = doc.querySelector<HTMLElement>('.bck-follow-status');
    if (!status) {
      status = doc.createElement('div');
      status.className = 'bck-follow-status';
      status.setAttribute('role', 'status');
      doc.body.appendChild(status);
    }
    status.textContent = t(message);
  }

  async function load(): Promise<void> {
    if (!loggedIn()) { favorites = null; render(); return; }
    if (loading) return loading;
    loading = (async () => {
      // Firefox MV2 resolves relative fetch URLs against the extension origin.
      const response = await win.fetch(new URL('/api/v1/account/favorites?type=artist', win.location.origin).href, { credentials: 'include' });
      if (!response.ok || response.redirected) throw new Error('Could not load favorites. Log in and try again.');
      const data = await response.json();
      if (!Array.isArray(data) || data.some(fav => typeof fav.id !== 'string' || typeof fav.service !== 'string')) {
        throw new Error('Unexpected favorites response. Please try again.');
      }
      favorites = data.map(({ id, service }) => ({ id, service }));
      win.localStorage.setItem('favs', JSON.stringify(favorites));
    })();
    try { await loading; } finally { loading = null; if (!disposed) render(); }
  }

  async function toggle(button: HTMLButtonElement): Promise<void> {
    const artist = artistFor(button.closest<HTMLElement>('.user-card')!);
    if (!artist || pending.has(key(artist))) return;
    if (!loggedIn()) { notice('Please log in to Pawchive before favoriting.'); return; }
    pending.add(key(artist));
    render();
    try {
      // Never guess the current state when the account request has failed.
      if (favorites === null) await load();
      const followed = favorites!.some(fav => key(fav) === key(artist));
      const response = await win.fetch(new URL(`/api/v1/favorites/creator/${encodeURIComponent(artist.service)}/${encodeURIComponent(artist.id)}`, win.location.origin).href, {
        method: followed ? 'DELETE' : 'POST', credentials: 'include',
      });
      if (!response.ok || response.redirected) {
        throw new Error(response.status === 401 || response.status === 403
          ? 'Your session expired. Please log in to Pawchive again.'
          : 'Favorite action failed. Please try again.');
      }
      // Merge native changes made while the request was in flight.
      readCache();
      favorites = favorites!.filter(fav => key(fav) !== key(artist));
      if (!followed) favorites.push(artist);
      win.localStorage.setItem('favs', JSON.stringify(favorites));
      notice(followed ? 'Unfavorited.' : 'Favorited.');
    } catch (error) {
      notice(error instanceof Error ? error.message : 'Favorite action failed. Please try again.');
    } finally {
      pending.delete(key(artist));
      if (!disposed) render();
    }
  }

  function onClick(event: MouseEvent): void {
    const button = (event.target as Element)?.closest<HTMLButtonElement>('.bck-quick-follow');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void toggle(button);
  }

  function readCache(): void {
    try {
      const data = JSON.parse(win.localStorage.getItem('favs') || 'null');
      if (Array.isArray(data) && data.every(fav => typeof fav.id === 'string' && typeof fav.service === 'string')) {
        favorites = data;
      }
    } catch { /* Keep the last valid account state. */ }
  }

  function onStorage(): void { readCache(); render(); }
  // Search and Similar Artists can replace or append cards asynchronously.
  const observer = new win.MutationObserver(records => {
    if (records.some(record => record.type === 'childList' || record.attributeName === 'href')) {
      readCache(); render();
    }
  });
  observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
  doc.addEventListener('click', onClick, true);
  win.addEventListener('storage', onStorage);
  render();
  const unsubscribe = subscribeLanguage(render);
  void load().catch(error => notice(error.message));
  return () => {
    disposed = true;
    unsubscribe();
    observer.disconnect();
    doc.removeEventListener('click', onClick, true);
    win.removeEventListener('storage', onStorage);
  };
}
