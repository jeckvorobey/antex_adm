import { describe, expect, it } from 'vitest';

import {
  hasTelegramRenderableContent,
  normalizeTelegramHtml,
  telegramPreviewHtml,
} from '@utils/telegramHtml';

describe('telegramHtml', () => {
  it('преобразует editor html в telegram-safe html', () => {
    expect(
      normalizeTelegramHtml(
        '<p>Привет <strong>мир</strong></p><ul><li>Пункт 1</li><li>Пункт 2</li></ul>',
      ),
    ).toBe('Привет <b>мир</b>\n\n• Пункт 1\n• Пункт 2');
  });

  it('убирает неподдерживаемые теги и оставляет текст ссылки', () => {
    expect(
      normalizeTelegramHtml(
        '<div><span style="color:red">Акция</span> <a href="https://example.com">ссылка</a></div>',
      ),
    ).toBe('Акция <a href="https://example.com">ссылка</a>');
  });

  it('считает пустой editor html пустым сообщением', () => {
    expect(hasTelegramRenderableContent('<p></p>')).toBe(false);
    expect(hasTelegramRenderableContent('<div><br></div>')).toBe(false);
    expect(hasTelegramRenderableContent('<p>🔥</p>')).toBe(true);
  });

  it('готовит preview html с переносами строк для карточки предпросмотра', () => {
    expect(telegramPreviewHtml('Первая строка\nВторая строка')).toBe('Первая строка<br>Вторая строка');
  });
});
