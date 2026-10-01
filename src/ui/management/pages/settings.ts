import { BackupStore } from "../../../core/database/contracts";
import { t, getLanguage, getTranslationPreference, savePreferences, extensionApi } from '../../../shared/i18n';

export function renderSettings(backup: BackupStore, loadData: () => Promise<void>, render: () => void): HTMLElement {
  const wrap = document.createElement('div');
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1>${t('Settings')}</h1><p>${t('Manage extension data and preferences')}</p>`;
  wrap.appendChild(header);
  const status = document.createElement('p');
  status.setAttribute('role', 'status');

  const languageRow = document.createElement('label');
  languageRow.className = 'settings-option';
  languageRow.append(document.createTextNode(t('Language')));
  const language = document.createElement('select');
  language.id = 'ui-language';
  for (const [value, label] of [['en', 'English'], ['zh', '简体中文']]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = label; language.appendChild(option);
  }
  language.value = getLanguage();
  languageRow.appendChild(language);
  language.addEventListener('change', async () => {
    language.disabled = true;
    try { await savePreferences({ uiLanguage: language.value === 'zh' ? 'zh' : 'en' }); }
    catch { language.value = getLanguage(); status.textContent = t('Could not save settings. Please try again.'); }
    finally { language.disabled = false; }
  });
  wrap.appendChild(languageRow);

  const translationRow = document.createElement('label');
  translationRow.className = 'settings-option';
  const translate = document.createElement('input');
  translate.id = 'translate-pawchive'; translate.type = 'checkbox';
  translate.checked = getTranslationPreference();
  translationRow.append(translate, document.createTextNode(t('Translate Pawchive in Chinese mode')));
  translate.addEventListener('change', async () => {
    translate.disabled = true;
    try { await savePreferences({ translatePawchive: translate.checked }); }
    catch { translate.checked = getTranslationPreference(); status.textContent = t('Could not save settings. Please try again.'); }
    finally { translate.disabled = false; }
  });
  wrap.appendChild(translationRow);
  const hint = document.createElement('p');
  hint.className = 'settings-hint';
  hint.textContent = t('Translate navigation and controls only; creator names and post content stay unchanged.');
  wrap.appendChild(hint);

  const jumpRow = document.createElement('label');
  jumpRow.className = 'settings-option';
  const newTab = document.createElement('input');
  newTab.type = 'checkbox'; newTab.checked = true;
  jumpRow.append(newTab, document.createTextNode(t('Open Pawchive jumps in a new tab')));
  wrap.appendChild(jumpRow);
  const api = extensionApi();
  if (api) {
    newTab.disabled = true;
    api.storage.local.get('jumpOpenInNewTab').then(({ jumpOpenInNewTab = true }) => {
      newTab.checked = jumpOpenInNewTab; newTab.disabled = false;
    }).catch(() => { status.textContent = t('Could not save settings. Please try again.'); });
    newTab.addEventListener('change', async () => {
      const previous = !newTab.checked;
      newTab.disabled = true;
      try { await api.storage.local.set({ jumpOpenInNewTab: newTab.checked }); }
      catch { newTab.checked = previous; status.textContent = t('Could not save settings. Please try again.'); }
      finally { newTab.disabled = false; }
    });
  }
  wrap.appendChild(status);
  const danger = document.createElement('div');
  danger.className = 'danger-zone';
  danger.innerHTML = `<div class="section-title">${t('Danger Zone')}</div>`;
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn-danger-action';
  resetBtn.textContent = t('Reset Database');
  resetBtn.addEventListener('click', async () => {
    if (!confirm(t('This will permanently delete all tracked artists and posts. Continue?'))) return;
    await backup.reset(); await loadData(); render();
  });
  danger.appendChild(resetBtn); wrap.appendChild(danger);
  return wrap;
}
