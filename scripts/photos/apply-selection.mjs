import { execFileSync } from 'node:child_process';
import { readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = await realpath(fileURLToPath(new URL('../../public/', import.meta.url)));
const [mapFile, batch = 'candidates'] = process.argv.slice(2);
if (!mapFile || process.argv.length > 4 || !/^candidates(?:-[a-z0-9-]+)?$/.test(batch)) {
  throw new Error('Usage: node scripts/photos/apply-selection.mjs <selection.json> [candidates-directory]');
}
const candidatesDir = new URL(`./${batch}/`, import.meta.url);

const selection = JSON.parse(await readFile(mapFile, 'utf8'));
if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
  throw new Error('The selection must be a JSON object mapping target paths to candidate numbers.');
}
const candidates = JSON.parse(await readFile(new URL('index.json', candidatesDir), 'utf8'));
const byNumber = new Map(candidates.map(photo => [photo.n, photo]));
const targets = new Set();
const replacements = [];

for (const [key, number] of Object.entries(selection)) {
  const candidate = byNumber.get(number);
  if (!candidate) throw new Error(`Unknown candidate ${number} for ${key}`);
  const requestedPath = path.resolve(publicDir, key.replace(/^public\//, ''));
  if (!requestedPath.startsWith(publicDir + path.sep)) throw new Error(`Invalid target: ${key}`);
  const target = await realpath(requestedPath);
  if (target !== requestedPath || path.extname(target).toLowerCase() !== '.webp' || targets.has(target)) {
    throw new Error(`Expected a unique existing WebP path under public/: ${key}`);
  }
  targets.add(target);

  const { width, height } = await sharp(target).metadata();
  const source = fileURLToPath(new URL(`${String(number).padStart(3, '0')}.webp`, candidatesDir));
  const crop = sharp(source).autoOrient()
    .resize(width, height, { fit: 'cover', position: sharp.strategy.attention });
  let image;
  for (let quality = 78; ; quality = Math.max(1, quality - 2)) {
    image = await crop.clone().webp({ quality }).toBuffer();
    if (image.length < 300_000 || quality === 1) break;
  }
  if (image.length >= 300_000) throw new Error(`Cannot fit ${key} below 300 KB at ${width}×${height}`);

  const downloadUrl = new URL(candidate.downloadLocation);
  if (downloadUrl.origin !== 'https://api.unsplash.com') {
    throw new Error(`Invalid Unsplash download endpoint for candidate ${number}`);
  }
  const relative = path.relative(publicDir, target);
  const directory = path.dirname(relative);
  if (directory !== 'showcase/img' && !/^examples[/\\][a-z0-9-]+[/\\]img$/.test(directory)) {
    throw new Error(`Expected a photo under an example or showcase image directory: ${key}`);
  }
  const creditsDir = path.join(publicDir, directory);
  const file = path.relative(creditsDir, target);
  const credit = `${file} — Photo by ${candidate.author.replace(/[\r\n]+/g, ' ')} (${candidate.authorUrl}) on Unsplash (${candidate.page})`;
  replacements.push({ target, image, downloadUrl, creditsPath: path.join(creditsDir, 'CREDITS.md'), file, credit });
}

async function replaceFile(file, contents) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, contents, { flag: 'wx' });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

for (const { target, image, downloadUrl, creditsPath, file, credit } of replacements) {
  const credits = await readFile(creditsPath, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '# Photo credits\n';
    throw error;
  });
  const lines = credits.trimEnd().split(/\r?\n/);
  const index = lines.findIndex(line => line.startsWith(`${file} — `));
  if (index === -1) {
    if (lines.length === 1) lines.push('');
    lines.push(credit);
  } else {
    lines[index] = credit;
  }

  execFileSync('curl', ['-sS', '--fail', '--max-time', '30', '--output', '/dev/null', '--url', downloadUrl.href]);
  await replaceFile(target, image);
  await replaceFile(creditsPath, lines.join('\n') + '\n');
  console.log(`Updated ${path.relative(publicDir, target)} (${image.length} bytes)`);
}
