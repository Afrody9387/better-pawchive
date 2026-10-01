import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import hosts from '../shared/constants/supportedHosts.json';
import sources from '../shared/constants/jumpSources.json';

test.each(['chrome', 'firefox'])('%s build keeps tracking scripts off jump-source platforms', target => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pawchive-manifest-'));
  try {
    const files = [
      'scripts/build.js', 'LICENSE', 'src/shared/constants/supportedHosts.json', 'src/shared/constants/jumpSources.json',
      `manifests/${target}.template.json`, 'src/ui/popup/popup.html', 'src/ui/management/management.html',
      'src/ui/styles.css', 'src/ui/management/management.css', 'src/ui/popup/popup.css',
    ];
    for (const file of files) {
      const destination = path.join(root, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.resolve(__dirname, '../..', file), destination);
    }
    fs.mkdirSync(path.join(root, 'dist'));
    execFileSync(process.execPath, [path.join(root, 'scripts/build.js'), target]);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/manifest.json'), 'utf8'));
    const archivePatterns = hosts.map(host => `https://${host}/*`);
    expect(manifest.content_scripts[0].matches).toEqual(archivePatterns);
    expect(manifest.content_scripts[1]).toEqual({ matches: sources.matches, js: ['jump.js'], run_at: 'document_idle' });
    if (target === 'chrome') {
      expect(manifest.host_permissions).toEqual([...archivePatterns, ...sources.matches]);
      expect(manifest.web_accessible_resources[0].matches).toEqual(archivePatterns);
    } else {
      expect(manifest.permissions).toEqual(expect.arrayContaining([...archivePatterns, ...sources.matches]));
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
