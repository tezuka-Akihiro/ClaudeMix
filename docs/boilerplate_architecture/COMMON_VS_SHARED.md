# Common vs Shared: 責務と使い分けガイド

## 概要

ClaudeMixプロジェクトでは、2種類の「共通設定」が存在します：

1. **commonセクション** (`{service}/common-spec.yaml`)
2. **sharedセクション** (`shared/*.yaml`)

このドキュメントでは、両者の責務と使い分け基準を定義します。

---

## 責務の定義

### shared セクション（サービス横断）

**責務**: プロジェクト全体で共有される、技術的・ビジネス的な設定値

**配置場所**: `app/specs/shared/*.yaml`

**対象設定**:

- プロジェクト基本情報（プロジェクト名、コンセプト等）
- 技術的設定値（timeout、retry、rate limit等）
- バリデーションルール（email、password pattern等）
- デザイントークン（breakpoints、spacing等）
- セキュリティ設定（bcrypt rounds、CSRF等）

**判断基準**:

- ✅ **すべてのサービスで同じ値を使う**
- ✅ **技術的な理由で統一が必要**（例: emailバリデーション）
- ✅ **ビジネス要件として統一が必要**（例: プロジェクト名）
- ✅ **将来的に他サービスでも使う可能性が高い**

**例**:

```yaml
# shared/validation-spec.yaml
email:
  pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  max_length: 254
```

**アンチパターン**:

- ❌ サービス固有のUI設定（ナビゲーション、フッター等）
- ❌ サービス固有のビジネスロジック（カテゴリ定義等）
- ❌ サービス固有のレイアウト（ヘッダー構造等）

---

### common セクション（サービス内共通）

**責務**: 特定サービス内の複数セクションで共有される設定値

**配置場所**: `app/specs/{service}/common-spec.yaml`

**対象設定**:

- サービス固有のナビゲーション
- サービス固有のレイアウト設定
- サービス固有のテーマ・デザイン
- サービス固有のビジネスルール
- サービス内で共有するUI要素（ヘッダー、フッター等）

**判断基準**:

- ✅ **特定サービス内でのみ使う**
- ✅ **サービスのドメイン知識に依存する**
- ✅ **他サービスでは異なる値になる可能性が高い**
- ✅ **サービスのUI/UXに密接に関連する**

**例**:

```yaml
# blog/common-spec.yaml
navigation:
  menu_items:
    - label: "マイページ"
      path: "/account"
    - label: "はじめまして"
      path: "/blog/hazimemasite"

theme:
  modes: ["light", "dark"]
  default_mode: "dark"
```

**アンチパターン**:

- ❌ プロジェクト名・著作権表示（→ shared/project-spec.yaml）
- ❌ バリデーションルール（→ shared/validation-spec.yaml）
- ❌ タイムアウト設定（→ shared/server-spec.yaml）

---

## 使い分けフローチャート

```
設定値を定義する必要がある
    ↓
【質問1】この値は全サービスで統一すべきか？
    ├─ Yes → shared/へ
    └─ No → 【質問2】へ
              ↓
【質問2】この値は将来的に他サービスでも使う可能性があるか？
    ├─ Yes → shared/へ（先行投資）
    └─ No → 【質問3】へ
              ↓
【質問3】この値は特定サービス内の複数セクションで使うか？
    ├─ Yes → {service}/common-spec.yaml へ
    └─ No → {service}/{section}-spec.yaml へ
```

---

## 具体例での判断

### 例1: メールアドレスのバリデーションパターン

**判断**: shared/validation-spec.yaml

**理由**:

- ✅ 全サービスで統一すべき（技術的理由）
- ✅ RFC 5322準拠のパターンを使用
- ✅ accountサービスだけでなく、将来の問い合わせフォーム等でも使用

### 例2: ブログのナビゲーションメニュー

**判断**: blog/common-spec.yaml

**理由**:

- ✅ ブログサービス固有のUI要素
- ✅ accountサービスとは異なるナビゲーション構造
- ✅ ブログのドメイン知識に依存（「はじめまして」等）

### 例3: セッション有効期限

**判断**: account/common-spec.yaml（現状維持）

**理由**:

- 🤔 現状はaccountサービスのみで使用
- 🤔 しかし、将来的にブログでも認証が必要になる可能性
- ✅ セキュリティポリシーとして統一すべき可能性
- **結論**: 現状は account/common-spec.yaml に配置、将来的に shared/server-spec.yaml への移行を検討

### 例4: ブログカテゴリの定義

**判断**: blog/posts-spec.yaml

**理由**:

- ✅ ブログ記事一覧機能に固有
- ✅ 他のセクション（post-detail）では使用しない
- ✅ ブログのビジネスロジックに依存
- **結論**: common にも shared にも該当しない

### 例5: レスポンシブブレークポイント

**判断**: shared/responsive-spec.yaml

**理由**:

- ✅ 全サービスでデザイン統一が必要
- ✅ Tailwind設定と連動するため技術的に統一すべき
- ✅ blog、account両方で使用

---

## 移行が必要な設定の特定

### 現状の配置確認

| 設定 | 現在の配置 | 推奨配置 | 移行要否 |
|-----|-----------|---------|---------|
| copyright_name | blog/common, blog/posts | shared/project | ✅ 移行済み（RFC-003） |
| timeout | 全specファイル | shared/server | ✅ 移行済み（RFC-003） |
| breakpoints | blog/common, account/common | shared/responsive | ✅ 移行済み（RFC-003） |
| validation | account/common, authentication | shared/validation | ✅ 移行済み（RFC-003） |
| session設定 | account/common | shared/server または維持 | ⚠️ 現状維持（将来検討） |
| テーマ設定 | blog/common | 維持 | ✅ 適切 |
| ナビゲーション | blog/common, account/common | 維持 | ✅ 適切 |
| OGP設定 | blog/common | 維持（または shared） | ✅ 適切（ブログ固有デザイン） |

---

## セッション設定の移行判断

### 現状

```yaml
# account/common-spec.yaml
session:
  cookie:
    name: "session_id"
    max_age: 604800  # 7日間
    http_only: true
    secure: true
    same_site: "Lax"
  kv:
    namespace_binding: "SESSION_KV"
    key_prefix: "session:"
```

### 判断

**移行先**: 現状維持（`account/common-spec.yaml`）、将来的に `shared/server-spec.yaml` へ移行検討

**理由**:

1. 現状はaccountサービスのみで使用
2. 移行の効果が限定的
3. ブログで認証機能が必要になった段階で移行を検討
4. Phase 5（構成化メカニズム）で $ref 機能が実装された後に移行する方が効率的

**将来の移行案**:

```yaml
# shared/server-spec.yaml（将来的に追加検討）
session:
  cookie:
    name: "session_id"
    max_age: 604800  # 7日間
    http_only: true
    secure: true
    same_site: "Lax"
  key_prefix: "session:"
```

```typescript
// 環境変数で管理
const sessionKV = env.SESSION_KV;  // Cloudflare Pages環境変数
```

---

## OGP設定の移行判断

### 現状

```yaml
# blog/common-spec.yaml
ogp:
  image:
    width: 1200
    height: 630
    format: "png"
  cache:
    maxAge: 31536000
  colors:
    background: {...}
    text: {...}
```

### 判断

**移行先**: 維持（`blog/common-spec.yaml`）

**理由**:

1. OGP画像のデザインはブログ固有
2. accountサービスでは異なるOGPデザインになる可能性
3. 画像サイズ（1200x630）は標準規格だが、デザイン（色、レイアウト）は固有

**例外**: 画像サイズのみ shared に移動する選択肢もあり（ただし、過剰な分割は避ける）

---

## 責務明確化のガイドライン

### DO（推奨）

✅ 技術的な設定値（timeout、validation pattern）は shared へ
✅ ビジネスポリシー（セキュリティ要件）は shared へ
✅ サービス固有のUI/UX設定は common へ
✅ 将来的な拡張を見越した判断をする

### DON'T（非推奨）

❌ 「今使っているのは1サービスだけだから common でいい」という短絡的判断
❌ すべてを shared に入れて「万能spec」を作る
❌ 責務を考えずに「なんとなく」配置する
❌ 移行コストを恐れて現状維持に固執する

---

## まとめ

| 観点 | shared | common | section |
|-----|--------|--------|---------|
| **スコープ** | プロジェクト全体 | サービス内 | セクション内 |
| **技術/ビジネス** | 技術的設定 + ビジネスポリシー | サービス固有UI/UX | セクション固有ロジック |
| **変更頻度** | 低（慎重に変更） | 中（サービス改善） | 高（機能追加・改修） |
| **影響範囲** | 全サービス | 1サービス | 1セクション |
| **例** | validation, timeout, breakpoints | navigation, theme, layout | categories, tags, forms |

---

## 更新履歴

- 2026-01-03: 初版作成（RFC-004）
