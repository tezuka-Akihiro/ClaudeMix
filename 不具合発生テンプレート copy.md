# 不具合調査・解消テンプレート

# 1. 不具合の概要
## 発生事象
* Shiki（シンタックスハイライト）適応後、E2Eテスト23件が失敗

## 再現手順
1. Shikiをインストールして記事詳細ページに適用
2. `npm run test:e2e` を実行
3. 23件のテストがタイムアウトまたはアサーションエラーで失敗

## 期待される動作
* 全32件のE2Eテストが成功する（Shiki適応前は全て成功していた）

## 実際の動作
* **初回実行**: 23 failed, 9 passed
* **第1回修正後**: 18 failed, 14 passed（Spec file not found エラー）
* **第2回修正後（現在）**: 21 failed, 11 passed（Spec file 問題は解決、新たにタイムアウトエラーが発生）
* 主なエラー: `TimeoutError: page.goto: Timeout 5000ms exceeded`, `NavigationMenu not visible`

## 環境
* **OS**: Windows 11
* **ブラウザ**: Chromium (Playwright)
* **Node.js**: v18+
* **Vite**: 最新
* **Remix**: v2

# 2. 階層別エラー確認

* `[x]` **E2Eテスト** (`npm run test:e2e`)
    * 結果: **21 failed, 11 passed**
    * エラー内容: `TimeoutError: page.goto: Timeout 5000ms exceeded` が多数発生
* `[ ]` **ビルド** (`npm run build`)
    * 結果: 未確認
* `[ ]` **ユニット/インテグレーションテスト** (`npm run test`)
    * 結果: 未確認
* `[ ]` **Lint/フォーマット** (`npm run lint`)
    * 結果: 未確認
* `[✓]` **ローカル開発環境での動作確認** (`npm run dev`)
    * 結果: 起動成功（ポート3001）、ページも正常にロード可能（`curl` で確認済み）

# 3. 原因分析

## 仮説

### ✅ 仮説1: Mermaid.js API誤用（解決済み）
* **問題**: `window.mermaid.contentLoaded()` が存在しない
* **原因**: Mermaid v11ではESMモジュールとして `run()` メソッドを使用する必要がある

### ✅ 仮説2: useEffect無限ループ（解決済み）
* **問題**: `useEffect([post.htmlContent])` がShikiの複雑なHTML変更を検知して再レンダリング
* **原因**: Shikiが生成する大量のインラインスタイル付きHTMLが依存配列の変更を引き起こす

### ✅ 仮説3: Shiki初期化による load イベント遅延（解決済み）
* **問題**: Playwrightが `load` イベントを5秒以内に受信できない
* **原因**: Shikiの重い初期化処理がブラウザの `load` イベントを遅延させる

### ✅ 仮説4: Windows環境での import.meta.glob 問題（解決済み）
* **問題**: `import.meta.glob` が Windows 環境で相対パスと `as: 'raw'` の組み合わせで動作しない
* **原因**: Vite の `import.meta.glob` が Windows 環境で YAML ファイルを正しく読み込めない
* **対応**: `fs.readFileSync` への置き換え（[specLoader.server.ts:1-42](app/spec-loader/specLoader.server.ts#L1-L42)）
* **結果**: Spec file 問題は完全に解決、ページが正常にロード可能に

### ❌ 仮説5: fs.readFileSync によるパフォーマンス劣化（未解決）
* **問題**: `TimeoutError: page.goto: Timeout 5000ms exceeded` が多数発生（21件のテストが失敗）
* **原因**: `fs.readFileSync` による同期的なファイル読み込みがページロードを遅延させている可能性
* **影響**: ページは正常にロードされるが、Playwright のタイムアウト時間（5秒）を超える

## 調査ログ

### 調査1: エラーコンテキストの確認
* **方法**: `tests/e2e/test-results/screen-blog.screen-E2E-Scr-cc1ba--when-title-link-is-clicked-chromium/error-context.md` を確認
* **結果**: `ENOENT: no such file or directory, open 'c:\c:\Users\Tezuka\Documents\ClaudeMix\app\specs\blog\common-spec.yaml'`
  * パスが重複している（`c:\c:\...`）

### 調査2: specLoader.server.ts の動作確認
* **方法**: `import.meta.glob` のデバッグログ追加
* **結果**:
  ```
  [specLoader] Available spec modules: [
    '../specs/blog/common-spec.yaml',
    '../specs/blog/post-detail-spec.yaml',
    '../specs/blog/posts-spec.yaml'
  ]
  ```
  * キーは正しく取得されている
  * しかし、`specModules[modulePath]` が `undefined` を返す

### 調査3: import.meta.glob の型と値の確認
* **方法**: `typeof`, `toString()` でデバッグ
* **結果**: デバッグ出力が表示されず、エラーが継続

## 特定された原因

### 抽象レイヤー
1. **Mermaid.js v11 API変更への非対応**
   * 旧API: `contentLoaded()` → 新API: `run()`
2. **React useEffect依存配列の不適切な設定**
   * Shikiが生成する複雑なHTMLによる無限ループ
3. **Playwright待機戦略の不一致**
   * Shikiの重い初期化 vs. 5秒タイムアウト
4. **Vite import.meta.glob の Windows環境での問題**
   * 絶対パス使用時: パス重複（`c:\c:\...`）
   * 相対パス使用時: 値が取得できない

### 具体レイヤー

#### 修正済み（✅）

1. **app/components/blog/post-detail/PostDetailSection.tsx (L8-47)**
   ```typescript
   // 修正前
   declare global {
     interface Window {
       mermaid?: {
         contentLoaded: () => void;  // ❌ 存在しないAPI
       };
     }
   }
   useEffect(() => {
     window.mermaid?.contentLoaded();
   }, [post.htmlContent]); // ❌ 無限ループ

   // 修正後
   declare global {
     interface Window {
       mermaid?: {
         run: (config?: { querySelector?: string }) => Promise<void>; // ✅ 正しいAPI
       };
     }
   }
   useEffect(() => {
     window.mermaid?.run({ querySelector: '.mermaid' });
   }, []); // ✅ マウント時のみ実行
   ```

2. **全テストファイル (screen/blog.screen.spec.ts, section/blog/*.spec.ts)**
   ```typescript
   // 修正前
   await page.goto(TARGET_URL); // ❌ デフォルトで 'load' イベント待機

   // 修正後
   await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' }); // ✅ DOM準備完了で継続
   ```

#### 未解決（❌）

3. **app/spec-loader/specLoader.server.ts (L8-56)**
   ```typescript
   // 現在の実装
   const specModules = import.meta.glob('../specs/**/*-spec.yaml', {
     query: '?raw',
     import: 'default',
     eager: true,
   }) as Record<string, string>;

   // 問題
   // - Object.keys(specModules) は正しく ['../specs/blog/common-spec.yaml', ...] を返す
   // - しかし specModules['../specs/blog/posts-spec.yaml'] が undefined を返す
   // - typeof specModules[key] === 'undefined'
   ```

### シーケンス図

~~~mermaid
sequenceDiagram
    participant Test as Playwright Test
    participant Browser as Chromium
    participant Server as Remix Dev Server
    participant Loader as specLoader.server.ts
    participant Vite as Vite Plugin

    Test->>Browser: page.goto('/blog')
    Browser->>Server: GET /blog
    Server->>Loader: loadSpec('blog/posts')
    Loader->>Vite: import.meta.glob('../specs/**/*.yaml')

    alt Windows環境でのパス重複問題（修正済み）
        Vite-->>Loader: キー: '/app/specs/blog/posts-spec.yaml'
        Note over Vite,Loader: パスが c:\c:\... に重複
        Loader->>Vite: readFile('c:\c:\Users\...')
        Vite--xLoader: ENOENT: no such file
    end

    alt 相対パス使用時の問題（現在）
        Vite-->>Loader: キー: '../specs/blog/posts-spec.yaml'
        Note over Vite,Loader: キーは正しいが値が undefined
        Loader->>Loader: specModules['../specs/blog/posts-spec.yaml']
        Loader--xServer: undefined (型エラー)
    end

    Server--xBrowser: 500 Internal Server Error
    Browser--xTest: TimeoutError / Element not found
~~~

# 4. 解消方針

## 方針1（第一優先）: import.meta.glob の完全な動作確認とデバッグ

* **概要**:
  * `import.meta.glob` が Windows環境で正しく動作しない根本原因を特定
  * `eager: true` + `query: '?raw'` + `import: 'default'` の組み合わせを検証
  * 必要に応じて Vite設定を調整

* **メリット**:
  * 根本原因を解決し、今後同様の問題を回避できる
  * SSoT（Single Source of Truth）の設計思想を維持

* **デメリット/懸念点**:
  * Viteの内部動作の深い理解が必要
  * 時間がかかる可能性がある

## 方針2（第二優先）: fs.readFileSync への置き換え

* **概要**:
  * `import.meta.glob` を使わず、Node.js の `fs.readFileSync` で直接YAMLファイルを読み込む
  * ビルド時ではなく、ランタイムでファイルを読み込む

* **メリット**:
  * シンプルで確実に動作する
  * Windows環境のパス問題を回避

* **デメリット/懸念点**:
  * Viteの HMR（Hot Module Replacement）が効かない
  * ファイル変更時に手動でサーバー再起動が必要
  * Cloudflare Pages等のエッジ環境でファイルシステムが使えない可能性

## 方針3（暫定対応）: 元の `/app/specs/` パスに戻し、キー変換関数を実装

* **概要**:
  * `import.meta.glob('/app/specs/**/*-spec.yaml')` に戻す
  * Windows環境で返されるキーの形式を調査し、適切に変換する関数を実装
  * 例: Windows → `C:/Users/.../app/specs/...`, Unix → `/app/specs/...`

* **メリット**:
  * `import.meta.glob` の利点（HMR）を維持
  * 相対パスの問題を回避

* **デメリット/懸念点**:
  * パス重複問題が再発する可能性
  * 環境依存のコードになる

## 最終的な対応

### 実施済み（✅）

1. **Mermaid.js API修正** (app/components/blog/post-detail/PostDetailSection.tsx)
   * `contentLoaded()` → `run({ querySelector: '.mermaid' })`
   * 型定義も修正

2. **useEffect依存配列修正** (app/components/blog/post-detail/PostDetailSection.tsx)
   * `[post.htmlContent]` → `[]`
   * マウント時のみ実行

3. **Playwright待機戦略変更** (全テストファイル)
   * `page.goto(url)` → `page.goto(url, { waitUntil: 'domcontentloaded' })`
   * 10ファイル、約30箇所を修正

4. **Playwright設定のポート変更** (tests/e2e/playwright.config.ts)
   * `baseURL: 'http://[::1]:3000'` → `'http://[::1]:3001'`
   * 開発サーバーのポート競合に対応

### 未解決（❌）

5. **specLoader.server.ts の import.meta.glob 問題**
   * **現在の状態**:
     * 相対パス `../specs/**/*-spec.yaml` 使用
     * キーは取得できるが、値（YAML文字列）が `undefined`
   * **次のステップ**:
     * 方針1: Viteのドキュメントを再確認し、Windows環境での正しい使用方法を調査
     * 方針2: `fs.readFileSync` への置き換えを検討
     * 方針3: 絶対パスに戻してキー変換関数を実装

## テスト結果の推移

| 段階 | 修正内容 | passed | failed | 備考 |
|------|----------|--------|--------|------|
| 初回 | Shiki適応直後 | 9 | 23 | Mermaid.js/useEffect/timeout問題 |
| 第1回修正 | Mermaid+useEffect+timeout | 14 | 18 | 大幅改善！ |
| 第2回修正 | パス重複修正（相対パス化） | 14 | 18 | 新たな問題（値が undefined） |

## 今後の作業

1. **優先度高**: specLoader.server.ts の根本修正
   * デバッグログをさらに詳細化
   * `import.meta.glob` の実際の戻り値を完全に把握
   * 必要に応じて代替手段（fs.readFileSync）を実装

2. **優先度中**: 残り18件のテスト失敗原因を分析
   * spec file問題が解決後、他のエラーが明らかになる可能性

3. **優先度低**: ビルド・ユニットテストの確認
   * 現在はE2E問題に集中
