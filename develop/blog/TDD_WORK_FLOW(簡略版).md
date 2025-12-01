## 6 TDD_WORK_FLOW.md 簡易版
### 👁️e2e-screen-test ✅完了
**パス**: `tests/e2e/screen/blog.screen.spec.ts`
**編集内容**: タググループ化の表示確認テストを追加（グループヘッダーが表示されること、各グループのタグが正しく表示されること）

### 👁️e2e-section-test ✅完了
**パス**: `tests/e2e/section/blog/posts.spec.ts`
**編集内容**: FilterPanel内のタググループ表示とグループ別タグ選択のインタラクションテストを追加

### 🎨CSS実装 (layer2.css, layer3.ts, layer4.ts) ✅完了
参考資料
 docs\CSS_structure\STYLING_CHARTER.md
 develop\blog\タググループ追加.md

**パス**:
- `app/styles/blog/layer2.css`: `.tag-group-header`の見た目（色、フォントサイズ、font-weight）を追加
- `app/styles/blog/layer3.ts`: **flex/grid指定を変更・追加**
  - `.tag-grid`: grid → flex (column) に変更
  - `.tag-group-container`: 新規追加（flex (column)）
  - `.tag-group-grid`: 新規追加（grid、既存の`.tag-grid`のgrid指定を継承）
- `app/styles/blog/layer4.ts`: 変更なし（例外的な構造は不要）

### 🪨route ✅完了
**パス**: `app/routes/blog._index.tsx`
**編集内容**: loaderでfetchAvailableFilters.serverから取得したtagGroupsをFilterPanelに渡すよう更新

### 🚧components.test ✅完了
**パス**:
- `app/components/blog/posts/TagGrid.test.tsx`: グループ化されたタグの表示テストを追加
- `app/components/blog/posts/FilterPanel.test.tsx`: tagGroupsプロパティを受け取るテストケースを追加

### 🪨components ✅完了
**パス**:
- `app/components/blog/posts/TagGrid.tsx`: tagGroupsプロパティを受け取り、グループヘッダー + タグボタンの形式で表示するよう実装を変更
- `app/components/blog/posts/FilterPanel.tsx`: tagGroupsをTagGridに渡すよう更新

### 🚧logic.test ✅完了
**パス**: `app/lib/blog/posts/groupTagsByCategory.test.ts` **【新規】**
**編集内容**: availableTagsとspec.yamlのタグ定義から、グループ別タグ配列を生成するロジックのユニットテスト

### 🪨logic ✅完了
**パス**: `app/lib/blog/posts/groupTagsByCategory.ts` **【新規】**
**編集内容**: タググループ化処理の純粋関数を実装（入力: availableTags[], tagsSpec、出力: { group: string; tags: string[] }[]）

### 🚧data-io.test ✅完了
**パス**: `app/data-io/blog/posts/fetchAvailableFilters.server.test.ts`
**編集内容**: tagGroupsフィールドが正しく返されることを検証するテストを追加

### 🪨data-io ✅完了
**パス**: `app/data-io/blog/posts/fetchAvailableFilters.server.ts`
**編集内容**: groupTagsByCategoryを呼び出し、tagGroups情報を含むAvailableFiltersオブジェクトを返すよう実装を変更

### その他
**パス**:
- `develop/blog/posts/spec.yaml`: `ui_selectors.filter.tag_group_header`セレクタを追加、tagsセクションにグループ化方針のコメントを追加
- `TAG_CATEGORY_SPEC.md`: 削除（spec.yamlに統合済み）
- `develop/blog/タググループ追加.md`: 実装完了後、実装ログを追記してクローズ
- **重要**: 新規ファイル作成時は `scripts/generate/README.md` を厳守すること