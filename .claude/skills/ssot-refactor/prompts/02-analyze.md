# Phase 2: リファクタリング対象の分析

## 目的

Phase 1で検出した未導入ファイルを分析し、どのspecを使うべきか、どの値を置き換えるべきかを特定する。

## 分析手順

### 1. ファイルパスからサービス/セクションを特定

```
app/routes/blog/posts.tsx       → blog/posts-spec.yaml
app/routes/blog/$slug.tsx       → blog/post-detail-spec.yaml
app/routes/account/login.tsx    → account/authentication-spec.yaml
app/routes/account/profile.tsx  → account/profile-spec.yaml
```

### 2. ファイル内のハードコード値を洗い出し

**検出対象**:
- 日本語文字列リテラル（`"..."` 内にひらがな・カタカナ・漢字）
- マジックナンバー（0, 1以外の数値リテラル）
- data-testid のハードコード
- エラーステータスコードに紐づくメッセージ

**分析コマンド**:
```bash
# 日本語文字列を検出
grep -n '"[^"]*[ぁ-んァ-ン一-龥]' <file>

# 数値リテラルを検出（slice, timeout等）
grep -n 'slice(0, [2-9]\|[0-9]\{2,\})' <file>
grep -n 'timeout.*[0-9]\{3,\}' <file>
```

### 3. 対応するspec値を特定

| ハードコード | spec内のキー |
|-------------|-------------|
| エラーメッセージ | `messages.error.*` |
| 成功メッセージ | `messages.success.*` |
| 空状態メッセージ | `messages.empty_state.*` |
| ページサイズ | `business_rules.load_more.*` |
| data-testid | `ui_selectors.*` |

### 4. 優先度付け

| 優先度 | 条件 |
|-------|------|
| 高 | Route loader/actionで使用されるファイル |
| 高 | E2Eテストで使用されるファイル |
| 中 | コンポーネントファイル |
| 中 | ユニットテストファイル |
| 低 | ユーティリティファイル |

---

## 出力フォーマット

```markdown
## リファクタリング分析レポート

### 高優先度

#### app/routes/blog/posts.tsx
- **使用すべきspec**: `blog/posts-spec.yaml`
- **型**: `BlogPostsSpec`
- **置き換え対象**:
  | 行 | 現在の値 | spec参照 |
  |----|---------|----------|
  | 42 | `"記事の取得に失敗しました"` | `spec.messages.error.fetch_failed` |
  | 58 | `slice(0, 6)` | `spec.business_rules.load_more.initial_load` |

#### tests/e2e/blog/posts.spec.ts
- **使用すべきspec**: `blog/posts-spec.yaml`
- **import**: `import { loadSpec } from 'tests/utils/loadSpec'`
- **置き換え対象**:
  | 行 | 現在の値 | spec参照 |
  |----|---------|----------|
  | 23 | `'Claude Best Practices'` | `spec.categories[0].name` |

### 中優先度
...

### 低優先度
...
```

---

## 次フェーズへの遷移

分析完了後、自動的に Phase 3: リファクタ へ遷移する。
