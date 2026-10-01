import { EventTypes } from '../../shared/constants/eventTypes';
import { setupJumpButton } from './dom';

if (typeof browser === 'undefined') {
  //@ts-ignore
  globalThis.browser = chrome;
}

setupJumpButton(document, {
  lookup: async () => {
    const result = await browser.runtime.sendMessage({ type: EventTypes.ResolveJumpCreator });
    if (!result?.id) throw new Error(result?.error || '无法读取作者信息，请刷新页面重试。');
    return result.id;
  },
  open: async url => {
    const { jumpOpenInNewTab = true } = await browser.storage.local.get('jumpOpenInNewTab');
    if (jumpOpenInNewTab) {
      const result = await browser.runtime.sendMessage({ type: EventTypes.OpenPawchiveJump, data: { url } });
      if (!result?.opened) throw new Error('打开失败，请刷新页面重试。');
    } else location.assign(url);
  },
});
