import { DatabaseLifecycle, ArtistStore, PostStore } from "../../core/database/contracts";
import { createDatabaseServices } from "../../core/database/createDatabaseServices";
import { t, getLanguage, initializePreferences, subscribeLanguage } from '../../shared/i18n';

if (typeof browser === "undefined") {
  //@ts-ignore
  (globalThis as any).browser = chrome;
}

// ── Composition root ──────────────────────────────────────────────────────────

/**
 * Wires and bootstraps the popup page.
 * Accepts `db` explicitly so the page is testable without touching the singleton.
 */
type PopupServices = {
  lifecycle: DatabaseLifecycle;
  artists: Pick<ArtistStore, "getAll">;
  posts: Pick<PostStore, "getAll">;
};

export async function createPopupApp({ lifecycle, artists, posts }: PopupServices): Promise<void> {
  await initializePreferences();
  const translate = () => {
    document.documentElement.lang = getLanguage() === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('.stat-label').forEach((element, index) => {
      element.textContent = t(index === 0 ? 'Artists tracked' : 'Posts viewed');
    });
    const button = document.getElementById('open-management');
    if (button) button.textContent = t('Manage Data →');
  };
  translate();
  subscribeLanguage(translate);
  await lifecycle.init();
  const [allArtists, allPosts] = await Promise.all([artists.getAll(), posts.getAll()]);
  document.getElementById('artist-count')!.textContent = String(allArtists.length);
  document.getElementById('post-count')!.textContent = String(allPosts.length);

  document.getElementById('open-management')?.addEventListener('click', () => {
    browser.tabs.create({ url: browser.runtime.getURL('management.html') });
    window.close();
  });
}

// ── Entrypoint ────────────────────────────────────────────────────────────────

createPopupApp(createDatabaseServices()).catch(console.error);
