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
const API = 'https://api.puter.com';

async function callAPI(method, endpoint, body) {
  const url = API + endpoint;
  const opts = {
    method,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return data;
}

async function deploy() {
  // 1. Create directory structure
  console.log('Setting up directories...');
  await callAPI('POST', '/mkdir', {
    path: '~/Sites/ai-study/deployment',
    createMissingParents: true,
    dedupeName: true
  }).catch(() => callAPI('POST', '/mkdir', {
    path: '~/Sites/ai-study/deployment',
    createMissingParents: true,
    dedupeName: true
  }));

  // 2. Upload each file individually via write API
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
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const buf = fs.readFileSync(f.full);
    const url = API + '/write?url=~/Sites/ai-study/deployment/' + f.rel + '&overwrite=1&create_missing_parents=1';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/octet-stream' },
      body: buf
    });
    const result = await resp.json();
    if (!resp.ok) {
      // Try creating parent dir first
      const parent = '~/Sites/ai-study/deployment/' + path.posix.dirname(f.rel);
      await callAPI('POST', '/mkdir', { path: parent, createMissingParents: true });
      const resp2 = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/octet-stream' },
        body: buf
      });
      const result2 = await resp2.json();
      if (!resp2.ok) throw new Error('Upload failed: ' + f.rel + ' - ' + (result2.error?.message || JSON.stringify(result2)));
    }
    console.log('  [' + (i + 1) + '/' + files.length + '] ' + f.rel);
  }

  // 3. Create hosting
  console.log('Creating hosting...');
  try {
    await callAPI('POST', '/hosting/create', { subdomain: 'ai-study', root_dir: '~/Sites/ai-study/deployment' });
  } catch (e) {
    await callAPI('POST', '/hosting/update', { subdomain: 'ai-study', root_dir: '~/Sites/ai-study/deployment' });
  }
  console.log('https://ai-study.puter.site');
}

deploy().catch(e => { console.error('Failed:', e.message); process.exit(1); });