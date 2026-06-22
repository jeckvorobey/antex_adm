const INLINE_TAG_MAP: Record<string, string> = {
  b: 'b',
  strong: 'b',
  i: 'i',
  em: 'i',
  u: 'u',
  s: 's',
  strike: 's',
  del: 's',
  code: 'code',
};

const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'tg:', 'mailto:']);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function decodeHtml(value: string): string {
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return doc.documentElement.textContent ?? '';
}

function cleanupTelegramHtml(value: string): string {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<(b|i|u|s|code)>\s*<\/\1>/g, '')
    .trim();
}

function normalizeHref(rawHref: string | null): string | null {
  const href = rawHref?.trim();

  if (!href) {
    return null;
  }

  if (href.startsWith('/')) {
    return null;
  }

  try {
    const parsed = new URL(href);
    if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return href;
  } catch {
    return null;
  }
}

function normalizeChildren(nodes: NodeListOf<ChildNode> | ChildNode[]): string {
  return Array.from(nodes)
    .map((node) => normalizeNode(node))
    .join('');
}

function normalizeList(element: Element, ordered: boolean): string {
  const items = Array.from(element.children)
    .filter((child) => child.tagName.toLowerCase() === 'li')
    .map((item, index) => {
      const content = cleanupTelegramHtml(normalizeChildren(item.childNodes as NodeListOf<ChildNode>));
      if (!content) {
        return '';
      }
      return ordered ? `${index + 1}. ${content}` : `• ${content}`;
    })
    .filter(Boolean);

  return items.join('\n');
}

function normalizeBlockquote(element: Element): string {
  const content = decodeHtml(cleanupTelegramHtml(normalizeChildren(element.childNodes as NodeListOf<ChildNode>)));
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => `> ${escapeHtml(line)}`).join('\n');
}

function normalizeNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent?.replaceAll('\u00a0', ' ') ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  if (tag === 'br') {
    return '\n';
  }

  if (tag === 'p' || tag === 'div') {
    const content = cleanupTelegramHtml(normalizeChildren(element.childNodes as NodeListOf<ChildNode>));
    return content ? `${content}\n\n` : '';
  }

  if (tag === 'ul' || tag === 'ol') {
    const content = normalizeList(element, tag === 'ol');
    return content ? `${content}\n\n` : '';
  }

  if (tag === 'blockquote') {
    const content = normalizeBlockquote(element);
    return content ? `${content}\n\n` : '';
  }

  if (tag === 'pre') {
    const text = escapeHtml(element.textContent ?? '');
    return text ? `<pre>${text}</pre>` : '';
  }

  if (tag === 'a') {
    const href = normalizeHref(element.getAttribute('href'));
    const content = cleanupTelegramHtml(normalizeChildren(element.childNodes as NodeListOf<ChildNode>));

    if (!content) {
      return '';
    }

    if (href === null) {
      return content;
    }

    return `<a href="${escapeHtml(href)}">${content}</a>`;
  }

  const inlineTag = INLINE_TAG_MAP[tag];
  if (inlineTag) {
    const content = cleanupTelegramHtml(normalizeChildren(element.childNodes as NodeListOf<ChildNode>));
    return content ? `<${inlineTag}>${content}</${inlineTag}>` : '';
  }

  return normalizeChildren(element.childNodes as NodeListOf<ChildNode>);
}

export function normalizeTelegramHtml(rawHtml: string): string {
  const doc = new DOMParser().parseFromString(rawHtml || '', 'text/html');
  return cleanupTelegramHtml(normalizeChildren(doc.body.childNodes));
}

export function telegramPreviewHtml(normalizedHtml: string): string {
  return normalizedHtml.replaceAll('\n', '<br>');
}

export function hasTelegramRenderableContent(rawHtml: string): boolean {
  const normalized = normalizeTelegramHtml(rawHtml);
  if (!normalized) {
    return false;
  }

  const visible = decodeHtml(normalized.replace(/<br\s*\/?>/gi, '\n'));
  return visible.replace(/\s+/g, '').length > 0;
}
