# SsoT Refactor 実施計画書

**作成日**: 2026-02-06
**スキル**: `.claude/skills/ssot-refactor`
**想定人数**: 5人
**目的**: spec.yaml、設計書、実装、テストにおけるSpec Loader導入と、ハードコード値のspec参照への置換

---

## 📊 プロジェクト構成

### サービス・セクション一覧

| サービス | セクション | spec.yaml | func-spec.md |
|---------|-----------|-----------|--------------|
| **shared** | - | 4ファイル | - |
| **blog** | common | ✓ | ✓ |
| **blog** | posts | ✓ | ✓ |
| **blog** | post-detail | ✓ | ✓ |
| **blog** | landing | ✓ | ✓ |
| **account** | common | ✓ | ✓ |
| **account** | authentication | ✓ | ✓ |
| **account** | profile | ✓ | ✓ |
| **account** | subscription | ✓ | ✓ |

**合計**: 12 spec.yaml + 8 func-spec.md = 20ファイル + 実装 + テスト

---

## 🎯 実施戦略

### 基本原則

1. **依存関係を尊重** - shared → common → 個別セクション
2. **ドメイン単位で分離** - blog/accountを並行実行
3. **レイヤー順序を守る** - spec.yaml → 設計書 → 実装 → テスト
4. **ファイルの競合を回避** - 同一ファイルを複数人で触らない

### 作業者配置

| Worker | 担当ドメイン | 役割 |
|--------|------------|------|
| **Worker 1** | shared | 全サービスの基盤spec（最優先） |
| **Worker 2** | blog/common | blogサービスの共通部品 |
| **Worker 3** | account/common | accountサービスの共通部品 |
| **Worker 4** | blog個別セクション | posts, post-detail, landing |
| **Worker 5** | account個別セクション | authentication, profile, subscription |

---

## 📅 実施フェーズ

### Phase 0: 事前準備（全員）

**所要時間**: 30分

- [ ] ssot-refactorスキルの理解
- [ ] Spec Loader使い分けの確認
- [ ] 作業ブランチの作成
  - `ssot-refactor/shared`
  - `ssot-refactor/blog-common`
  - `ssot-refactor/account-common`
  - `ssot-refactor/blog-sections`
  - `ssot-refactor/account-sections`

**成果物**: 各自の作業ブランチ

---

### Wave 1: Shared（最優先）

**担当**: Worker 1
**ブロッカー**: なし
**所要時間**: 2-3時間

#### Step 1-1: スキャン（Phase 1）

```bash
cd c:\Users\tizuh\Documents\ClaudeMix
git checkout -b ssot-refactor/shared
```

**対象spec**:

- `app/specs/shared/project-spec.yaml`
- `app/specs/shared/validation-spec.yaml`
- `app/specs/shared/responsive-spec.yaml`
- `app/specs/shared/server-spec.yaml`

**検出対象**:

- sharedのspecを使うべき実装ファイル
- sharedのspecを使うべきテストファイル

**成果物**: `shared未導入ファイル一覧.md`

#### Step 1-2: 分析（Phase 2）

- ハードコードされたプロジェクト名、バリデーションルール等を特定
- リファクタリング優先度の決定

**成果物**: `sharedリファクタ計画.md`

#### Step 1-3: リファクタ（Phase 3）

**対象レイヤー**:

1. spec.yaml自体（anchor/alias整理）
2. 設計書（該当なし）
3. 実装（app/routes/, app/lib/）
4. テスト（tests/）

**作業内容**:

- spec loader import追加
- ハードコード値をspec参照に置換
- 型定義追加

#### Step 1-4: 検証（Phase 4）

```bash
npm run typecheck
npm test
```

**成果物**: Wave 1完了報告

**マージタイミング**: Wave 1完了後、即座にmainへマージ（Wave 2のブロッカー解除）

---

### Wave 2: Common層（並行実行）

**ブロッカー**: Wave 1完了後に開始
**所要時間**: 各2-3時間

#### Worker 2: blog/common

**ブランチ**: `ssot-refactor/blog-common`

**対象**:

- `app/specs/blog/common-spec.yaml`
- `develop/blog/common/func-spec.md`
- `app/components/blog/common/`
- `app/lib/blog/common/`
- `tests/blog/common/`

**依存関係**:

- shared specを参照可能（Wave 1完了後）

**作業手順**:

1. Phase 1: スキャン（blog/common未導入ファイル検出）
2. Phase 2: 分析（ハードコードされたヘッダー/フッターのテキスト等）
3. Phase 3: リファクタ
   - spec.yaml: anchor/alias整理、sharedへの参照追加
   - func-spec.md: spec参照の追記
   - 実装: spec loader導入
   - テスト: tests/utils/loadSpec使用
4. Phase 4: 検証

#### Worker 3: account/common

**ブランチ**: `ssot-refactor/account-common`

**対象**:

- `app/specs/account/common-spec.yaml`
- `develop/account/common/func-spec.md`
- `app/components/account/common/`
- `app/lib/account/common/`（セッション管理等）
- `tests/account/common/`

**依存関係**:

- shared specを参照可能（Wave 1完了後）

**作業手順**:

1. Phase 1: スキャン
2. Phase 2: 分析（セッション管理、認証保護のハードコード値）
3. Phase 3: リファクタ
   - spec.yaml: anchor/alias整理、sharedへの参照追加
   - func-spec.md: spec参照の追記
   - 実装: spec loader導入（KV、セッション周り）
   - テスト: tests/utils/loadSpec使用
4. Phase 4: 検証

**マージタイミング**: Wave 2完了後、両ブランチをmainへマージ（Wave 3のブロッカー解除）

---

### Wave 3: 個別セクション（並行実行）

**ブロッカー**: Wave 2完了後に開始
**所要時間**: 各3-4時間

#### Worker 4: blog個別セクション

**ブランチ**: `ssot-refactor/blog-sections`

**対象セクション**: posts, post-detail, landing（3セクション）

##### 4-1: blog/posts

**対象**:

- `app/specs/blog/posts-spec.yaml`
- `develop/blog/posts/func-spec.md`
- `app/routes/blog.posts/`
- `app/components/blog/posts/`
- `tests/blog/posts/`

**作業手順**:

1. Phase 1-4実行（posts）
2. 依存関係確認: blog/common spec参照

##### 4-2: blog/post-detail

**対象**:

- `app/specs/blog/post-detail-spec.yaml`
- `develop/blog/post-detail/func-spec.md`
- `app/routes/blog.post-detail/`
- `app/components/blog/post-detail/`
- `tests/blog/post-detail/`

**作業手順**:

1. Phase 1-4実行（post-detail）
2. 依存関係確認: ペイウォール、サブスクリプション連携のspec参照

##### 4-3: blog/landing

**対象**:

- `app/specs/blog/landing-spec.yaml`
- `develop/blog/landing/func-spec.md`
- `app/routes/blog.landing/`
- `app/components/blog/landing/`
- `tests/blog/landing/`

**作業手順**:

1. Phase 1-4実行（landing）
2. 依存関係確認: ターゲット別コンテンツ、CTAのspec参照

**実施順序**: posts → post-detail → landing（順次実行、または並行可）

#### Worker 5: account個別セクション

**ブランチ**: `ssot-refactor/account-sections`

**対象セクション**: authentication, profile, subscription（3セクション）

##### 5-1: account/authentication

**対象**:

- `app/specs/account/authentication-spec.yaml`
- `develop/account/authentication/func-spec.md`
- `app/routes/account.authentication/`
- `app/components/account/authentication/`
- `app/lib/account/authentication/`
- `tests/account/authentication/`

**作業手順**:

1. Phase 1-4実行（authentication）
2. 依存関係確認: account/common spec参照（セッション管理）

##### 5-2: account/profile

**対象**:

- `app/specs/account/profile-spec.yaml`
- `develop/account/profile/func-spec.md`
- `app/routes/account.profile/`
- `app/components/account/profile/`
- `tests/account/profile/`

**作業手順**:

1. Phase 1-4実行（profile）
2. 依存関係確認: authentication、validation spec参照

##### 5-3: account/subscription

**対象**:

- `app/specs/account/subscription-spec.yaml`
- `develop/account/subscription/func-spec.md`
- `app/routes/account.subscription/`
- `app/components/account/subscription/`
- `tests/account/subscription/`

**作業手順**:

1. Phase 1-4実行（subscription）
2. 依存関係確認: Stripe連携、プラン情報のspec参照

**実施順序**: authentication → profile → subscription（順次実行、または並行可）

**マージタイミング**: Wave 3完了後、両ブランチをmainへマージ

---

## 🔀 マージ戦略

### マージ順序

```
Wave 1: shared
    ↓ マージ → main
Wave 2: blog-common, account-common
    ↓ マージ → main
Wave 3: blog-sections, account-sections
    ↓ マージ → main
完了
```

### コンフリクト回避チェックリスト

- [ ] 同一ファイルを複数人が編集していないか
- [ ] 依存元（shared, common）がマージ済みか
- [ ] 各Waveの全作業者が完了してからマージ
- [ ] マージ前に `npm run typecheck && npm test` が通ること

---

## 📋 各Worker用チェックリスト

### 共通手順（全Worker）

#### Phase 1: スキャン

- [ ] 担当ドメインのspec.yamlを確認
- [ ] `/ssot-refactor` スキル実行（Phase 1）
- [ ] spec loader未導入ファイル一覧を作成
- [ ] 未導入ファイル数を記録

#### Phase 2: 分析

- [ ] 各ファイルで使用すべきspecを特定
- [ ] ハードコードされた値をリストアップ
- [ ] リファクタリング優先度を決定
- [ ] 複雑性が高い場合はオペレータに相談

#### Phase 3: リファクタ

**spec.yamlの修正**:

- [ ] anchor/aliasで共通値を定義
- [ ] 他のspecへの参照を追加（merge key使用）
- [ ] YAMLの構造を整理

**func-spec.mdの修正**:

- [ ] spec参照の追記
- [ ] ハードコード値をspec参照に変更

**実装の修正**:

- [ ] `loadSpec` importを追加
  - Route/lib: `import { loadSpec } from '~/spec-loader/specLoader.server'`
- [ ] ハードコード値をspec参照に置換
- [ ] 型定義を追加（必要な場合）

**テストの修正**:

- [ ] `loadSpec` importを追加
  - Vitest/E2E: `import { loadSpec } from 'tests/utils/loadSpec'`
- [ ] テストのハードコード値をspec参照に置換

#### Phase 4: 検証

- [ ] `npm run typecheck` が通る
- [ ] `npm test` が通る
- [ ] spec loader導入率を再計測
- [ ] 成果物レポートを作成

---

## 📊 進捗管理

### Wave 1: Shared

| Worker | 担当 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | 状態 |
|--------|------|---------|---------|---------|---------|------|
| Worker 1 | shared | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |

### Wave 2: Common層

| Worker | 担当 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | 状態 |
|--------|------|---------|---------|---------|---------|------|
| Worker 2 | blog/common | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |
| Worker 3 | account/common | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |

### Wave 3: 個別セクション

| Worker | 担当 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | 状態 |
|--------|------|---------|---------|---------|---------|------|
| Worker 4 | blog/posts | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |
| Worker 4 | blog/post-detail | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |
| Worker 4 | blog/landing | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |
| Worker 5 | account/authentication | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |
| Worker 5 | account/profile | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |
| Worker 5 | account/subscription | ⬜ | ⬜ | ⬜ | ⬜ | 未着手 |

**凡例**: ⬜ 未着手 | 🟨 進行中 | ✅ 完了

---

## 🎓 参照資料

### スキル関連

- [SKILL.md](.claude/skills/ssot-refactor/SKILL.md)
- [Phase 1: スキャン](.claude/skills/ssot-refactor/prompts/01-scan.md)
- [Phase 2: 分析](.claude/skills/ssot-refactor/prompts/02-analyze.md)
- [Phase 3: リファクタ](.claude/skills/ssot-refactor/prompts/03-refactor.md)
- [Phase 4: 検証](.claude/skills/ssot-refactor/prompts/04-verify.md)

### アーキテクチャ

- [YAML参照ガイド](docs/boilerplate_architecture/YAML_REFERENCE_GUIDE.md)
- [Spec Loader Rule](.claude/rules/ssot/spec-loader.md)
- [Spec Loader実装](app/spec-loader/specLoader.server.ts)
- [Test Utils](tests/utils/loadSpec.ts)

---

## 🚨 リスク管理

### 想定リスク

| リスク | 影響度 | 対策 |
|-------|--------|------|
| Wave 1完了遅延 | 高 | Worker 1に経験者をアサイン |
| 複数ブランチのコンフリクト | 中 | Wave完了ごとに即座にマージ |
| spec.yaml構造の複雑化 | 中 | anchor/aliasは最小限に |
| テスト失敗 | 中 | Phase 4で必ず検証 |
| 作業見積もりのズレ | 低 | 1日1回進捗確認 |

### エスカレーション基準

以下の場合はオペレータに報告：

- Phase 3でコードが著しく複雑になる
- Phase 4で解決困難なテスト失敗
- 依存関係の循環参照を発見
- 想定外のハードコード値の発見

---

## 📈 成功基準

### 定量指標

- [ ] spec loader導入率 100%
- [ ] ハードコード値削減率 90%以上
- [ ] typecheck/testが全て通過
- [ ] 全Wave完了

### 定性指標

- [ ] spec.yamlの構造が整理されている
- [ ] 設計書にspec参照が明記されている
- [ ] 実装とテストでspec loaderが正しく使い分けられている
- [ ] コンフリクトなくマージ完了

---

## 📝 備考

### 作業時の注意事項

1. **既存のロジックは維持** - spec loader導入のみ、機能変更はしない
2. **正しいローダーを使用** - サーバー側とテスト側で使い分け
3. **anchor名はアンダースコア接頭辞** - `_defaults`, `_field_base` など
4. **マージは慎重に** - 各Wave完了後に全員で確認

### キックオフ時の確認事項

- [ ] 全員がssot-refactorスキルを理解
- [ ] 作業ブランチ命名規則の確認
- [ ] 進捗共有の頻度（推奨: 1日1回）
- [ ] コミュニケーションツール

---

**計画書バージョン**: 1.0
**最終更新**: 2026-02-06
