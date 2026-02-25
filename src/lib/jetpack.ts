export const toJetpackImageUrl = (url?: string | null, params = ''): string | null => {
  if (!url) return null;
  const normalizedParams = params.replace(/^\?/, '');

  // Avoid wrapping an already optimized Jetpack URL.
  if (url.includes('i0.wp.com')) {
    if (!normalizedParams) return url;
    return `${url}${url.includes('?') ? '&' : '?'}${normalizedParams}`;
  }

  return `https://i0.wp.com/${url.replace(/^https?:\/\//, '')}${normalizedParams ? `?${normalizedParams}` : ''}`;
};
