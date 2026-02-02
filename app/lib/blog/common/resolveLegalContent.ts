/**
 * resolveLegalContent.ts
 * Purpose: 特商法コンテンツのプレースホルダーを環境変数の値で置換する
 *
 * @layer lib層
 * @responsibility 特商法の秘匿項目（名前、住所、電話番号）を環境変数から解決
 */

interface ResolveLegalContentParams {
  /** specから取得した特商法HTMLテンプレート */
  template: string;
  /** 環境変数 LEGAL_PRIVATE_INFO の値（"名前|住所|電話番号" 形式） */
  privateInfo?: string;
}

interface ResolveLegalContentResult {
  /** プレースホルダーを置換済みのHTML */
  content: string;
}

/**
 * 特商法コンテンツのプレースホルダーを環境変数の値で置換する
 *
 * @example
 * const { content } = resolveLegalContent({
 *   template: landingSpec.footer.legal_content,
 *   privateInfo: env?.LEGAL_PRIVATE_INFO,
 * });
 */
export function resolveLegalContent({
  template,
  privateInfo,
}: ResolveLegalContentParams): ResolveLegalContentResult {
  const [
    name = '[運営責任者名]',
    address = '[所在地]',
    phone = '[電話番号]',
  ] = privateInfo?.split('|') ?? [];

  const content = template
    .replace(/\{\{LEGAL_SELLER_NAME\}\}/g, name)
    .replace(/\{\{LEGAL_SELLER_ADDRESS\}\}/g, address)
    .replace(/\{\{LEGAL_SELLER_PHONE\}\}/g, phone);

  return { content };
}
