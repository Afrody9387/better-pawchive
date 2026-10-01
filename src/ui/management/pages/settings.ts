import { BackupStore } from "../../../core/database/contracts";

export function renderSettings(
  backup: BackupStore,
  loadData: () => Promise<void>,
  render: () => void,
): HTMLElement {
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1>Settings</h1><p>Manage extension data and preferences</p>`;
  wrap.appendChild(header);

  const jumpOption = document.createElement('label');
  jumpOption.style.cssText = 'display:flex;align-items:center;gap:10px;margin:20px 0;';
  const newTab = document.createElement('input');
  newTab.type = 'checkbox';
  newTab.checked = true;
  jumpOption.append(newTab, document.createTextNode('跳转至 Pawchive 时在新标签页打开'));
  wrap.appendChild(jumpOption);
  const extensionApi = typeof browser !== 'undefined' ? browser : typeof chrome !== 'undefined' ? chrome : null;
  if (extensionApi) {
    newTab.disabled = true;
    extensionApi.storage.local.get('jumpOpenInNewTab').then(({ jumpOpenInNewTab = true }) => {
      newTab.checked = jumpOpenInNewTab;
      newTab.disabled = false;
    }).catch(console.error);
    newTab.addEventListener('change', () => {
      extensionApi.storage.local.set({ jumpOpenInNewTab: newTab.checked }).catch(console.error);
    });
  }

  const danger = document.createElement('div');
  danger.className = 'danger-zone';
  danger.innerHTML = `<div class="section-title">Danger Zone</div>`;

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn-danger-action';
  resetBtn.textContent = 'Reset Database';
  resetBtn.addEventListener('click', async () => {
    if (!confirm('This will permanently delete all tracked artists and posts. Continue?')) return;
    await backup.reset();
    await loadData();
    render();
  });

  danger.appendChild(resetBtn);
  wrap.appendChild(danger);

  return wrap;
}
