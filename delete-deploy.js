// claudflare pages のデプロイを削除するスクリプト
import fs from 'fs';
import path from 'path';

const CONFIG = {
  // ↓↓↓ ここに直接値を入力してください ↓↓↓
  apiToken: 'Vj1icQlVqR_7eo8LHqEDvL_NytGp0W-OVuGAk8x-',      // Cloudflareダッシュボードで作成したAPIトークン
  accountId: '01e14686c54c15eb6ed8cf434956a40d',    // `npx wrangler whoami` で確認できるアカウントID
  projectName: 'claudemix',     // Cloudflare Pagesのプロジェクト名
  // ↑↑↑ ここまで ↑↑↑
  apiBaseUrl: 'https://api.cloudflare.com/client/v4',
};

  // claudflare pages のデプロイを削除するスクリプト

if (CONFIG.apiToken === 'YOUR_API_TOKEN_HERE' || CONFIG.accountId === 'YOUR_ACCOUNT_ID_HERE') {
  console.error('Error: Please update the CONFIG object in this script with your actual Cloudflare credentials.');
  process.exit(1);
}

// デプロイメント一覧を取得する関数
async function getDeployments() {
  // 修正: per_page=50 を削除し、デフォルト（通常25件）で取得するように変更
  const url = `${CONFIG.apiBaseUrl}/accounts/${CONFIG.accountId}/pages/projects/${CONFIG.projectName}/deployments?sort_by=created_on&sort_order=desc`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CONFIG.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (!data.success) {
      console.error('Failed to fetch deployments list:', data.errors);
      return [];
    }
    return data.result;
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return [];
  }
}

// デプロイメントを削除する関数
async function deleteDeployment(deploymentId) {
  const url = `${CONFIG.apiBaseUrl}/accounts/${CONFIG.accountId}/pages/projects/${CONFIG.projectName}/deployments/${deploymentId}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!data.success) {
      console.error(`Failed to delete deployment ${deploymentId}:`, data.errors);
      return false;
    }
    console.log(`Successfully deleted deployment ${deploymentId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting deployment ${deploymentId}:`, error);
    return false;
  }
}

async function main() {
  console.log('Fetching deployment list from Cloudflare...');
  const deployments = await getDeployments();

  if (deployments.length === 0) {
    console.log('No deployments found on Cloudflare (or failed to fetch).');
    return;
  }

  // mainブランチの最新を探す
  const latestMain = deployments.find(d => d.deployment_trigger?.metadata?.branch === 'main');
  
  let targets = deployments;

  // mainの最新が含まれていたら除外する
  if (latestMain) {
    console.log(`\nℹ️  Preserving latest main deployment: ${latestMain.id} (Created: ${latestMain.created_on})`);
    targets = deployments.filter(d => d.id !== latestMain.id);
  } else {
    console.log('\n⚠️  Could not find any "main" branch deployments in the fetched list. All fetched deployments will be deleted.');
  }

  if (targets.length === 0) {
    console.log('No deployments to delete (only the latest main deployment was found).');
    return;
  }

  console.log(`\nFound ${targets.length} deployments to delete.`);
  console.log('Starting deletion automatically...\n');

  for (const deployment of targets) {
    const branchName = deployment.deployment_trigger?.metadata?.branch || 'unknown branch';
    console.log(`Deleting ${deployment.id} (${branchName})...`);
    await deleteDeployment(deployment.id);
  }
  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});