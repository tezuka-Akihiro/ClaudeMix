# 不具合調査・解消レポート - FlashMessage 自動非表示失敗

## ✅ 解決済み - PC再起動により解消

**解決日時**: 2025-12-26

**解決方法**: PC再起動により問題が解消されました。Test 15 (FlashMessage test) が成功しました。

---

## 1. 不具合の概要（発生時）

### 発生事象

* E2Eテスト `tests\e2e\account\common.spec.ts:116` でFlashMessageの自動非表示が機能しない
* 5000ms後に自動で非表示になるべきだが、10000ms待っても表示されたまま

### エラータイプ

* [x] test-failure (テスト失敗)

### 優先度判定

* [x] **P1 (Error)**: E2Eテスト失敗

### 再現手順

1. `/login?message=session-expired` にアクセス
2. フラッシュメッセージ「セッションの有効期限が切れました」が表示される
3. 5000ms経過後もメッセージが表示され続ける

### 期待される動作

* FlashMessageが表示される
* 5000ms後に自動的に非表示になる（DOM から削除される）
* テストが成功する

### 実際の動作

* FlashMessageは表示される
* 10000ms待ってもメッセージが表示され続ける
* テストが `expect(flashMessage).not.toBeVisible()` で失敗する

### 環境

* **OS**: Windows 11
* **ブラウザ**: Chromium (Playwright)
* **Node.js**: v18+
* **Framework**: Remix (SSR + Client Hydration)

---

## 2. 階層別エラー確認

### 影響レイヤー

* [x] **UI層** (`routes/`, `components/`)
* [x] **テスト層** (`tests/`)

### テスト・ビルド確認

* `[x]` **E2Eテスト**
  * 結果: 14テスト成功、1テスト失敗 (FlashMessage auto-dismiss)
* `[x]` **ビルド**
  * 結果: 成功

---

## 3. 根本原因分析

### 仮説

1. **useEffect のタイミング問題**
   - サーバーサイドレンダリング時は useEffect が実行されない
   - クライアントハイドレーション時に useEffect が正しく実行されていない

2. **依存配列の問題**
   - 当初 `onClose` を依存配列に含めていたことで、不要な再実行が発生
   - 修正後も問題が継続

3. **React Strict Mode の影響**
   - 開発モードでの二重実行により、timer が clear される
   - しかし、再度 timer が設定されるはずなので、これだけでは説明できない

4. **コンポーネントの再マウント**
   - 親コンポーネントの再レンダリングで FlashMessage が再マウントされている
   - timer がリセットされ続けている

### 調査結果

**FlashMessage コンポーネント実装**:
```typescript
export function FlashMessage({ message, type = 'info', autoDismiss = true, autoDismissDelay = 5000, onClose }: FlashMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoDismiss) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, autoDismissDelay);
    return () => clearTimeout(timer);
  }, [autoDismiss, autoDismissDelay]);

  if (!isVisible) {
    return null;
  }
  // ... render JSX
}
```

**login.tsx での使用**:
```typescript
{loaderData.flashMessage && (
  <FlashMessage
    message={loaderData.flashMessage}
    type="info"
    autoDismiss={true}
    autoDismissDelay={5000}
  />
)}
```

**テストコード**:
```typescript
await page.goto('/login?message=session-expired');
const flashMessage = page.locator('[data-testid="flash-message"]');
await expect(flashMessage).toBeVisible();
await expect(flashMessage).toContainText('セッションの有効期限が切れました');
await expect(flashMessage).not.toBeVisible({ timeout: 10000 });
```

### Why1: なぜFlashMessageが10秒後も表示されているか？

→ setTimeout の timer が発火していない

### Why2: なぜ timer が発火しないか？

→ useEffect が正しく実行されていない、または timer が途中で clear されている

### Why3: なぜ useEffect が正しく実行されないか？

→ 考えられる原因:
1. コンポーネントが繰り返し再マウントされ、timer がリセットされている
2. Remix の SSR/ハイドレーションで useEffect の実行タイミングに問題がある
3. 依存配列に含めるべき値が含まれていない（または逆に含めるべきでない値が含まれている）

### 根本原因（仮説）

* **Remix の SSR/ハイドレーション問題**: サーバーで最初にレンダリングされた後、クライアント側でハイドレーションが完了するまでの間、または完了後に useEffect が期待通りに動作していない可能性
* **コンポーネントの再マウント**: 親コンポーネント（login.tsx）が何らかの理由で再レンダリングされ、FlashMessage が再マウントされている可能性

---

## 4. 解消方針

### 方針1（推奨）: key prop を使用してコンポーネントの再マウントを防ぐ

* **概要**: FlashMessage に key prop を追加して、message が同じ間はコンポーネントが再マウントされないようにする
* **実装**:
```typescript
{loaderData.flashMessage && (
  <FlashMessage
    key={loaderData.flashMessage}
    message={loaderData.flashMessage}
    type="info"
    autoDismiss={true}
    autoDismissDelay={5000}
  />
)}
```
* **メリット**: コンポーネントの同一性を保証し、不要な再マウントを防ぐ
* **デメリット**: 同じメッセージを連続で表示する場合、再マウントされない

### 方針2: useRef を使って timer を管理

* **概要**: useState の代わりに useRef で timer を保持し、より確実に timer を管理
* **実装**:
```typescript
const timerRef = useRef<NodeJS.Timeout>();
useEffect(() => {
  if (!autoDismiss) return;
  timerRef.current = setTimeout(() => {
    setIsVisible(false);
    onClose?.();
  }, autoDismissDelay);
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, [autoDismiss, autoDismissDelay]);
```
* **メリット**: timer の参照を確実に保持
* **デメリット**: 現在の実装から大きく変わらず、効果が不明

### 方針3: テストで手動クローズボタンをクリック

* **概要**: 自動非表示のテストをスキップし、手動クローズボタンのテストに変更
* **実装**:
```typescript
await flashMessage.locator('[data-testid="flash-message-close"]').click();
await expect(flashMessage).not.toBeVisible();
```
* **メリット**: 確実にテストが通る
* **デメリット**: 自動非表示機能のテストにならない

### 方針4: Remix の clientLoader を使用

* **概要**: FlashMessage の表示をクライアントサイドのみで行い、SSR の影響を排除
* **メリット**: SSR/ハイドレーション問題を回避
* **デメリット**: アーキテクチャの変更が必要

---

## 5. 実施する修正

### 試行1: key prop を追加（方針1）

**ファイル**: app/routes/login.tsx

**変更内容**:

```typescript
// Before
{loaderData.flashMessage && (
  <FlashMessage
    message={loaderData.flashMessage}
    type="info"
    autoDismiss={true}
    autoDismissDelay={5000}
  />
)}

// After
{loaderData.flashMessage && (
  <FlashMessage
    key={loaderData.flashMessage}
    message={loaderData.flashMessage}
    type="info"
    autoDismiss={true}
    autoDismissDelay={5000}
  />
)}
```

**理由**: key prop を追加することで、React がコンポーネントの同一性を正しく判断し、不要な再マウントを防ぐ

---

## 6. ユーザーへの報告

### 現状

* **成功**: 14テスト (Authentication, Navigation, Modal等)
* **失敗**: 1テスト (FlashMessage auto-dismiss)

### 試した対策

1. ✅ FlashMessage コンポーネント作成
2. ✅ useEffect から isVisible 依存を削除
3. ✅ テスト待機時間を 5000ms → 5500ms に延長
4. ✅ Playwright の toBeVisible({ timeout: 10000 }) を使用
5. ✅ useEffect から onClose 依存を削除、optional chaining 使用
6. ❌ 上記すべて試したが、auto-dismiss は動作せず（2回連続失敗）

### 推奨アクション

**方針1を試す**: login.tsx の FlashMessage に key prop を追加して、コンポーネントの再マウントを防ぐ

**それでも失敗する場合**:
- 方針3: 自動非表示テストをスキップし、手動クローズボタンのテストに変更
- または、ブラウザで手動確認を依頼（実際に自動非表示が動作するか確認）

**実装しますか？それとも別の指示がありますか？**

---

**レポート作成日時**: 2025-12-26
**作成者**: Claude Code
