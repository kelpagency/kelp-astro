import sanitize from "sanitize-html";

const richContentTags = [
  ...sanitize.defaults.allowedTags,
  "figure",
  "figcaption",
  "picture",
  "source",
  "img",
  "iframe",
  "video",
  "audio",
  "track",
];

const sharedAttributes = [
  "class",
  "id",
  "title",
  "role",
  "style",
  "aria-*",
  "data-*",
];

const cssColorValues = [
  /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i,
  /^(?:rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\)$/i,
  /^(?:transparent|currentcolor|[a-z]+)$/i,
];

/** Sanitize rich HTML received from WordPress before passing it to set:html. */
export function sanitizeHtml(input = "") {
  return sanitize(input, {
    allowedTags: richContentTags,
    allowedAttributes: {
      "*": sharedAttributes,
      a: ["href", "name", "target", "rel", "download"],
      img: [
        "src",
        "srcset",
        "sizes",
        "alt",
        "width",
        "height",
        "loading",
        "decoding",
      ],
      source: ["src", "srcset", "sizes", "type", "media", "width", "height"],
      iframe: [
        "src",
        "width",
        "height",
        "title",
        "loading",
        "allow",
        "allowfullscreen",
        "referrerpolicy",
      ],
      video: [
        "src",
        "width",
        "height",
        "poster",
        "controls",
        "muted",
        "loop",
        "playsinline",
        "preload",
      ],
      audio: ["src", "controls", "muted", "loop", "preload"],
      track: ["src", "kind", "srclang", "label", "default"],
      ol: ["start", "reversed", "type"],
      li: ["value"],
      td: ["colspan", "rowspan", "headers"],
      th: ["colspan", "rowspan", "headers", "scope"],
      time: ["datetime"],
    },
    // Gutenberg adds custom block colors inline alongside classes such as
    // `has-background`. Keep only color declarations; all other inline CSS is
    // still removed.
    allowedStyles: {
      "*": {
        color: cssColorValues,
        "background-color": cssColorValues,
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      source: ["http", "https", "data"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
      "videopress.com",
      "codepen.io",
      "docs.google.com",
    ],
    transformTags: {
      a: (_tagName, attributes) => {
        if (attributes.target === "_blank") {
          const rel = new Set(
            (attributes.rel ?? "").split(/\s+/).filter(Boolean),
          );
          rel.add("noopener");
          rel.add("noreferrer");
          attributes.rel = [...rel].join(" ");
        }
        return { tagName: "a", attribs: attributes };
      },
      iframe: (_tagName, attributes) => ({
        tagName: "iframe",
        attribs: {
          ...attributes,
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
        },
      }),
    },
  });
}

/** Allow only the small formatting subset used in CMS-supplied titles. */
export function sanitizeTitleHtml(input = "") {
  return sanitize(input, {
    allowedTags: ["br", "em", "strong", "span"],
    allowedAttributes: { span: ["class"] },
  });
}

/** Convert CMS HTML to plain text for metadata, labels, and alt text. */
export function toPlainText(input = "") {
  return sanitize(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCodePoint(Number(value)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 16)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}
