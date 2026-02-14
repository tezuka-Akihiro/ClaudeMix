import { describe, it, expect } from 'vitest';
import { convertMarkdownToHtml } from '~/lib/blog/post-detail/markdownConverter';

describe('markdownConverter - Pure Logic Layer', () => {
  describe('基本的なマークダウン変換', () => {
    it('見出し（h1-h6）が正しくHTMLに変換される', async () => {
      // Arrange
      const markdown = '# 見出し1\n## 見出し2\n### 見出し3';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('<h1');
      expect(html).toContain('見出し1');
      expect(html).toContain('<h2');
      expect(html).toContain('見出し2');
      expect(html).toContain('<h3');
      expect(html).toContain('見出し3');
    });

    it('段落（p）が正しくHTMLに変換される', async () => {
      // Arrange
      const markdown = 'これは段落です。\n\nこれは別の段落です。';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('<p');
      expect(html).toContain('これは段落です。');
      expect(html).toContain('これは別の段落です。');
    });

    it('リスト（ul, ol）が正しくHTMLに変換される', async () => {
      // Arrange
      const markdown = '- アイテム1\n- アイテム2\n- アイテム3';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('アイテム1');
      expect(html).toContain('アイテム2');
    });
  });

  describe('画像処理', () => {
    it('画像記法がimgタグに変換される', async () => {
      // Arrange
      const markdown = '![サンプル画像](/images/sample.jpg)';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('<img');
      expect(html).toContain('src="/images/sample.jpg"');
      expect(html).toContain('alt="サンプル画像"');
    });

    it('複数の画像が正しく変換される', async () => {
      // Arrange
      const markdown = '![画像1](/img1.jpg)\n\n![画像2](/img2.jpg)';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('/img1.jpg');
      expect(html).toContain('/img2.jpg');
    });

    it('画像に遅延読み込み属性が追加される', async () => {
      // Arrange
      const markdown = '![alt text](/images/sample.jpg)';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('loading="lazy"');
    });

    it('画像にレスポンシブスタイルが追加される', async () => {
      // Arrange
      const markdown = '![alt text](/images/sample.jpg)';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('style=');
      expect(html).toContain('max-width');
    });

    it('alt属性が正しく保持される', async () => {
      // Arrange
      const markdown = '![Sample Image](/images/sample.jpg)';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('alt="Sample Image"');
    });

    it('.lg.avif形式の画像にsrcsetとsizesが自動付与される', async () => {
      // Arrange
      const markdown = '![alt text](/blog/slug/1.lg.avif)';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      expect(html).toContain('srcset="/blog/slug/1.sm.avif 1000w, /blog/slug/1.lg.avif 1200w"');
      expect(html).toContain('sizes="(max-width: 767px) calc(100vw - 32px), 800px"');
      expect(html).toContain('decoding="async"');
    });
  });

  describe('XSSサニタイズ', () => {
    it('悪意のあるHTML属性が安全に処理される', async () => {
      // Arrange
      // HTMLタグを直接埋め込もうとする攻撃
      const markdown = '<img src="x" onerror="alert(\'XSS\')">\n\n# 正常な見出し';

      // Act
      const html = await convertMarkdownToHtml(markdown);

      // Assert
      // onerror イベントハンドラは除去される
      expect(html).not.toContain('onerror');
      expect(html).toContain('正常な見出し');
    });
  });
});
