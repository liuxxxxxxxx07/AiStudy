const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', () => {});

const CLI_DIR = path.resolve(process.env.APPDATA, '../Roaming/npm/node_modules/@heyputer/cli');
const sdkPath = path.join(CLI_DIR, 'node_modules/@heyputer/puter.js/src/init.cjs');
const { init } = require(sdkPath);

const configPath = path.join(process.env.APPDATA, 'puter-cli-nodejs', 'Config', 'config.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = process.env.PUTER_AUTH_TOKEN || configData.accounts?.default?.token;
if (!token) { console.error('Not authenticated'); process.exit(1); }

const puter = init(token);

async function main() {
  // Create target dir
  const folder = await puter.fs.mkdir('~/Sites/ai-study/deployment', { dedupeName: true });
  const targetPath = (folder && folder.path) ? folder.path : folder;
  console.log('Target:', targetPath);

  // Just send 1 file to test
  const buf = fs.readFileSync('out/index.html');
  const file = new File([buf], 'index.html');
  file.finalPath = 'index.html';
  
  console.log('Uploading 1 file...');
  try {
    const result = await puter.fs.upload([file], targetPath, { overwrite: true, createMissingParents: true });
    console.log('Result:', JSON.stringify(result).slice(0, 200));
  } catch (err) {
    console.error('Error:', err.message || JSON.stringify(err));
  }

  // Create hosting
  try {
    await puter.hosting.create('ai-study', targetPath);
    console.log('Hosting created');
  } catch (e) {
    console.log('Hosting error:', e.message);
  }
  
  console.log('https://ai-study.puter.site');
}

main().catch(e => console.error(e));