# Better Pawchive

[中文](README.md) · **English**

A browser extension for Pawchive: favorite creators from cards, jump from source
platforms, and keep track of viewed posts. Supports **Microsoft Edge, Google
Chrome, and Mozilla Firefox**.

A Pawchive edition of [Better Coomer / Kemono](https://github.com/SirSalamandra/better-coomer-kemono),
maintained on **`pawchive`** with the original MIT license and commit history.
This community extension is unaffiliated with Pawchive or the source platforms.

## Download and install

No Node.js installation or compilation required.

- [Download for Edge / Chrome](https://github.com/Afrody9387/better-pawchive/releases/latest/download/better-pawchive-chrome.zip)
- [Download for Firefox](https://github.com/Afrody9387/better-pawchive/releases/latest/download/better-pawchive-firefox.zip)
- [All releases](https://github.com/Afrody9387/better-pawchive/releases)

Use the browser ZIP assets, not GitHub's automatically generated **Source code** archives.

### Edge / Chrome

1. Extract the matching ZIP and keep that folder.
2. Open `edge://extensions` or `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the folder containing `manifest.json`.
5. Refresh open Pawchive and source-site tabs.

### Firefox

The current build is unsigned and intended for temporary developer loading.

1. Extract the Firefox ZIP.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on** and select the extracted `manifest.json`.
4. Refresh site tabs. Reload the temporary add-on after restarting Firefox.

### Updating

Close extension management tabs, overwrite files in the **same folder**, click
**Reload** on the browser's extension page, and refresh website tabs. Keep the
same folder and do not uninstall to retain local identity and browsing records.
New site permissions may require re-enabling the extension.

## Features

| Feature | How to use it |
| --- | --- |
| Quick favorites | Sign in to Pawchive and click ☆ / ★ on creator search and Similar Artists cards, without opening profiles. |
| Jump to Pawchive | Click the bottom-right button on supported source pages; opens a new tab by default. |
| Viewed tags | Visited posts show a green `viewed` tag. Click `x` to clear it. |
| Audio players | Adds players for `.mp3` and `.wav` attachment links. |
| History management | Extension icon → **Manage Data** to browse metadata and counts, remove records, or reset the database. |
| Jump preferences | **Manage Data → Settings** controls opening jumps in a new tab. |

### Supported source pages

| Source | Supported pages | Destination |
| --- | --- | --- |
| Patreon | Numeric creator URLs, vanity URLs, `/c/handle` pages | Creator archive |
| Fanbox | Creator profiles and posts, including subdomains and `/@handle` | Creator or matching post |
| Pixiv | User profiles and artworks | Author's Fanbox archive |
| Discord | Channel URLs containing a server id | Server archive |

Unsupported pages hide the button. Resolution failures show a message and leave
the source page open. A valid destination does **not** guarantee archived content;
missing content may return 404. Discord direct messages/invite links, Fantia,
and DLsite are outside this edition's jump scope.

### Archive hosts

- `pawchive.pw`: quick favorites, viewed tracking, audio, and management.
- `kemono.cr` and `coomer.st`: retain upstream tracking, audio, and management.
  Quick card favorites are specific to Pawchive.

## Data, permissions and limitations

Browsing records stay in the local extension database. Favorites use your
Pawchive website account. Jumps may read public page metadata, Pixiv's artwork
author API, or Pawchive's public creator list when clicked. Source platforms run
only the jump script and do not contribute to extension browsing history.
There is no separate telemetry service; website requests go to the respective
sites. Upstream database names are preserved, but different extension ids do not
automatically share data.

Pawchive's profile API omits total post counts, so management may show `0 total`.
Enrichment is triggered by page visits or management views, not periodic tasks.
Upstream artist/post id keys can share tracking records across platforms.
Site structure and API changes may require updates.

The initial release passes **234 automated tests**. Creator resolution was
checked against real public Patreon and Fanbox HTML. Authenticated flows,
Discord pages, and complete browser workflows still need live verification.

- [Pawchive validation](docs/pawchive-validation.md)
- [Jump checklist](docs/pawchive-jump-validation.md)
- [Report an issue](https://github.com/Afrody9387/better-pawchive/issues) with browser
  version, URL, steps and observed result. Do not include credentials.

## Development

Use Node.js 22 or newer.

```bash
git clone --branch pawchive https://github.com/Afrody9387/better-pawchive.git
cd better-pawchive
npm ci
npm test -- --runInBand
npm run build -- chrome
# or npm run build -- firefox
```

Output is written to `dist/`. Each build replaces the browser manifest.

## Credits and license

- Upstream: [SirSalamandra / better-coomer-kemono](https://github.com/SirSalamandra/better-coomer-kemono).
- Jump behavior inspired by 子斗子's [Kemono跳转](https://github.com/ZIDOUZI/kemono-jump-js), independently reimplemented.
- [MIT License](LICENSE). Packages retain the original copyright and license.
