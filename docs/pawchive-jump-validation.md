# Pawchive jump — v2.3.0

The source sites receive a separate `jump.js` content script. The existing
tracking/favorites script remains limited to archive hosts. The UI is isolated
in a shadow root, uses a fixed Pawchive destination, and requires a user click.
It detects SPA route changes without replacing the site's history functions.

## Resolution

- Patreon `/user?u=ID` maps directly to `/patreon/user/ID`.
- Patreon `/c/handle` and legacy `/handle` use the campaign's creator user id
  from public `__NEXT_DATA__`, checking the vanity matches the current handle.
  Campaign id is never treated as user id. If needed, use an exact service and
  public-id match from Pawchive's creator list.
- Fanbox `handle.fanbox.cc` and `www.fanbox.cc/@handle` resolve the numeric user
  id from public creator cover metadata or the same public archive lookup.
  `/posts/ID` is retained in the destination.
- Pixiv `/users/ID` maps to the Fanbox user with the same id. `/artworks/ID`
  resolves the actual author using `/ajax/illust/ID`, never a recommended link.
- Discord `/channels/SERVER_ID/CHANNEL_ID` maps to `/discord/server/SERVER_ID`.
  Direct messages and invite codes have no server id and are excluded.

Public checks on 2026-10-01 confirmed Khyle's Patreon user id `58020585` differs
from campaign id `7106314`; Fanbox public creator cover metadata and Pawchive's
creator list both resolve `anna-anon` to `37736420`. Pawchive's own JavaScript
uses `/discord/server/ID` for Discord routes. No authenticated Discord UI was
tested. The original Fanbox API requires a source Origin header, so the extension
uses public metadata/archive lookup instead of making a privileged request to it.

## Manual acceptance checks

Automated checks cover route parsing, numeric ids vs nicknames, native page
metadata, Pixiv author lookups, errors, duplicate clicks, SPA route changes, and
background sender/destination restrictions. Public Patreon and Fanbox HTML was
also passed through the real resolver and produced the expected author URLs.

1. Reload the extension in Edge and refresh source-site tabs. Open Patreon
   `https://www.patreon.com/c/khyleri/about` and verify the bottom-right button
   opens `https://pawchive.pw/patreon/user/58020585` in a new tab.
2. Open `https://anna-anon.fanbox.cc/`, then a post by the same author. Check the
   numeric author id and retention of the post id. A missing archive may show 404.
3. Open a Pixiv user, then an artwork. Check the latter goes to its author,
   not the artwork id or a recommended artist. Repeat using SPA navigation.
4. Open a Discord server channel. Check the server id in the destination; move
   to direct messages and verify the button disappears within one second.
5. In Manage Data → Settings, uncheck the new-tab option. The next jump should
   navigate the current tab; the preference should survive a browser restart.
6. Try a creator not in Pawchive, or retry with a failing network. Resolution
   failures should leave the source page open and show a message; repeated clicks
   during lookup must not create extra tabs.
7. Check source-site home/settings/search pages have no jump button and do not
   add records to the plugin's browsing history. Retest Pawchive quick favorites.

New source-site permissions may cause the browser to ask for access or re-enable
the extension after an update. Use the same unpacked folder to preserve its id
and local tracking data. Do not remove the extension to perform this update.
