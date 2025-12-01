#!/bin/bash

# スクリプトの堅牢性を高める設定
set -e # エラーが発生したらスクリプトを終了
set -u # 未定義の変数を使用したらエラー
set -o pipefail # パイプラインの途中でエラーが発生したら終了

# --- ヘルプメッセージ ---
print_usage() {
  echo "Usage: $0 <service_name>"
  echo "  <service_name>: The name of the service to run the linter on (e.g., service-name)."
  echo "Example: $0 service-name"
}

# --- 引数チェック ---
if [ "$#" -ne 1 ]; then
  echo "Error: Invalid number of arguments." >&2
  print_usage
  exit 1
fi

SERVICE_NAME="$1"

# --- 対象のベースディレクトリを定義 ---
BASE_DIRS=(
  "app/routes/${SERVICE_NAME}"
  "app/lib/${SERVICE_NAME}"
  "app/data-io/${SERVICE_NAME}"
  "app/components/${SERVICE_NAME}"
)

# --- 最終的な対象ディレクトリを格納する配列 ---
FINAL_TARGET_DIRS=()

# --- 各ベースディレクトリ配下のセクションディレクトリを検索して追加 ---
echo ">> Finding section directories for service '$SERVICE_NAME'..."
for base_dir in "${BASE_DIRS[@]}"; do
  if [ -d "$base_dir" ]; then
    # findコマンドで直下のディレクトリのみを検索し、FINAL_TARGET_DIRS配列に追加
    while IFS= read -r d; do
      FINAL_TARGET_DIRS+=("$d")
      echo "   Found: $d"
    done < <(find "$base_dir" -mindepth 1 -maxdepth 1 -type d)
  else
    echo "   Skipping (not found): $base_dir"
  fi
done

LINTER_SCRIPT="scripts/lint-template/engine.js"

# --- Linter実行 ---
echo -e "\n>> Running linter on ${#FINAL_TARGET_DIRS[@]} directories..."
node "$LINTER_SCRIPT" "${FINAL_TARGET_DIRS[@]}"

echo ">> Linting process completed successfully."