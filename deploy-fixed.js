const fs = require('fs');
const path = require('path');

const CLI_DIR = path.resolve(process.env.APPDATA, '../Roaming/npm/node_modules/@heyputer/cli');
const sdkPath = path.join(CLI_DIR, 'node_modules/@heyputer/puter.js/src/init.cjs');
const { init } = require(sdkPath);

const configPath = path.join(process.env.APPDATA, 'puter-cli-nodejs', 'Config', 'config.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = process.env.PUTER_AUTH_TOKEN || configData.accounts?.default?.token;
if (!token) { console.error('Not authenticated'); process.exit(1); }

const puter = init(token);

async function deploy() {
  // Target path is already set from the previous run
  const TARGET = '/cool_fish_5051/Sites/ai-study/deployment';

  // Collect files
  const files = [];
  (function walkDir(dir, base) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = base ? base + '/' + entry.name : entry.name;
      if (entry.isDirectory()) walkDir(full, rel);
      else if (entry.isFile()) files.push({ full, rel });
    }
  })('out', '');
  console.log('Uploading ' + files.length + ' files...');

  // Upload each file individually
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const remotePath = TARGET + '/' + f.rel;
    try {
      await puter.fs.write(remotePath, fs.readFileSync(f.full));
      console.log('  [' + (i + 1) + '/' + files.length + '] ' + f.rel);
    } catch (err) {
      // Try creating parent dir first
      const parentDir = TARGET + '/' + f.rel.split('/').slice(0, -1).join('/');
      try { await puter.fs.mkdir(parentDir, { createMissingParents: true }); } catch (e2) {}
      await puter.fs.write(remotePath, fs.readFileSync(f.full));
      console.log('  [' + (i + 1) + '/' + files.length + '] ' + f.rel + ' (mkdir)');
    }
  }

  // Update hosting to point to the new deployment folder
  console.log('Updating hosting...');
  try {
    await puter.hosting.update('ai-study', TARGET);
    console.log('Hosting updated.');
  } catch (e) {
    console.log('Update error:', e.message);
    try {
      await puter.hosting.create('ai-study', TARGET);
      console.log('Hosting created.');
    } catch (e2) {
      console.log('Create error:', e2.message);
    }
  }
  console.log('https://ai-study.puter.site');
}

deploy().catch(e => { console.error('Failed:', e.message); process.exit(1); });