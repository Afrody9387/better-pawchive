import { EventTypes } from '../../shared/constants/eventTypes';
import { setupJumpButton } from './dom';
import { initializePreferences } from '../../shared/i18n';

if (typeof browser === 'undefined') {
  //@ts-ignore
  globalThis.browser = chrome;
}

void initializePreferences().catch(console.error);
setupJumpButton(document, {
  lookup: async () => {
    const result = await browser.runtime.sendMessage({ type: EventTypes.ResolveJumpCreator });
    if (!result?.id) throw new Error(result?.error || 'Could not read creator information. Refresh and try again.');
    return result.id;
  },
  open: async url => {
    const { jumpOpenInNewTab = true } = await browser.storage.local.get('jumpOpenInNewTab');
    if (jumpOpenInNewTab) {
      const result = await browser.runtime.sendMessage({ type: EventTypes.OpenPawchiveJump, data: { url } });
      if (!result?.opened) throw new Error('Could not open the page. Refresh and try again.');
    } else location.assign(url);
  },
});
