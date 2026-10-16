import { createJiti } from 'jiti';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testsDir = __dirname;
const jiti = createJiti(import.meta.url);

const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.ts') && !f.includes('sanity'));

console.log(`\n🧪 Discovered ${testFiles.length} test suites:`);
testFiles.forEach((file) => console.log(`  - ${file}`));
console.log('--------------------------------------------------\n');

for (const file of testFiles) {
  const fullPath = path.join(testsDir, file);
  await jiti.import(fullPath);
}
