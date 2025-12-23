/**
 * scripts/start-dev.js
 * 役割: 新規サービス開発の初期環境をセットアップする。
 * 動作: project.toml を参照し、指定されたサービス(--slug)のディレクトリを生成する。
 *      - セクションフォルダ: <ルート>/<サービス>/<セクション>
 *      - サービスフォルダ: <ルート>/<サービス>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import toml from '@iarna/toml';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { argv } = process;

// --- 設定 ---

// ディレクトリ生成設定
// type: 'section': <ルート>/<サービス>/<セクション> 形式で生成
// type: 'service': <ルート>/<サービス> 形式で生成
const DIR_STRUCTURE_CONFIG = [
    { path: path.join('..', 'develop'), type: 'section' },
    { path: path.join('..', 'app', 'components'), type: 'section' },
    { path: path.join('..', 'app', 'lib'), type: 'section' },
    { path: path.join('..', 'app', 'data-io'), type: 'section' },
    { path: path.join('..', 'app', 'styles'), type: 'service' },
    { path: path.join('..', 'tests', 'e2e'), type: 'service' },
];
// コピーするフローファイル名 (あなたの定義に基づく)
const FLOW_FILES = [
    { type: 'guiding-principles', name: 'GUIDING_PRINCIPLES.md' },
    { type: 'requirements-analysis-pipe', name: 'REQUIREMENTS_ANALYSIS_PIPE.md' },
];

// --- グローバル変数 ---
let createdDirs = []; // ロールバック用に作成したディレクトリを記録

// --- 関数定義 ---

/**
 * サービス slug をコマンドライン引数から取得する関数
 * 例: --slug=user-profile から 'user-profile' を取得
 * @returns {string | null}
 */
function getSlug() {
    const slugArg = argv.find(arg => arg.startsWith('--slug='));
    if (slugArg) {
        return slugArg.split('=')[1].trim();
    }
    return null;
}

/**
 * project.toml を読み込み、設定を返す
 * @returns {object} プロジェクト設定
 */
function loadProjectConfig() {
    const projectConfigPath = path.join(__dirname, 'project.toml');
    if (!fs.existsSync(projectConfigPath)) {
        throw new Error(`設定ファイルが見つかりません: ${projectConfigPath}`);
    }
    return toml.parse(fs.readFileSync(projectConfigPath, 'utf-8'));
}

/**
 * ディレクトリを作成する
 * @param {string[]} dirsToCreate - 作成するディレクトリのパス配列
 */
function createDirectories(dirsToCreate) {
    console.log('✅ 開発フォルダを作成します...');
    for (const dir of dirsToCreate) {
        if (fs.existsSync(dir)) {
            console.warn(`⚠️  警告: フォルダ "${dir}" は既に存在します。スキップします。`);
            continue;
        }
        fs.mkdirSync(dir, { recursive: true });
        createdDirs.push(dir); // ロールバック用に記録
        console.log(`   - 作成完了: ${dir}`);
    }
}

/**
 * ワークフローのテンプレートファイルをコピーする
 * @param {string} slug - サービスのスラッグ
 */
function copyWorkflowFiles(slug) {
    console.log('\n✅ ワークフローテンプレートをコピーします...');
    for (const file of FLOW_FILES) {
        const command = `npm run generate -- --non-interactive --category documents --document-type ${file.type} --service ${slug}`;
        try {
            console.log(`   - 実行中: ${command}`);
            execSync(command, { stdio: 'inherit' });
            console.log(`   - 完了: ${file.name}`);
        } catch (error) {
            console.error(`🔴 コマンドの実行に失敗しました: ${command}`);
            throw error; // エラーを再スローしてロールバックをトリガー
        }
    }
}

/**
 * エラー発生時に作成したディレクトリをクリーンアップする
 */
function rollback() {
    if (createdDirs.length === 0) return;
    console.log('\n🔄 エラーが発生したため、作成したディレクトリを削除します...');
    // 深い階層から削除するために逆順ソート
    createdDirs.sort((a, b) => b.length - a.length);
    for (const dir of createdDirs) {
        try {
            if (fs.existsSync(dir)) {
                // 空のディレクトリのみ削除
                if (fs.readdirSync(dir).length === 0) {
                    fs.rmdirSync(dir);
                    console.log(`   - 削除完了: ${dir}`);
                }
            }
        } catch (e) {
            console.warn(`⚠️ 警告: ディレクトリの削除に失敗しました: ${dir}。手動で確認してください。`);
        }
    }
}

/**
 * メイン実行関数
 */
async function main() {
    const slug = getSlug();
    if (!slug) {
        console.error('🔴 エラー: サービスのスラッグ(--slug=<slug>)を指定してください。\n例: npm run dev:start -- --slug=user-profile');
        process.exit(1);
    }

    try {
        const projectConfig = loadProjectConfig();
        const serviceSections = projectConfig.services?.[slug]?.sections;
        if (!serviceSections) throw new Error(`project.toml にサービス "${slug}" またはそのセクションが見つかりません。`);

        const sectionKeys = Object.keys(serviceSections);
        if (sectionKeys.length === 0) console.warn(`⚠️ 警告: サービス "${slug}" にセクションが定義されていません。`);

        const targetDirs = [];

        // 設定に基づいてディレクトリパスを生成
        for (const config of DIR_STRUCTURE_CONFIG) {
            const rootPath = path.join(__dirname, config.path);
            const serviceDir = path.join(rootPath, slug);

            // 常に <ルート>/<サービス> は作成対象
            targetDirs.push(serviceDir);

            // typeが'section'の場合、セクションフォルダも作成対象に追加
            if (config.type === 'section') {
                for (const sectionKey of sectionKeys) {
                    targetDirs.push(path.join(serviceDir, sectionKey));
                }
            }
        }

        createDirectories([...new Set(targetDirs)]);
        copyWorkflowFiles(slug);

        const developServiceDir = path.join(__dirname, '..', 'develop', slug);
        console.log(`\n🎉 セットアップ完了。AIエージェントの作業を開始できます。`);
        console.log(`次のステップ: ${developServiceDir}/REQUIREMENTS_ANALYSIS_PIPE.md を開き、要件を記述してください。`);

    } catch (error) {
        console.error(`\n🔴 処理中にエラーが発生しました: ${error.message}`);
        rollback();
        process.exit(1);
    }
}

main().catch(e => {
    console.error(`\n🔴 予期せぬエラー: ${e.message}`);
    rollback();
    process.exit(1);
});
