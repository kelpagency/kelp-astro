export const toJetpackImageUrl = (
  url?: string | null,
  params = "",
): string | null => {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return url;
  const isJetpack = /^i\d+\.wp\.com$/.test(parsed.hostname);
  const isWordPress =
    ["admin.kelp.agency", "kelp.agency", "www.kelp.agency"].includes(
      parsed.hostname,
    ) && parsed.pathname.startsWith("/wp-content/uploads/");
  if (!isJetpack && !isWordPress) return url;
  if (!/\.(?:jpe?g|png|gif|webp)(?:$)/i.test(parsed.pathname)) return url;

  if (!isJetpack) {
    parsed = new URL(
      `https://i0.wp.com/${parsed.host}${parsed.pathname}${parsed.search}`,
    );
  }
  // Replace existing resize parameters instead of accumulating duplicates.
  const options = new URLSearchParams(params.replace(/^\?/, ""));
  if (options.has("w") || options.has("h")) {
    parsed.searchParams.delete("fit");
    parsed.searchParams.delete("resize");
  }
  if (options.has("resize") || options.has("fit")) {
    for (const key of ["w", "h", "resize", "fit"])
      parsed.searchParams.delete(key);
  }
  options.forEach((value, key) => parsed.searchParams.set(key, value));
  return parsed.href;
};

export const toJetpackSrcset = (srcset: string): string =>
  srcset.replace(
    /https?:\/\/[^\s,]+(?:,[^\s,]+)*(?=\s+\d+[wx]|\s*$)/g,
    (url) => toJetpackImageUrl(url) ?? url,
  );
