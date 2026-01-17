// targetValidation - Logic (lib層)
// ターゲットパラメータを検証し、不正値の場合はデフォルト値にフォールバックする純粋関数

/**
 * ターゲットパラメータを検証する（spec値注入パターン）
 *
 * @param target - 検証するターゲットスラッグ（例: 'engineer', 'designer'）
 * @param supportedTargets - spec.yamlから読み込んだサポート対象のターゲット配列
 * @param defaultTarget - 不正なターゲットの場合のデフォルト値
 * @returns 検証済みのターゲットスラッグ（サポート対象または デフォルト値）
 *
 * @example
 * validateTarget('engineer', ['engineer', 'designer'], 'engineer') // => 'engineer'
 * validateTarget('invalid', ['engineer', 'designer'], 'engineer') // => 'engineer'
 * validateTarget('', ['engineer', 'designer'], 'engineer') // => 'engineer'
 */
export function validateTarget(
  target: string | undefined,
  supportedTargets: string[],
  defaultTarget: string
): string {
  // 空文字またはundefinedの場合、デフォルト値を返す
  if (!target || target.trim() === '') {
    return defaultTarget;
  }

  // サポート対象のターゲットリストに含まれているか確認
  const normalizedTarget = target.trim().toLowerCase();
  const isSupported = supportedTargets
    .map(t => t.toLowerCase())
    .includes(normalizedTarget);

  // サポート対象の場合はそのまま返す、そうでない場合はデフォルト値を返す
  return isSupported ? target.trim() : defaultTarget;
}

/**
 * ターゲットが有効かどうかを判定する純粋関数
 *
 * @param target - 判定するターゲットスラッグ
 * @param supportedTargets - spec.yamlから読み込んだサポート対象のターゲット配列
 * @returns ターゲットが有効な場合true、無効な場合false
 *
 * @example
 * isValidTarget('engineer', ['engineer', 'designer']) // => true
 * isValidTarget('invalid', ['engineer', 'designer']) // => false
 * isValidTarget('', ['engineer', 'designer']) // => false
 */
export function isValidTarget(
  target: string | undefined,
  supportedTargets: string[]
): boolean {
  if (!target || target.trim() === '') {
    return false;
  }

  const normalizedTarget = target.trim().toLowerCase();
  return supportedTargets
    .map(t => t.toLowerCase())
    .includes(normalizedTarget);
}
