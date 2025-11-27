// flowGroupBuilder - 純粋ロジック層
// チェックポイントを「共通（common）」「セクション別（branched）」にグループ化
// 副作用なし、テスタブルなビジネスロジック

/**
 * カスタムバリデーションエラー
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * チェックポイント型定義
 */
export interface Checkpoint {
  id: string;
  name: string;
  path: string;
  exists: boolean;
  status: 'pending' | 'completed' | 'selected';
  flowType: 'common' | 'branched';
  section?: string; // branchedの場合に必須
}

/**
 * セクション型定義
 */
export interface Section {
  name: string;
}

/**
 * ブランチグループ（セクション別チェックポイント群）
 */
export interface BranchedFlowGroup {
  sectionName: string;
  checkpoints: Checkpoint[];
}

/**
 * フローグループ出力型
 */
export interface FlowGroup {
  common: Checkpoint[];
  commonSection: Checkpoint[];
  branched: BranchedFlowGroup[];
}

/**
 * チェックポイントを「共通（common）」「セクション別（branched）」にグループ化
 *
 * @param checkpoints - チェックポイント配列
 * @param sections - セクション配列
 * @returns グループ化されたフローグループ
 * @throws ValidationError - セクション数が6を超える場合、またはセクション名が重複している場合
 */
export function buildFlowGroups(checkpoints: Checkpoint[], sections: Section[]): FlowGroup {
  // セクション数検証（1-6の範囲）
  if (sections.length > 6) {
    throw new ValidationError(
      `セクション数が最大値（6）を超えています（現在: ${sections.length}）。project.tomlを見直してください。`
    );
  }

  // セクション名の重複チェック
  const sectionNames = sections.map(s => s.name);
  const uniqueSectionNames = new Set(sectionNames);
  if (sectionNames.length !== uniqueSectionNames.size) {
    throw new ValidationError('セクション名が重複しています。');
  }

  // 共通チェックポイントを抽出
  const common = checkpoints.filter(cp => cp.flowType === 'common');

  // commonセクションのチェックポイントを抽出
  const commonSection = checkpoints.filter(
    cp => cp.flowType === 'branched' && cp.section === 'common'
  );

  // セクション別チェックポイントをグループ化
  const branchedMap = new Map<string, Checkpoint[]>();

  // セクションごとに空の配列を初期化（commonセクションを除外）
  for (const section of sections) {
    if (section.name !== 'common') {
      branchedMap.set(section.name, []);
    }
  }

  // チェックポイントをセクションごとに振り分け（commonセクションを除外）
  for (const checkpoint of checkpoints) {
    if (checkpoint.flowType === 'branched' && checkpoint.section && checkpoint.section !== 'common') {
      const sectionCheckpoints = branchedMap.get(checkpoint.section);
      if (sectionCheckpoints) {
        sectionCheckpoints.push(checkpoint);
      }
    }
  }

  // BranchedFlowGroup配列に変換（commonセクションを除外）
  const branched: BranchedFlowGroup[] = [];
  for (const section of sections) {
    if (section.name !== 'common') {
      const sectionCheckpoints = branchedMap.get(section.name) || [];
      branched.push({
        sectionName: section.name,
        checkpoints: sectionCheckpoints,
      });
    }
  }

  return {
    common,
    commonSection,
    branched,
  };
}