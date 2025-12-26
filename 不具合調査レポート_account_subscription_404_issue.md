# Debug Report: /account/subscription 404 Issue

**日時**: 2025-12-26
**報告者**: Claude Code (Debugger Agent)
**優先度**: 🔴 Critical (P0)

---

## 🐛 問題概要

**エラータイプ**: test-failure → route-timeout → port-conflict
**影響レイヤー**: infrastructure + ui
**重要度**: P0 (E2Eテスト失敗)

**症状**:
E2Eテスト実行時に `/account/subscription` ルートが404を返す。その後の調査で、全ルートがタイムアウトする問題に発展。

---

## 📍 エラー詳細

**テストケース**: `tests/e2e/account/common.spec.ts:93` - "should redirect to login when accessing /account/subscription"

**初期エラーメッセージ**:

```
Expected: HTTP 302 redirect to /login?redirect-url=%2Faccount%2Fsubscription
Actual: HTTP 404 Not Found
```

**影響範囲**:

- ✅ `/account/settings` は正常動作
- ❌ `/account/subscription` が404エラー
- ❌ すべてのルートがタイムアウト (後に発覚)

---

## 🔍 根本原因分析 (5 Whys法)

### Why1: なぜ /account/subscription が404を返したか?

→ 当初の仮説: ルートファイルが存在しないまたは認識されていない

### Why2: なぜルートが認識されないか?

→ 調査の結果、ファイルは存在し、ビルドも成功していた
→ 新たな発見: curl でアクセスするとタイムアウトする

### Why3: なぜ curl がタイムアウトするか?

→ すべてのルート (/, /account/settings, /account/subscription) がタイムアウト
→ D1データベースクエリがハングしているとの仮説

### Why4: なぜD1クエリがハングするか?

→ `getSession` 関数にタイムアウト処理を追加したが改善せず
→ ホームページ (/) もタイムアウト → D1は無関係

### Why5: なぜすべてのルートがタイムアウトするか?

→ `netstat` で調査した結果、**ポート8788に8個のプロセスがリスニング中**
→ **根本原因**: 複数のWranglerプロセスが同一ポートで競合

---

## 💡 修正内容

### 修正1: インポート文の修正 (副次的な問題)

**ファイル**: `app/routes/account.subscription.tsx:9-10`

**変更内容**:

```typescript
// Before
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

// After
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
```

**理由**:

- Cloudflare Pagesプロジェクトでは `@remix-run/cloudflare` を使用する必要がある
- `account.settings.tsx` は正しく `@remix-run/cloudflare` を使用していた
- **注**: この修正は404の直接的な原因ではなかったが、正しい実装に修正

**影響**: なし (ポート競合が本質的な問題だったため)

---

### 修正2: getSession のタイムアウト処理追加 (未採用)

**ファイル**: `app/data-io/account/common/getSession.server.ts:46-63`

**変更内容**:

```typescript
// Check if DB binding is available
if (!context?.env?.DB) {
  console.error('D1 database binding not available');
  return null;
}

// Retrieve session data from D1 database with timeout
const db = context.env.DB;
const queryPromise = db
  .prepare('SELECT * FROM sessions WHERE id = ?')
  .bind(sessionId)
  .first();

const timeoutPromise = new Promise<null>((_, reject) =>
  setTimeout(() => reject(new Error('Database query timeout')), 3000)
);

const result = await Promise.race([queryPromise, timeoutPromise]);
```

**理由**:

- D1クエリのハングを防ぐための防御的コーディング
- **結果**: 効果なし (タイムアウトの原因はポート競合だった)

**影響**: なし

---

### 修正3: ポート競合の解消 (根本的な修正) ✅

**問題の発見**:

```bash
netstat -ano | findstr ":8788"
# 結果: 8個のプロセスがポート8788でリスニング中
# PID: 93132, 94756, 90828, 29604, 28844, 90616, 28320, 27968
```

**修正手順**:

```bash
# 全プロセスを強制終了
taskkill //F //PID 27968
taskkill //F //PID 28320
taskkill //F //PID 28844
taskkill //F //PID 29604
taskkill //F //PID 90616
taskkill //F //PID 90828
taskkill //F //PID 93132
taskkill //F //PID 94756

# 新しいサーバーを1つだけ起動
npm run dev:wrangler
```

**検証**:

```bash
curl -i --max-time 5 http://127.0.0.1:8788/account/subscription

# 結果:
HTTP/1.1 302 Found
Content-Length: 0
Location: /login?redirect-url=%2Faccount%2Fsubscription
```

**結果**: ✅ ルートが正常に動作 (認証なしで302リダイレクトを返す)

---

## 🧪 テスト結果

### curl テスト (成功)

```bash
# ホームページ
curl -i http://127.0.0.1:8788/
# 結果: 200 OK

# account/settings (認証なし)
curl -i http://127.0.0.1:8788/account/settings
# 結果: 302 Found → /login?redirect-url=%2Faccount%2Fsettings

# account/subscription (認証なし)
curl -i http://127.0.0.1:8788/account/subscription
# 結果: 302 Found → /login?redirect-url=%2Faccount%2Fsubscription
```

### E2Eテスト (依然として失敗)

```bash
npx playwright test tests/e2e/account --reporter=list
# 結果: 33 tests failed (すべてナビゲーションタイムアウト)
```

**残存問題**:

- curlでは正常動作するが、Playwrightブラウザからのアクセスがタイムアウト
- すべてのテストが `page.goto('/login')` でタイムアウト
- ブラウザとdev serverの接続に問題がある可能性

---

## 🎯 Next Actions

1. ✅ **ポート競合の解消** (完了)
2. ✅ **curl での動作確認** (完了)
3. ⏳ **Playwright E2Eテストのタイムアウト問題を調査**
   - ブラウザからの接続がタイムアウトする原因を特定
   - Wrangler Pages dev serverの設定を確認
   - Playwrightの設定 (baseURL, timeout) を確認
4. 📝 **テンプレートファイルの更新** (次のステップ)

---

## 📚 再発防止策

### 1. 開発プロセスの改善

- **dev server起動前の確認**:

  ```bash
  # ポート8788がクリーンであることを確認
  netstat -ano | findstr ":8788"
  # 既存プロセスがあれば終了してから起動
  ```

### 2. 起動スクリプトの改善

- `npm run dev:wrangler` の前に既存プロセスを自動killする

### 3. ドキュメント整備

- Troubleshooting ガイドに「ポート競合時の対処法」を追加

### 4. 環境セットアップの標準化

- E2Eテスト実行前に必ず `npm run setup:db` を実行
- dev server の起動待機時間を十分に確保

---

## 🔗 関連ファイル

### 修正したファイル

- [app/routes/account.subscription.tsx](app/routes/account.subscription.tsx:9-10) - Import修正
- [app/data-io/account/common/getSession.server.ts](app/data-io/account/common/getSession.server.ts:46-63) - Timeout処理追加

### 参照ファイル

- [app/routes/account.tsx](app/routes/account.tsx) - 親ルート (正常動作)
- [app/routes/account.settings.tsx](app/routes/account.settings.tsx) - 比較対象 (正常動作)
- [tests/e2e/account/common.spec.ts](tests/e2e/account/common.spec.ts:93) - 失敗したテスト
- [wrangler.toml](wrangler.toml) - D1データベース設定

### 関連ドキュメント

- [.claude/skills/debugger.md](.claude/skills/debugger.md) - デバッグ手法
- [CLAUDE.md](CLAUDE.md) - プロジェクト規範

---

## 📋 デバッグプロセスの記録

### タイムライン

1. **00:00 - 初期報告**: E2Eテストで /account/subscription が404
2. **00:05 - ファイル確認**: account.subscription.tsx が存在することを確認
3. **00:10 - インポート発見**: @remix-run/node を使用していた → @remix-run/cloudflare に修正
4. **00:15 - クリーンビルド**: build フォルダを削除して再ビルド
5. **00:20 - curl テスト**: タイムアウト発生 → 404ではなくタイムアウトが問題
6. **00:25 - 範囲拡大**: すべてのルート (/, /account/settings) がタイムアウト
7. **00:30 - D1調査**: getSession のD1クエリを疑う → タイムアウト処理追加
8. **00:40 - 効果なし**: タイムアウト処理は無効 → インフラ層の問題と判断
9. **00:45 - netstat**: ポート8788に8個のプロセス発見 → **根本原因特定**
10. **00:50 - プロセスkill**: 全プロセスを終了
11. **00:55 - 検証成功**: curl で302レスポンス確認
12. **01:00 - E2E実行**: 依然としてタイムアウト → 新たな課題発見

### 学んだ教訓

1. **404エラーの背後には別の問題が隠れている場合がある**
   - 今回は404ではなく、実際にはタイムアウトが原因だった

2. **curl とブラウザでは接続挙動が異なる**
   - curlは成功するがPlaywrightがタイムアウト → 別レイヤーの問題

3. **ポート競合は全リクエストをハングさせる**
   - 複数プロセスが同一ポートでリスニングすると、リクエストが不定に分散される

4. **インフラ層の問題はアプリケーション層では解決できない**
   - コード修正 (import, timeout) では根本原因は解決しなかった

---

**策定者**: Claude Code (Debugger Agent)
**ステータス**: ✅ ポート競合は解決 / ⏳ E2Eタイムアウトは調査中
**バージョン**: 1.0
