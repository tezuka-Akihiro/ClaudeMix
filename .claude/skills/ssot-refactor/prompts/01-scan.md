# Phase 1: Spec Loader 未導入ファイルのスキャン

## 目的

実装ファイルとテストファイルをスキャンし、Spec Loaderが導入されていないファイルを検出する。

## スキャン対象

### 1. 実装ファイル（app/routes/）

spec loaderを使うべきファイル:
- Route loader/action でデータを扱うファイル
- UIテキスト（エラーメッセージ等）を表示するファイル
- ビジネスルール（ページネーション等）を持つファイル

**検出コマンド**:
```bash
# loadSpecをimportしていないrouteファイルを検出
for f in $(find app/routes -name "*.tsx" -o -name "*.ts"); do
  if ! grep -q "loadSpec\|loadSharedSpec" "$f"; then
    echo "$f"
  fi
done
```

### 2. テストファイル（tests/）

spec loaderを使うべきファイル:
- specファイルの値を使ってアサートするファイル
- テスト記事を使用するファイル

**検出コマンド**:
```bash
# tests/utils/loadSpecをimportしていないテストファイルを検出
for f in $(find tests -name "*.test.ts" -o -name "*.spec.ts"); do
  if ! grep -q "tests/utils/loadSpec" "$f"; then
    echo "$f"
  fi
done
```

### 3. 除外対象

以下のファイルはspec loaderが不要:
- `app/routes/_index.tsx` などのシンプルなリダイレクト
- 純粋なレイアウトファイル（`_layout.tsx`）
- ユーティリティテスト（specと無関係なもの）

---

## 出力フォーマット

```markdown
## Spec Loader 未導入ファイル一覧

### 実装ファイル（要対応）
| ファイル | 理由 |
|---------|------|
| app/routes/blog/posts.tsx | loaderでデータ取得、loadSpec未使用 |
| app/routes/account/login.tsx | actionでフォーム処理、loadSpec未使用 |

### 実装ファイル（対応不要）
| ファイル | 理由 |
|---------|------|
| app/routes/_index.tsx | リダイレクトのみ |

### テストファイル（要対応）
| ファイル | 理由 |
|---------|------|
| tests/blog/posts.test.ts | specの値をアサートすべき |
| tests/e2e/blog.spec.ts | テスト記事を使用すべき |

### テストファイル（対応不要）
| ファイル | 理由 |
|---------|------|
| tests/utils/helpers.test.ts | specと無関係 |

### サマリー
- 実装ファイル: xx件中 xx件が未導入
- テストファイル: xx件中 xx件が未導入
- 導入率: xx%
```

---

## 次フェーズへの遷移

スキャン完了後、自動的に Phase 2: 分析 へ遷移する。
