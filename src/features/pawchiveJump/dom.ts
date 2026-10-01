import { parseJumpSource, resolveJumpUrl } from './resolver';
import { t, subscribeLanguage } from '../../shared/i18n';

type JumpActions = {
  lookup: (service: 'patreon' | 'fanbox', handle: string) => Promise<string>;
  open: (url: string) => Promise<void>;
};

export function setupJumpButton(doc: Document, actions: JumpActions): () => void {
  const win = doc.defaultView!;
  const host = doc.createElement('div');
  host.id = 'bck-pawchive-jump';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host { all: initial; position: fixed; bottom: 18px; right: 18px; z-index: 2147483647; font: 14px sans-serif; }
    :host([hidden]) { display: none; }
    button { padding: 10px 16px; border: 1px solid #ffffff70; border-radius: 9px; background: #24272f; color: #fff; font: inherit; cursor: pointer; box-shadow: 0 3px 12px #0005; }
    button:hover { background: #3b414d; } button:disabled { opacity: .7; cursor: wait; }
    button:focus-visible { outline: 3px solid #82cfff; outline-offset: 3px; }
    p { margin: 0 0 8px; padding: 10px; max-width: 260px; border-radius: 8px; color: white; background: #24272f; line-height: 1.5; }
    p:empty { display: none; }
  </style><p role="status"></p><button type="button">跳转至 Pawchive ↗</button>`;
  const button = root.querySelector('button')!;
  const status = root.querySelector('p')!;
  let currentUrl = '';
  let busy = false;
  let disposed = false;
  const translateButton = () => { button.textContent = t(busy ? 'Resolving creator…' : 'Jump to Pawchive ↗'); };
  const unsubscribe = subscribeLanguage(translateButton);
  translateButton();

  function update(): void {
    if (!host.isConnected) doc.body.appendChild(host);
    if (currentUrl === win.location.href) return;
    currentUrl = win.location.href;
    host.hidden = !parseJumpSource(new URL(currentUrl));
    status.textContent = '';
  }
  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    translateButton();
    status.textContent = '';
    const sourceUrl = win.location.href;
    try {
      const destination = await resolveJumpUrl(new URL(sourceUrl), doc, actions.lookup, win.fetch.bind(win));
      if (!disposed && sourceUrl === win.location.href) await actions.open(destination);
    } catch (error) {
      if (!disposed && sourceUrl === win.location.href) status.textContent = t(error instanceof Error ? error.message : 'Jump failed. Please try again.');
    } finally {
      busy = false;
      button.disabled = false;
      translateButton();
    }
  });
  // SPA navigation, including Pixiv and Discord, does not reload content scripts.
  const timer = win.setInterval(update, 1000);
  win.addEventListener('popstate', update);
  update();
  return () => { disposed = true; unsubscribe(); win.clearInterval(timer); win.removeEventListener('popstate', update); host.remove(); };
}
