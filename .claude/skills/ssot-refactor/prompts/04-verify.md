# Phase 4: Spec Loader 導入検証

## 目的

リファクタリングの結果を検証し、spec loaderが正しく導入されたことを確認する。

## 検証手順

### 1. 型チェック

```bash
npm run typecheck
```

**確認事項**:
- spec loaderのimportが正しいか
- 型定義が正しくimportされているか
- specプロパティへのアクセスが型安全か

### 2. テスト実行

```bash
npm test
```

**確認事項**:
- すべてのテストがパスするか
- spec loaderの非同期処理が正しく動作するか

### 3. 導入率の再計測

Phase 1と同じスキャンを実行し、導入率を再計測する。

```bash
# 実装ファイルの導入率
total=$(find app/routes -name "*.tsx" -o -name "*.ts" | wc -l)
adopted=$(grep -rl "loadSpec\|loadSharedSpec" app/routes | wc -l)
echo "実装: $adopted / $total"

# テストファイルの導入率
total=$(find tests -name "*.test.ts" -o -name "*.spec.ts" | wc -l)
adopted=$(grep -rl "tests/utils/loadSpec" tests | wc -l)
echo "テスト: $adopted / $total"
```

### 4. 残存ハードコードの確認

```bash
# 日本語文字列リテラル（spec経由でないもの）
grep -rn '"[^"]*[ぁ-んァ-ン一-龥]' app/routes --include="*.tsx" --include="*.ts"

# 具体値アサート（テスト）
grep -rn "toBe('[^']*')" tests --include="*.test.ts" --include="*.spec.ts"
```

---

## 検証チェックリスト

- [ ] `npm run typecheck` がエラーなしで完了
- [ ] `npm test` がすべてパス
- [ ] 実装ファイルの導入率が向上
- [ ] テストファイルの導入率が向上
- [ ] 正しいローダーが使われている（サーバー側 vs テスト側）

---

## 出力フォーマット

```markdown
## Spec Loader 導入完了レポート

### 実行結果
| 項目 | 結果 |
|-----|------|
| 型チェック | PASS |
| テスト | PASS (xx tests) |

### 導入率
| 種別 | Before | After | 変化 |
|-----|-------|-------|------|
| 実装ファイル | xx% | xx% | +xx% |
| テストファイル | xx% | xx% | +xx% |

### 修正サマリー
| 種別 | 修正件数 |
|-----|---------|
| 実装ファイル | x件 |
| テストファイル | x件 |

### 残存未導入ファイル（許容）
| ファイル | 理由 |
|---------|------|
| app/routes/_index.tsx | リダイレクトのみ |

### 次のアクション
- 残りの未導入ファイルへの対応計画
```

---

## 完了条件

以下の条件をすべて満たした場合、リファクタリング完了とする。

1. 型チェックがエラーなしで完了
2. すべてのテストがパス
3. 導入率が向上
4. 残存未導入ファイルが許容理由付きで記録
