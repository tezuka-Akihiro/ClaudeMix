// TableOfContents.tsx - 目次コンポーネント
// 見出し情報を受け取り、ページ内リンク付きの目次を表示

import type { Heading } from "~/lib/blog/post-detail/extractHeadings";

interface TableOfContentsProps {
  headings: Heading[];
  ariaLabel?: string;
}

/**
 * 目次コンポーネント
 * 見出し一覧をアンカーリンク付きリストとして表示
 */
export function TableOfContents({ headings, ariaLabel = '目次' }: TableOfContentsProps) {
  // 目次は h2（##）のみを対象とする
  // h3/h4 はペイウォール区切り指定用であり、目次には含めない
  const tocHeadings = headings.filter((h) => h.level === 2);

  // 見出しがない場合は表示しない
  if (tocHeadings.length === 0) {
    return null;
  }

  /**
   * アンカーリンククリック時のスムーススクロール処理
   * RemixのSPA環境でも確実にスクロールするようにJavaScriptで制御
   */
  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // URLのハッシュを更新（ブラウザ履歴に追加）
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <nav
      data-testid="table-of-contents"
      className="table-of-contents"
      aria-label={ariaLabel}
    >
      <ul className="table-of-contents__list">
        {tocHeadings.map((heading, index) => (
          <li
            key={`${heading.id}-${index}`}
            data-testid="toc-item"
            className={`table-of-contents__item table-of-contents__item--level-${heading.level}`}
          >
            <a
              href={`#${heading.id}`}
              data-testid="toc-link"
              className="table-of-contents__link"
              onClick={(e) => handleClick(e, heading.id)}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
