# Pawchive compatibility — 2026-10-01

Branch: `feat/pawchive-quick-follow`. Based on the upstream main branch.

## Public-site checks

Read the public `/artists`, `/patreon/user/58020585`, and
`/patreon/user/58020585/recommended` pages and the site's linked JavaScript.
Search and Similar Artists both use `.user-card` anchors with creator routes.
Post cards still have `data-id` and `footer > div > div`, matching viewed tags.
Creator icons and banners are served at `/icons/{service}/{id}` and
`/banners/{service}/{id}`, rather than at `img.pawchive.pw`.
Post thumbnails use `https://img.pawchive.pw/thumbnail/data{file.path}`.

The public profile API returned creator id/name/service and timestamps, but no
`post_count`; the extension's count therefore retains its existing value or 0.
The post API returned a flat post object with an attachments array. Both flat
Pawchive responses and wrapped Kemono responses are supported.

The native JavaScript confirms these account endpoints:

- GET `/api/v1/account/favorites?type=artist` — array of creator records.
- POST `/api/v1/favorites/creator/{service}/{id}` — favorite.
- DELETE the same URL — unfavorite.
- `localStorage.logged_in === 'yes'` and the `favs` cache are used by the site.

The extension sends account requests from the Pawchive content script to
absolute URLs on the current site with credentials included, supporting Firefox
MV2 as well as Chrome MV3. See [Mozilla's content-script fetch documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#xhr_and_fetch).
The API is only mutated by an explicit star click.
No account credentials are copied into extension storage.

## Automated checks

The Jest suite checks quick follow, unfollow, existing state, duplicate clicks,
dynamic cards, service/id separation, native cache synchronization, logged-out
visitors, failed state reads, and failed mutations. It also checks Pawchive host
resolution, artwork paths, and flat/wrapped post normalization alongside the
existing tracking, audio, database, management, and enrichment tests.

The upstream icon test was already failing because its expectations predated
the current manifest icon sizes; its assertions now match the existing assets.

202 tests passed. Both Chrome and Firefox builds succeeded. A local browser
preview using the site's actual Similar Artists markup and styles confirmed
star placement, favorite/unfavorite state, and staying on the same page. The
preview uses simulated account responses; it is not an authenticated-site test.
The local preview screenshot is excluded from the public repository because it
contains source-site creator artwork.

## Live checks still needed

No authenticated account changes were made during development. Logged-in
favorite/unfavorite and persistent Favorites-page behavior still need a real
browser check with the user's account. Chrome/Firefox extension loading and
HTMX/back-navigation tracking also need end-to-end checks.

1. Load the matching unpacked build and refresh Pawchive.
2. Sign in. Search creators; click ☆ and confirm it becomes ★ without navigating.
3. Open Favorites and confirm the creator appears. Remove it using ★.
4. Repeat on Similar Artists; check newly loaded cards and duplicate cards.
5. Open a post, return to the creator list, check the viewed tag, then use x to
   clear it. Repeat using browser Back and a search-results page.
6. Open an audio attachment post and confirm its player works.
7. Open extension management and verify tracked artists, post titles,
   attachments, artwork, and links. Popup counts should match stored records.

The database still uses upstream artist/post id keys without host/service
namespacing. Matching ids across services/sites can share tracking records.
This branch preserves that schema; account favorites use service + id keys.
