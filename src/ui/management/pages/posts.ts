import { t } from "../../../shared/i18n";
import { Artist } from "../../../shared/types/Artist";
import { Post } from "../../../shared/types/Post";
import { emptyState, escapeHtml } from "../utils/format";
import { renderPostCard } from "../components/postCard";
import { createMasonry } from "../utils/masonry";

export function renderPosts(
  artists: Artist[],
  posts: Post[],
  filterArtistId: string | null,
  navigate: (page: string, id?: string) => void,
  deletePost: (id: string, title: string) => void,
): HTMLElement {
  const wrap = document.createElement('div');

  const filteredArtist = filterArtistId
    ? artists.find(a => a.id === filterArtistId) ?? null
    : null;

  const visiblePosts = filterArtistId
    ? posts.filter(p => p.artist_id === filterArtistId)
    : posts;

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1>${t('Posts')}</h1><p>${t(visiblePosts.length === 1 ? '{count} post viewed' : '{count} posts viewed', { count: visiblePosts.length })}</p>`;
  wrap.appendChild(header);

  if (filteredArtist) {
    const bar = document.createElement('div');
    bar.className = 'filter-bar';

    const label = document.createElement('span');
    label.className = 'filter-bar-label';
    label.innerHTML = `${t('Showing posts for')} <strong>${escapeHtml(filteredArtist.name || filteredArtist.id)}</strong>`;
    bar.appendChild(label);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-clear-filter';
    clearBtn.textContent = t('View all posts');
    clearBtn.addEventListener('click', () => navigate('posts'));
    bar.appendChild(clearBtn);

    wrap.appendChild(bar);
  }

  if (!visiblePosts.length) {
    wrap.appendChild(emptyState('📄', filterArtistId
      ? t('No posts tracked for this artist yet.')
      : t('No posts tracked yet.\nVisit a post page on pawchive.pw, kemono.cr, or coomer.st to get started.')
    ));
    return wrap;
  }

  const sorted = [...visiblePosts].sort((a, b) => (b.viewed_at > a.viewed_at ? 1 : -1));

  const cards: HTMLElement[] = [];
  for (const post of sorted) {
    const artist = artists.find(a => a.id === post.artist_id);
    cards.push(renderPostCard(post, artist, deletePost, true));
  }

  wrap.appendChild(createMasonry(cards));

  return wrap;
}
