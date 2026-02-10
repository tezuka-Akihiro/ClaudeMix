import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

/**
 * migrate-webp-to-avif.js
 * R2上のWebP画像をAVIFに変換して再アップロードするスクリプト
 *
 * 使い方:
 * 1. 環境変数を設定（.dev.vars または直接設定）
 * 2. node migrate-webp-to-avif.js [--dry-run]
 */

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME
} = process.env;

const isDryRun = process.argv.includes('--dry-run');

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
  console.error('❌ Error: Required environment variables are missing.');
  console.error('Required: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME');
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function migrateWebpToAvif() {
  console.log(`🚀 Starting migration from WebP to AVIF in bucket: ${R2_BUCKET_NAME}`);
  if (isDryRun) console.log('⚠️  DRY RUN MODE ENABLED - No changes will be uploaded.');

  try {
    // 1. WebPの一覧を取得
    // Prefixは必要に応じて調整可能。ここでは全体をスキャン
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
    });

    const list = await s3.send(listCommand);
    const webpKeys = list.Contents?.filter(c => c.Key?.endsWith(".webp")) || [];

    if (webpKeys.length === 0) {
      console.log('✅ No WebP files found.');
      return;
    }

    console.log(`📝 Found ${webpKeys.length} WebP files to convert.`);

    // 2. 順次処理（大量にある場合はバッチ処理を検討）
    for (const obj of webpKeys) {
      const key = obj.Key;
      const newKey = key.replace(".webp", ".avif");

      console.log(`🔄 Processing: ${key}...`);

      try {
        // a. ダウンロード
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        });
        const response = await s3.send(getCommand);
        const buffer = Buffer.from(await response.Body.transformToByteArray());

        // b. AVIF変換
        // quality: 65 (バランス重視), effort: 6 (速度と圧縮率のバランス)
        const avifBuffer = await sharp(buffer)
          .avif({ quality: 65, effort: 6 })
          .toBuffer();

        if (isDryRun) {
          console.log(`   ✨ [Dry Run] Would convert ${key} (${buffer.length} bytes) -> ${newKey} (${avifBuffer.length} bytes)`);
        } else {
          // c. アップロード
          const putCommand = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: newKey,
            Body: avifBuffer,
            ContentType: "image/avif",
          });
          await s3.send(putCommand);
          console.log(`   ✅ Converted and uploaded: ${newKey} (${avifBuffer.length} bytes)`);
        }
      } catch (err) {
        console.error(`   ❌ Failed to process ${key}:`, err.message);
      }
    }

    console.log('✨ Migration process completed.');

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

migrateWebpToAvif();
