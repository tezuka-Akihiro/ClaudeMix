import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import toml from '@iarna/toml';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// --- モジュールのモック化 ---
// 外部依存（ファイルシステム、コマンド実行など）をモックします。
vi.mock('fs');
vi.mock('@iarna/toml');
vi.mock('child_process');

// --- テスト本体 ---
describe('scripts/start-dev.js', () => {
    const MOCK_SLUG = 'test-service';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // テスト用のモックデータを準備
    const mockProjectConfig = {
        services: {
            [MOCK_SLUG]: {
                sections: {
                    'section-a': {},
                    'section-b': {},
                },
            },
        },
    };

    // 各テストの前に実行するセットアップ
    beforeEach(() => {
        // process.argv をモックしてコマンドライン引数を偽装
        vi.spyOn(process, 'argv', 'get').mockReturnValue([
            'node',
            'scripts/start-dev.js',
            `--slug=${MOCK_SLUG}`,
        ]);

        // fs と toml のモック設定
        // project.tomlのチェックではtrueを、それ以外（ディレクトリ作成時）ではfalseを返すように設定
        vi.mocked(fs.existsSync).mockImplementation((p) => {
            if (p.endsWith('project.toml')) {
                return true;
            }
            return false;
        });
        vi.mocked(fs.readFileSync).mockReturnValue(''); // toml.parseでモックするので内容は空でOK
        vi.mocked(toml.parse).mockReturnValue(mockProjectConfig);

        // コンソール出力を抑制
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // 各テストの後に実行するクリーンアップ
    afterEach(() => {
        vi.restoreAllMocks(); // すべてのモックをリセット
        // モジュールのキャッシュをリセットして、各テストでスクリプトが再実行されるようにする
        vi.resetModules();
    });

    it('サービスフォルダとセクションフォルダの両方を正しく生成しようとすること', async () => {
        // --- 実行 ---
        // テスト対象のスクリプトを動的にimportして実行
        await import('./start-dev.js');

        // --- 検証 ---
        const mkdirSyncMock = vi.mocked(fs.mkdirSync);
        const createdDirs = mkdirSyncMock.mock.calls.map(call => call[0]);

        // path.joinを使ってプラットフォーム非依存のパスを生成
        const expectedDirs = [
            // develop (section)
            path.join(__dirname, '..', 'develop', MOCK_SLUG),
            path.join(__dirname, '..', 'develop', MOCK_SLUG, 'section-a'),
            path.join(__dirname, '..', 'develop', MOCK_SLUG, 'section-b'),
            // app/components (section)
            path.join(__dirname, '..', 'app', 'components', MOCK_SLUG),
            path.join(__dirname, '..', 'app', 'components', MOCK_SLUG, 'section-a'),
            path.join(__dirname, '..', 'app', 'components', MOCK_SLUG, 'section-b'),
            // app/lib (section)
            path.join(__dirname, '..', 'app', 'lib', MOCK_SLUG),
            path.join(__dirname, '..', 'app', 'lib', MOCK_SLUG, 'section-a'),
            path.join(__dirname, '..', 'app', 'lib', MOCK_SLUG, 'section-b'),
            // app/data-io (section)
            path.join(__dirname, '..', 'app', 'data-io', MOCK_SLUG),
            path.join(__dirname, '..', 'app', 'data-io', MOCK_SLUG, 'section-a'),
            path.join(__dirname, '..', 'app', 'data-io', MOCK_SLUG, 'section-b'),
            // app/styles (service)
            path.join(__dirname, '..', 'app', 'styles', MOCK_SLUG),
            // tests/e2e/section (service)
            path.join(__dirname, '..', 'tests', 'e2e', 'section', MOCK_SLUG),
        ];

        // 期待されるディレクトリがすべて作成されようとしたか確認
        // toEqual だと順序も見るが、arrayContaining だと順序を無視して要素の含有をチェックできる
        expect(createdDirs).toEqual(expect.arrayContaining(expectedDirs));
        // 重複がないことも含めて、配列の長さが一致することも確認
        expect(createdDirs.length).toBe(expectedDirs.length);

        // ワークフローファイルコピーのコマンドが正しく実行されたか確認
        const execSyncMock = vi.mocked(execSync);
        expect(execSyncMock).toHaveBeenCalledWith(expect.stringContaining(`--service ${MOCK_SLUG}`), expect.any(Object));
        expect(execSyncMock).toHaveBeenCalledTimes(2); // FLOW_FILES の数
    });

    describe('異常系: エラーケース', () => {
        it('--slugが指定されていない場合、エラーを出力して終了すること', async () => {
            // --- 準備 ---
            // process.argvから --slug を除外
            vi.spyOn(process, 'argv', 'get').mockReturnValue([
                'node',
                'scripts/start-dev.js',
            ]);
            // process.exit をモックして、呼び出されたか確認
            const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});
            const errorMock = vi.spyOn(console, 'error');

            // --- 実行 ---
            await import('./start-dev.js');

            // --- 検証 ---
            // エラーメッセージが表示されたか
            expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('サービスのスラッグ(--slug=<slug>)を指定してください。'));
            // process.exit(1) が呼び出されたか
            expect(exitMock).toHaveBeenCalledWith(1);
        });

        it('ファイルコピーに失敗した場合、ロールバックが実行され作成したディレクトリが削除されること', async () => {
            // --- 準備 ---
            // execSyncがエラーをスローするようにモック
            const execError = new Error('npm run generate failed');
            vi.mocked(execSync).mockImplementation(() => {
                throw execError;
            });

            // mkdirSyncで作成されたディレクトリを記録する
            const actuallyCreatedDirs = [];
            vi.mocked(fs.mkdirSync).mockImplementation((p) => {
                actuallyCreatedDirs.push(p);
            });

            // existsSync の振る舞いを変更: 作成されたディレクトリは存在するとみなす
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p.endsWith('project.toml')) return true;
                return actuallyCreatedDirs.includes(p);
            });

            // rmdirSync の前提条件である readdirSync もモックする
            vi.mocked(fs.readdirSync).mockReturnValue([]);

            const rmdirSyncMock = vi.spyOn(fs, 'rmdirSync');
            const errorMock = vi.spyOn(console, 'error');
            const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});

            // --- 実行 ---
            await import('./start-dev.js');

            // --- 検証 ---
            // 1. ロールバック処理が呼ばれたことを確認
            //    fs.rmdirSync が呼ばれているはず
            const expectedDirCount = 14; // 正常系テストで作成されるディレクトリの数
            expect(rmdirSyncMock).toHaveBeenCalledTimes(expectedDirCount);

            // 2. エラーメッセージが表示されたか
            expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('コマンドの実行に失敗しました'));
            expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('処理中にエラーが発生しました'));

            // 3. process.exit(1) が呼び出されたか
            expect(exitMock).toHaveBeenCalledWith(1);
        });
    });
});