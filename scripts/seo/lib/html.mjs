/**
 * Minimal HTML helpers. No dependencies by design (decision D-3).
 */

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for interpolation into markup or an attribute value. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/** Join class names, dropping falsy entries. */
export function cx(...names) {
  return names.filter(Boolean).join(' ');
}

/** Render a list of items with a mapper, joined by newlines. */
export function each(items, render) {
  return (items ?? []).map(render).join('\n');
}

/**
 * Inline a small amount of prose with support for `code` spans and **bold**.
 * Input is escaped first, so authored content can never inject markup.
 */
export function prose(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

/** Collapse the indentation that template literals introduce. */
export function dedent(text) {
  const lines = String(text).split('\n');
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines
    .map((line) => line.slice(min))
    .join('\n')
    .trim();
}
