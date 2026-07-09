import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

function walkFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
}

function requireNotContains(file, forbidden) {
  const content = readFileSync(file, 'utf8');
  if (content.includes(forbidden)) {
    throw new Error(`${file} contient une référence interdite : ${forbidden}`);
  }
}

run(process.execPath, ['--check', 'kloub-air-plomberie/app.js']);

for (const file of walkFiles('kloub-air-plomberie')) {
  if (!/\.(html|css|js|json|webmanifest)$/i.test(file)) continue;
  requireNotContains(file, 'script.google.com');
  requireNotContains(file, 'AKfy');
  requireNotContains(file, '1KCHd6vdtlElV7wR9kg1ZhTsvEfE56BMDd_L32Q6KzgQ');
}

console.log('Vérifications locales réussies.');
