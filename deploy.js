const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PUTER_TOKEN = execSync("puter whoami --token 2>nul || echo NO_TOKEN", { encoding: "utf8" }).trim();

if (PUTER_TOKEN === "NO_TOKEN") {
  console.log("请先运行: puter login");
  process.exit(1);
}

const OUT_DIR = path.resolve(__dirname, "out");
const SUBDOMAIN = "ai-study";
const DIR_NAME = "ai-study-site";

function walkDir(dir, base = "") {
  const entries = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      entries.push(...walkDir(path.join(dir, entry.name), rel));
    } else {
      entries.push({ rel, fullPath: path.join(dir, entry.name) });
    }
  }
  return entries;
}

async function deploy() {
  const files = walkDir(OUT_DIR);
  console.log(`Found ${files.length} files to upload`);

  // Upload in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    console.log(`Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}...`);

    const cmds = batch.map((f) => {
      const dir = path.dirname(f.rel);
      return `mkdir -p "${DIR_NAME}/${dir}" && puter.fs.write("${DIR_NAME}/${f.rel}", fs.readFileSync("${f.fullPath.replace(/\\/g, "\\\\")}"))`;
    });

    for (const file of batch) {
      const content = fs.readFileSync(file.fullPath);
      const puterDir = path.dirname(file.rel).replace(/\\/g, "/");
      
      // Create directories
      if (puterDir !== ".") {
        await execCmd(`mkdir -p "${DIR_NAME}/${puterDir}"`);
      }
      
      // Upload file
      await execCmd(`puter fs write "${DIR_NAME}/${file.rel}" --from-file "${file.fullPath}"`);
      console.log(`  ✓ ${file.rel}`);
    }
  }

  console.log("\nCreating hosting site...");
  await execCmd(`puter hosting create "${SUBDOMAIN}" "${DIR_NAME}"`);
  console.log(`\n✓ 部署成功! https://${SUBDOMAIN}.puter.site`);
}

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    try {
      execSync(cmd, { cwd: __dirname, shell: true, stdio: "pipe" });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

deploy().catch((err) => console.error("Deploy failed:", err.message));
