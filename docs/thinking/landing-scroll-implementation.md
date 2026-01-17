# LP スクロールアニメーション実装方針の判断記録

**日付**: 2026-01-16
**判断者**: Claude (AI Assistant)
**対象**: ClaudeMix Landing Page のスクロールアニメーション実装方法

---

## 判断内容

**結論**: Intersection Observer API + CSS Animations を採用

**却下した案**: Remix公式サイトのScrollStage/Actorパターン

---

## 背景

### 検討のきっかけ

ユーザーから「Remix.run のようなスクロールランディングページ」という要望があり、Remix公式サイトの実装（`app/ui/homepage-scroll-experience.tsx`）を調査しました。

### Remix公式サイトの実装

```typescript
// Remix公式の方法
useStage() // セクション単位の進捗管理（0～1）
useActor() // 個別要素の進捗管理

<Actor start={0.2} end={0.8}>
  {/* progress値ベースでアニメーション */}
</Actor>
```

**特徴**:
- カスタムフックによる抽象化
- progress値（0～1）ベースの制御
- 複数のtweening関数（easeOutQuad, easeInExpo等）
- 細かいアニメーション制御が可能

---

## 判断理由

### 1. Remix公式の実装は「マーケティングサイト特有の要件」による

Remix公式サイトは**複数の機能デモを1画面で体験させる**必要があり：
- NestedRoutes、Mutations、ErrorBoundariesなど、多数のセクション
- 各セクションで異なるアニメーション制御
- スクロール体験自体が「Remixの性能証明」

→ **ClaudeMixのLPは単一ターゲット向けのシンプルな構成**であり、ここまでの複雑性は不要

### 2. 実装時期の違い（V2時代 vs V3時代）

Remix公式サイトは**V2時代に構築**：
- Intersection Observerの普及率が低かった
- View Transitions APIが存在しなかった
- React 18のConcurrent Mode対応が必要だった

→ **2024年現在、ブラウザ標準APIが成熟**しており、カスタム抽象化が不要

### 3. ボイラープレートとしての要件

ClaudeMixは**MVPボイラープレート**であり：
- **学習コスト**: ユーザーが理解しやすいシンプルな実装
- **カスタマイズ性**: ユーザーが改変しやすい標準的なパターン
- **保守性**: 独自抽象化を避け、標準APIを使用

→ **Intersection Observerは標準APIで、ドキュメントが豊富**

### 4. Remix V3への移行パス

Remix V3の方向性：
- React Routerへの統合
- Single Fetchによるデータ取得の簡略化
- View Transitions APIとの統合

→ **標準APIベースの実装は、V3でも有効に機能する**

---

## 採用する実装方針

### Intersection Observer + CSS Animations

```typescript
// app/lib/blog/landing/scrollAnimation.ts
export function observeScrollAnimation(
  elements: HTMLElement[],
  options = { threshold: 0.7 }
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animationType = entry.target.dataset.animation
          entry.target.classList.add(`animate-${animationType}`)
        }
      })
    },
    options
  )

  elements.forEach(el => observer.observe(el))
  return () => observer.disconnect()
}
```

```css
/* app/styles/blog/layer4-landing.ts */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### メリット

| 観点 | Remix本家 | ClaudeMix採用案 |
|------|-----------|----------------|
| **実装コスト** | 高（ScrollStage/Actor実装） | 低（標準API） |
| **学習コスト** | 高（独自概念） | 低（標準パターン） |
| **保守性** | 低（独自抽象化） | 高（標準API） |
| **ブラウザ互換性** | カスタム実装依存 | 広範囲サポート |
| **V3対応** | 不明（要リファクタ） | 容易 |
| **初回ロード** | 複雑なJS | 軽量（CSS主体） |

### デメリットと対処

**デメリット**: 細かい進捗ベースの制御（0.2～0.8のような範囲指定）ができない

**対処**: ClaudeMixのLPは「表示/非表示」の2値制御で十分。複雑なアニメーションは必要ない。

---

## 将来的な拡張性

### View Transitions APIへの移行

将来的に、より洗練されたアニメーションが必要になった場合：

```css
@view-transition {
  navigation: auto;
}
```

→ **ブラウザネイティブのアニメーション**に移行可能

### 段階的な強化

必要に応じて：
1. 最初: CSS Animations（シンプル）
2. 次: Web Animations API（JSで制御）
3. 最終: View Transitions API（ブラウザネイティブ）

---

## 結論

**Intersection Observer + CSS Animations** を採用する理由：

1. ✅ ClaudeMixはボイラープレートであり、シンプルさと学習コストが重要
2. ✅ 標準APIベースでV3への移行が容易
3. ✅ 初回ロードが軽量（CSS主体）
4. ✅ ブラウザ互換性が広い
5. ✅ 将来的な拡張（View Transitions API）への移行パスが明確

**Remix公式の複雑な実装は、マーケティングサイト特有の要件による産物であり、ボイラープレートには不適切**と判断しました。
