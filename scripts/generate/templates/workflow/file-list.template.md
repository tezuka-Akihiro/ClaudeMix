# file-list.md - {{section}} Section

## 目的

{{section}}セクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| {{section}}.spec.ts | tests/e2e/section/{{service}}/{{section}}.spec.ts | {{section}}セクション単独のE2Eテスト |

---

## 2. UI層（Phase 2.3）

### 2.1 Components ({{section}}固有)

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| {ファイル名を記入} | app/components/{{service}}/{{section}}/{ファイル名} | {説明を記入} |

### 2.2 Shared Components ({{service}}内共有)

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| {ファイル名を記入} | app/components/{{service}}/shared/{ファイル名} | {説明を記入} |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| {ファイル名を記入} | app/lib/{{service}}/{{section}}/{ファイル名} | {説明を記入} |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| {ファイル名を記入} | app/data-io/{{service}}/{{section}}/{ファイル名} | {説明を記入} |
