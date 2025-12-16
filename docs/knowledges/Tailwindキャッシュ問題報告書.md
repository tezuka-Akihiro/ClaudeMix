# CSS フレームワークキャッシュ問題 調査報告書

## 概要

AI-TDD Manifest の Code Hologram 機能実装中に発生した、Tailwind CSS フレームワークのキャッシュ問題について報告する。本問題は CSS クラスが HTML に正しく記述されているにも関わらず、ブラウザ上で視覚的に反映されない現象である。

---

## 問題の詳細

### 症状

- **対象コンポーネント**: `HologramVisualizer.tsx`
- **期待される表示**: 紫背景（`bg-purple-800`）、緑ボーダー（`border-green-400`）、四角形ノードの表示
- **実際の表示**: 背景色・ボーダー色が適用されず、四角形ノードが見えない状態
- **HTML 検証結果**: Developer Tools でクラス名は正しく出力されている
- **CSS 検証結果**: 該当するスタイルが適用されていない

### 発生タイミング

1. 初回実装時は正常に動作
2. リファクタリング（インラインスタイル削除）後に問題発生
3. `npm run build` + サーバー再起動後も問題継続

---

## 根本原因分析

### Tailwind CSS のキャッシュメカニズム

Tailwind CSS は以下のプロセスでスタイルを生成する：

~~~mermaid
graph LR
    A[ソースコード解析] --> B[使用クラス検出]
    B --> C[CSS生成]
    C --> D[未使用クラス削除]
    D --> E[キャッシュ保存]
~~~

### 問題の原因

1. **Build-time Purging**: 新しく追加されたクラスがビルド時に「未使用」と判定された。
2. **Framework Caching**: 前回ビルドのキャッシュが保持され、新しいクラスが認識されなかった。
3. **Hot Reload Limitation**: 開発モードでもCSSフレームワークレベルのキャッシュは更新されなかった。

---

## 試行した解決策

### 1. フルビルド実行

~~~bash
npm run build
npm run dev
~~~

**結果**: 問題継続（一時的改善なし）

### 2. ブラウザキャッシュクリア

**結果**: 問題継続（クライアント側の問題ではない）

### 3. インラインスタイル使用

~~~javascript
style={{
  backgroundColor: '#6b21a8',
  border: '8px solid #4ade80'
}}
~~~

**結果**: 表示成功（フレームワークを完全バイパス）

---

## 最終解決方法

### カスタム CSS クラスによる強制オーバーライド

**実装場所**: `app/styles/globals.css`

~~~css
/* Code Hologram Visualization - キャッシュ問題回避用カスタムクラス */
.hologram-container {
  background-color: #6b21a8 ;
  border: 8px solid #4ade80 ;
}

.hologram-service-node {
  background-color: #a855f7 ;
  color: white ;
  border: 2px solid #9333ea ;
  width: 192px ;
  height: 64px ;
}

.hologram-section-node {
  background-color: #fb923c ;
  color: black ;
  border: 2px solid #ea580c ;
  width: 128px ;
  height: 48px ;
}

.hologram-section-node.selected {
  background-color: #16a34a ;
  color: white ;
  border-color: #15803d ;
}
~~~

**コンポーネント側の変更**:

~~~jsx
// Before: Tailwind クラス
className="bg-purple-800 border-8 border-green-400"

// After: カスタムクラス
className="hologram-container"
~~~

### 解決のポイント

1. **専用クラス名**: 汎用的でない名前でキャッシュ競合を回避
2. **`globals.css` への配置**: アプリケーション全体で確実に読み込まれる

---

## 今後の開発設計方針

### 1. CSS アーキテクチャ戦略

**Hybrid Approach の採用: Tailwind CSS (汎用) + Custom CSS (特殊ケース)**

- **Tailwind CSS**: 一般的なレイアウト・スタイリング
- **Custom CSS**: 複雑な視覚化コンポーネント、アニメーション

#### クラス命名規則

~~~css
/* コンポーネント固有のスタイル */
.{component-name}-{element} {
  /* styles with  if needed */
}

/* 例 */
.hologram-container { }
.dashboard-widget { }
.chart-legend { }
~~~

### 2. 開発フロー改善

#### CSS 問題の予防策

1. **Early Detection**: 複雑なスタイリングは初期段階でカスタムCSS検討
2. **Testing Strategy**: 視覚的回帰テストの導入検討
3. **Documentation**: CSS アプローチの決定根拠を記録

#### トラブルシューティング手順

1. Developer Tools でクラス名確認
2. Computed Styles でCSS適用状況確認
3. フルビルド実行
4. カスタムCSS + `` による強制適用
5. インラインスタイル（最終手段）

### 3. 技術スタック考慮事項

#### CSS-in-JS 検討

将来的な代替案として：

~~~jsx
// styled-components, emotion 等
const HologramContainer = styled.div`
  background-color: #6b21a8;
  border: 8px solid #4ade80;
`;
~~~

- **メリット**: キャッシュ問題の根本回避
- **デメリット**: バンドルサイズ増加、複雑性向上

---

## 学習ポイント

### 技術的知見

1. **CSS フレームワークの制約理解**: Tailwind の purging 機能は強力だが副作用あり
2. **キャッシュ階層の理解**: ブラウザ ≠ フレームワーク ≠ ビルドツール
3. **Fallback 戦略の重要性**: 複数の解決手段を準備することの価値

### 開発プロセス改善

1. **段階的アプローチ**: 簡単な解決策から試行
2. **根本原因追求**: 症状だけでなく原因の理解
3. **文書化の重要性**: 解決策と根拠の記録

---

## 結論

Tailwind CSS キャッシュ問題は現代の CSS フレームワーク特有の課題である。本件を通じて、フレームワークの利便性と制約のバランスを理解し、Hybrid CSS アーキテクチャの有効性を確認できた。

今後は予防的なアプローチとして、複雑な視覚化コンポーネントには初期段階からカスタム CSS を検討し、保守性と確実性を両立する設計を採用する。

---
**報告書作成日**: 2025-09-30  
**対象プロジェクト**: ClaudeMix - AI-TDD Manifest
