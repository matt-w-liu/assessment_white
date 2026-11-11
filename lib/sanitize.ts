import sanitizeHtml from 'sanitize-html';

/**
 * The only markup the editor schema understands. Anything else (scripts, styles,
 * event handlers, links, images, tables) is dropped while its text is kept.
 */
export const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'strong', 'em', 'u', 's', 'code', 'pre',
  'blockquote', 'ul', 'ol', 'li', 'hr',
];

export function sanitizeDocHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { ol: ['start'] },
    transformTags: {
      b: 'strong',
      i: 'em',
      strike: 's',
      del: 's',
      h4: 'h3',
      h5: 'h3',
      h6: 'h3',
    },
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'title'],
  });
}
