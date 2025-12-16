---
title: "Remix+Vite環境で`import.meta.glob`がファイルを見つけられない問題のデバッグログ"
description: "RemixとViteのプロジェクトで、`import.meta.glob`が`.yaml`ファイルを検出できず、ビルド時エラーが発生する問題。Viteの監視範囲、tsconfig.json、アセット設定、そして最終的なパスのタイポという複数の原因を特定し、解決するまでの詳細なデバッグプロセスを記録します。"
author: "ClaudeMix Team"
publishedAt: "2025-11-16"
slug: "remix-vite-import-meta-glob-debug"
category: "Claude Best Practices"
tags: ["Vite", "troubleshooting", "architecture"]
---

## はじめに

### Viteでのファイル読み込みでこんなことありませんか？

RemixとViteで最新のWebアプリを作り、`import.meta.glob`（※Viteが提供する、複数ファイルを一括でインポートする機能）を使ってファイルを読み込もうとした。
しかし、ローカル開発環境では動くと思ったのに、ビルド時にファイルが見つからず、500エラーが発生してしまった。
パスを何度も確認したが、原因が分からず、同じエラーが何度も繰り返されてしまった。

### この記事をお勧めしない人

- ビルドエラーが発生しても、とりあえず動けばそれで十分だと考える人。
- Viteの監視範囲やTypeScriptの設定は、単なる細かい設定でしかないと考える人。
- デバッグプロセスを記録する必要性を、全く感じていない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### このままでは危険です

ビルドツールの設定を曖昧なまま開発を続けることで、あなたのプロジェクトには「複数の設定ミスが絡み合った見えない爆弾」が静かに蓄積されていきます。
やがて、本番デプロイ直前になって「ファイルが見つからない」という事態が発生し、リリーススケジュールが大幅に遅れるでしょう。
ついに、チームメンバーからの信頼を失い、プロジェクトは炎上し、あなたは「なぜローカルで動いていたのに」と後悔することになります。

### こんな未来が手に入ります

この記事を読めば、Viteの`import.meta.glob`が正しく動作するための設定知識と、複数の原因が絡み合った問題を一つずつ解決していくデバッグ手法が手に入ります。
具体的には、Viteの監視範囲、TypeScriptの`include`設定、アセット認識、そしてパスのタイポという4つの原因を特定し、解決する**設計図**を手に入れられます。
この方法は、机上の空論ではありません。まさに**このブログ自身のアーキテクチャとして実証済み**です。
この情報は、単なる「エラーを消す」という対処療法ではなく、ビルドツールの仕組みを理解し、複数の設定を整合させる**未来の開発現場から得られた一次情報**です。

### 私も同じでした

筆者も過去に同じビルドエラーで悩み抜き、このブログを「Viteの設定を適切に理解した設計」で作り上げることで解決しました。
この記事で、あなたのプロジェクトのビルドエラーを発見する基本的な考え方と、明日から試せるデバッグチェックリストを持ち帰れるように書きました。
さらに深掘りして、RemixとVite環境でのファイル読み込みのベストプラクティスを知りたい方は、その詳細な実装方法を確認できます。

## 📝 概要

RemixとViteで構成されたプロジェクトで、`/blog` ページにアクセスすると500サーバーエラーが発生しました。この記事では、問題の発見から原因特定、そして解決に至るまでのデバッグプロセスを詳細に記録します。

### 発生環境

- **フレームワーク**: Remix v2
- **ビルドツール**: Vite
- **問題のファイル形式**: `.yaml`

---

## ⚠️ 問題の発見と症状

RemixとViteで構成されたプロジェクトで、`/blog` ページにアクセスすると500サーバーエラーが発生しました。

原因は、サーバーサイドで記事のメタデータを読み込むために使用していた `specLoader.server.ts` 内の `import.meta.glob` が、対象の `.yaml` ファイルを検出できず、`specModules` が空のオブジェクト `[]` になってしまうことでした。

```typescript
// app/spec-loader/specLoader.server.ts

// ...
const specModules = import.meta.glob('/app/specs/**/*-spec.yaml', {
  // ...
});

// ...
if (typeof yamlString !== 'string') {
  // この時点で specModules が空のため、yamlString が undefined となりエラーが発生
  throw new Error(
    `Spec file not found for feature: ${featurePath} (path: ${modulePath})`,
  );
}
```

**エラーメッセージ:**

```typescript
Error: Spec file not found for feature: blog/posts (path: /app/specs/blog/posts-spec.yaml)
```

---

## 🔍 調査と試行錯誤のプロセス

この問題は単一の原因ではなく、以下の4つの要因が複合的に絡み合っていました。一つずつ解決していくことで、最終的に根本原因にたどり着きました。

### 仮説1: Viteの監視範囲外にファイルが存在するのではないか？

- **事象**: 当初、`spec.yaml` はプロジェクトルート直下の `develop` ディレクトリに配置されていました。
- **問題**: RemixのViteプラグインは `app` ディレクトリを重点的に監視するため、その外にある `develop` ディレクトリ内のファイルは `import.meta.glob` の探索対象から漏れてしまっていました。
- **対策**: ファイルを `app/specs/` ディレクトリに移動しました。

### 仮説2: TypeScriptのコンパイル対象外だった

- **事象**: `tsconfig.json` の `include` 配列に、`app` ディレクトリ内の `.yaml` ファイルを対象とするパターン (`"app/**/*.yaml"`) が含まれていませんでした。
- **問題**: これにより、たとえファイルを `app` 配下に移動しても、TypeScriptおよびViteからプロジェクトの一部として認識されませんでした。
- **対策**: `tsconfig.json` の `include` に `"app/**/*.yaml"` を追加しました。

### 仮説3: Viteのアセットとして認識されていない

- **事象**: Viteはデフォルトで `.yaml` をインポート可能なアセットとして認識しません。
- **問題**: `import.meta.glob` で `?raw` クエリを使ってファイルを文字列としてインポートするには、Viteにそのファイル形式をアセットとして明示的に教える必要がありました。
- **対策**: `vite.config.ts` に `build.assetsInclude: ['**/*.yaml']` を追加しました。

### 仮説4: パスのタイポ（1文字違い）を疑う

- **事象**: 上記1〜3をすべて解決した後もエラーが継続しました。
- **問題**: ファイルは `app/specs/` (複数形) に配置されていましたが、`specLoader.server.ts` 内の `import.meta.glob` のパスが `/app/spec/` (単数形) になっていました。このわずか1文字の違いが、ファイルを見つけられない最後の原因でした。
- **対策**: `specLoader.server.ts` のパスを `/app/specs/` に修正しました。

---

## 💡 根本原因の特定

調査の結果、以下の4つの根本原因が特定されました。

1. **Viteの監視範囲外**: ファイルが`app`ディレクトリ外に配置されていた
2. **TypeScriptの設定不足**: `tsconfig.json`の`include`に`.yaml`ファイルが含まれていなかった
3. **Viteのアセット設定不足**: `vite.config.ts`に`.yaml`ファイルのアセット設定がなかった
4. **パスのタイポ**: `import.meta.glob`のパスが単数形（`/app/spec/`）になっていた

これらの問題は、ビルドツールの設定を曖昧なままにしていたことと、パスの確認不足が原因でした。

---

## 🔧 解決策

以下の4つの修正を順番に適用することで、問題を解決しました。

### ステップ1: ファイルの移動

```bash
# develop/ から app/specs/ に移動
mv develop/blog/posts-spec.yaml app/specs/blog/posts-spec.yaml
```

### ステップ2: tsconfig.json の修正

```diff
{
  "include": [
    "app/**/*",
+   "app/**/*.yaml"
  ]
}
```

### ステップ3: vite.config.ts の修正

```diff
export default defineConfig({
  build: {
+   assetsInclude: ['**/*.yaml']
  }
})
```

### ステップ4: パスの修正

```diff
// app/spec-loader/specLoader.server.ts
- const specModules = import.meta.glob('/app/spec/**/*-spec.yaml', {
+ const specModules = import.meta.glob('/app/specs/**/*-spec.yaml', {
    eager: true,
    as: 'raw'
  });
```

## シーケンス図で見る解決までの流れ

```mermaid
sequenceDiagram
    participant User as 開発者
    participant specLoader as specLoader.server.ts
    participant Vite as Vite
    participant RemixPlugin as Remix Plugin
    participant tsconfig as tsconfig.json

    User->>specLoader: loadSpec('blog/posts') を呼び出す
    specLoader->>Vite: import.meta.glob('/app/specs/**/*-spec.yaml') を要求
    
    Vite->>RemixPlugin: ファイル探索範囲を確認
    RemixPlugin-->>Vite: 'app' ディレクトリ内を探索
    Note over Vite: OK: ファイルは 'app' 内にある
    
    Vite->>tsconfig: ファイルがプロジェクトに含まれるか確認
    tsconfig-->>Vite: OK: "include": ["app/**/*.yaml"]
    Note over Vite: OK: .yaml はプロジェクトの一部
    
    Vite->>Vite: ファイルがアセットとして認識されるか確認
    Note over Vite: OK: assetsInclude: ['**/*.yaml']
    
    Vite->>Vite: パス '/app/specs/...' に基づきファイルを探索
    Note over Vite: OK: ファイル 'app/specs/blog/posts-spec.yaml' を発見！
    
    Vite-->>specLoader: specModules に検出したファイル情報を格納して返す
    specLoader->>specLoader: specModules['/app/specs/blog/posts-spec.yaml'] を参照
    Note over specLoader: OK: yamlString を取得
    specLoader->>specLoader: yaml.load(yamlString) を実行し、パース成功
    specLoader-->>User: パース済みのSpecオブジェクトを返す
```

---

## 🎓 学んだこと・まとめ

### 技術的な学び

`import.meta.glob` が期待通りに動作しない場合、以下のチェックリストを確認することが重要です。

1. **ファイルパス**: `import.meta.glob` のパスパターンは正しいか？（タイポはないか？）
2. **Viteの監視範囲**: ファイルはViteが監視するディレクトリ（Remixの場合は `app`）内にあるか？
3. **TypeScriptの `include`**: `tsconfig.json` でファイルがプロジェクトの一部として認識されているか？
4. **Viteの `assetsInclude`**: `?raw` などでインポートする場合、ファイル形式がViteのアセットとして認識されているか？

### 今後のベストプラクティス

- **設定の整合性**: Vite、TypeScript、Remixの設定を常に整合させる
- **パスの慎重な確認**: 単数形/複数形のような些細な違いが大きな問題を引き起こす
- **仮説検証アプローチ**: 複数の原因が絡み合う場合は、一つずつ仮説を立てて検証する
- **デバッグログの記録**: 問題解決のプロセスを記録することで、同じ問題の再発を防ぐ

今回のケースのように、複数の設定が絡み合って問題を引き起こすことは珍しくありません。一つずつ仮説を立てて検証していく地道な作業が、解決への一番の近道でした。
