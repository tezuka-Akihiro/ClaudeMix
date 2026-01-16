# ブログ記事リファクタリング並列実行計画書

## 📊 現在の進捗状況

### ✅ 完了済み（16記事）

- Lighthouse最適化系: 6記事
- TypeScriptリファクタリング系: 5記事
- E2Eテスト系: 3記事
- Remix/Cloudflare Workers系: 1記事（cloudflare-workers-shiki-build-time-html）
- その他: 1記事（react-hooks-cloudflare-workers-challenge等）

### 🔄 残作業（9記事）

- **Remix/Cloudflare Workers系**: 4記事（うち1記事はpartial）
- **TypeScript系**: 1記事
- **その他技術記事**: 4記事

---

## 🎯 並列実行戦略（3並列）

### 並列実行の原則

- 各作業者は独立したファイルを担当（競合回避）
- 作業完了後は即座に報告し、次のバッチに進む
- 各記事のリファクタリング所要時間: 約3-5分

---

## 📋 作業分担

### **Worker A: Remix/Cloudflare Workers系（3記事）**

#### A-1: cloudflare-pages-deployment-challenge.md

- **状態**: freeContentHeadingのみ追加済み
- **タスク**: 無料/有料セクションの橋渡し文とリファクタリング
- **freeContentHeading**: `💡 根本原因の特定`

#### A-2: remix-css-loading-issue.md

- **状態**: 未着手
- **タスク**: フルリファクタリング（freeContentHeading追加 + セクション分離）
- **カテゴリ**: Tutorials & Use Cases

#### A-3: ai-remix-react-history-ssr.md

- **状態**: 未着手
- **タスク**: フルリファクタリング
- **カテゴリ**: Claude Best Practices

**推定所要時間**: 12-15分

---

### **Worker B: Remix + TypeScript系（3記事）**

#### B-1: remix-cloudflare-workers-ogp-generation.md

- **状態**: 未着手
- **タスク**: フルリファクタリング
- **カテゴリ**: Tutorials & Use Cases

#### B-2: refactoring-typescript-types-final-touches.md

- **状態**: 未着手
- **タスク**: フルリファクタリング
- **カテゴリ**: Claude Best Practices

#### B-3: jamstack-prebuild-architecture.md

- **状態**: 未着手
- **タスク**: フルリファクタリング
- **カテゴリ**: ClaudeMix Philosophy

**推定所要時間**: 12-15分

---

### **Worker C: その他技術記事（3記事）**

#### C-1: refactoring-single-source-of-truth.md

- **状態**: 未着手
- **タスク**: フルリファクタリング
- **カテゴリ**: Claude Best Practices

#### C-2: claude-md-refactoring.md

- **状態**: 未着手
- **タスク**: フルリファクタリング
- **カテゴリ**: Claude Best Practices

#### C-3: blog-metadata-lint-system.md

- **状態**: 未着手
- **タスク**: フルリファクタリング
- **カテゴリ**: Claude Best Practices

**推定所要時間**: 12-15分

---

## 🔧 リファクタリング手順（各Worker共通）

### 推奨: blog-paywall-refactorerスキルの使用

**最も効率的かつ品質が高い方法**は、`blog-paywall-refactorer`スキルを使用することです。

```
/blog-paywall-refactorer content/blog/posts/{記事名}.md
```

このスキルは以下を自動的に実行します：

- freeContentHeadingの追加
- S1-S2レベルの具体的表現の抽象化
- 達成した成果表の追加
- 橋渡し文の追加（AI限界 + 根本原因 + 価値提示）
- 有料部分の導入文追加

**手動実行する場合**は、以下の手順に従ってください。

### ステップ1: 記事の読み込み

```
Read: content/blog/posts/{記事名}.md
```

### ステップ2: freeContentHeadingの追加

Frontmatterに以下を追加：

```yaml
freeContentHeading: "適切な見出し名"
```

**見出し選定基準**:

- 無料部分の最後のh2/h3見出し
- 典型的なパターン: `💡 根本原因の特定`, `🔍 調査と試行錯誤のプロセス`

### ステップ3: 無料部分のリファクタリング

- **削除対象**: S1-S2レベルの具体的な技術名、コード、ファイルパス
- **抽象化**: S3-S9レベルの概念的な表現に変換
- **成果表の追加**:

```markdown
### 達成した成果

| 改善項目 | Before | After |
| :--- | :--- | :--- |
| 項目1 | 問題点 | 改善結果 |
```

### ステップ4: 橋渡し文の追加（重要）

無料部分の最後に以下の3要素を含む文章を追加：

1. **AIの限界**: 「AIは〇〇を提案し続けます」「対症療法」
2. **根本原因**: 抽象的に提示
3. **有料部分の価値**: 「武器」「再現性」「時間節約」

**テンプレート例**:

```markdown
AIに「〇〇」と頼むと、高確率で以下のような提案が返ってきます：
- 「とりあえず〇〇しましょう」
- 別の対症療法を繰り返す

しかし、これは**対症療法**です。根本原因は、**〇〇**ことにありました。

ここから先は、AIが絶対に提案しない**「〇〇」という解決策**の全貌と、
具体的な実装コード、〇〇の手順、そして実際の〇〇を、すべて公開します。

この手順をコピーすれば、〇〇ループを回避し、**初回から〇〇**を実現できます。
```

### ステップ5: 有料部分の導入文追加

有料部分の冒頭（解決策セクション）に導入文を追加：

```markdown
では、実際に私が〇〇した具体的な〇〇と、〇〇の手順を公開します。

この〇〇をそのままコピーすれば、「〇〇」を毎回悩むことなく、
**再現可能な〇〇**を実現できます。
```

---

## ✅ 完了チェックリスト

各記事のリファクタリング完了時に確認：

- [ ] freeContentHeadingがFrontmatterに追加されている
- [ ] 無料部分にS1-S2レベルの具体的表現が残っていない
- [ ] 「達成した成果」表が追加されている
- [ ] 橋渡し文が追加されている（AI限界 + 根本原因 + 価値提示）
- [ ] 有料部分の導入文が追加されている
- [ ] 横線（---）がFrontmatter以外に使われていない

---

## 📊 進捗報告フォーマット

各Workerは作業完了後、以下の形式で報告：

```
[Worker X] 完了報告

✅ 完了記事:
1. 記事名.md - freeContentHeading: "見出し名"
2. 記事名.md - freeContentHeading: "見出し名"

⏱️ 所要時間: XX分
🔄 次のバッチへ移行可能
```

---

## 🚀 実行開始手順

1. **計画書確認**: ユーザーがこの計画書を確認
2. **Worker起動**: 3つの並列セッションを開始
3. **作業指示**: 各Workerに「Worker X」の作業を指示
4. **進捗同期**: 各Worker完了後、次のバッチがあれば継続

---

## 📝 注意事項

### リファクタリング時の注意

- 文体はですます調を維持
- ClaudeMix/Remixのブランド名は前面に出す
- 技術用語の説明は保持（初心者向け）
- コード例は有料部分に配置
- メタファー（比喩）を活用

### 除外記事

以下の記事は既にリファクタリング済み：

- cloudflare-workers-shiki-build-time-html.md（freeContentHeading済み）

---

## 🎯 最終目標

### 全記事（25記事）のリファクタリング完了

- 現在: 16記事完了（64%）
- 残り: 9記事（36%）
- 並列実行: 3 Workers
- 推定完了時間: 15-20分（並列実行時、スキル使用）
