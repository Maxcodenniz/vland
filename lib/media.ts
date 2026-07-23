export type ContentMediaType = 'image' | 'video' | 'text';

export function normalizeMediaGalleryPaths(paths: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return paths
    .map((path) => path?.trim() ?? '')
    .filter(Boolean)
    .filter((path) => {
      if (seen.has(path)) {
        return false;
      }

      seen.add(path);
      return true;
    });
}

export function inferMediaTypeFromPath(path: string): ContentMediaType {
  const normalizedPath = path.trim().toLowerCase();

  if (!normalizedPath) {
    return 'text';
  }

  if (
    /\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/.test(normalizedPath) ||
    normalizedPath.includes('/video/') ||
    normalizedPath.includes('youtube.com/') ||
    normalizedPath.includes('youtu.be/') ||
    normalizedPath.includes('vimeo.com/') ||
    normalizedPath.includes('facebook.com/') ||
    normalizedPath.includes('fb.watch/')
  ) {
    return 'video';
  }

  if (
    /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|#|$)/.test(normalizedPath) ||
    normalizedPath.includes('/image/')
  ) {
    return 'image';
  }

  return 'image';
}

export function getEmbeddedVideoUrl(path: string) {
  const trimmedPath = path.trim();

  if (!trimmedPath) {
    return null;
  }

  try {
    const url = new URL(trimmedPath);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes('youtu.be')) {
      const videoId = url.pathname.replace(/\//g, '');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) {
        return trimmedPath;
      }

      const videoId = url.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname.includes('vimeo.com')) {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmedPath)}&show_text=false&width=1280`;
    }
  } catch {
    return null;
  }

  return null;
}

export function sanitizeFilename(filename: string) {
  return filename.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
}
