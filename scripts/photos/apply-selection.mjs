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
  throw new Error('The selection must be a JSON object mapping targets to candidate IDs.');
}
const candidates = JSON.parse(await readFile(new URL('index.json', candidatesDir), 'utf8'));
const simonLera = batch === 'candidates-simon-lera';
const liaFerro = batch === 'candidates-lia-ferro';
const losAlmendros = batch === 'candidates-los-almendros';
const pinarAlto = batch === 'candidates-pinar-alto';
const grouped = simonLera || liaFerro || losAlmendros || pinarAlto;
const basketballCrops = new Map([
  ['pabellon-noche', [1600, 1000, 'centre']],
  ['parquet-claro', [1200, 800, 'south']],
  ['parquet-luz', [1440, 960, 'south']],
  ['aro', [1200, 800, 'centre']],
  ['tablero', [1200, 800, 'attention']],
  ['entreno', [1200, 800, 'attention']],
  ['pina', [1200, 800, 'centre']],
  ['equipo', [1200, 800, 'attention']],
  ['babybasket', [1200, 800, 'attention']],
  ['femenino', [1200, 800, 'attention']],
  ['entrada', [1440, 960, 'attention']],
  ['bote', [1200, 800, 'south']],
  ['pabellon-madera', [1200, 800, 'centre']],
  ['manos', [1200, 800, 'centre']],
]);
const footballCrops = new Map([
  ['hero', [1600, 1040]], ['entrenamiento', [1200, 800]], ['portero', [1200, 800]],
  ['chupetines', [1200, 800]], ['atardecer', [1200, 800]], ['historia', [1200, 800]],
  ['femenino', [1200, 800]], ['juvenil', [1200, 800]], ['disparo', [1200, 800]],
  ['circulo', [800, 800]], ['cal', [800, 400]], ['campo-municipal', [1200, 800]],
  ['grada', [1200, 800]], ['cesped-perspectiva', [1440, 960]],
  ['cesped-franjas', [960, 640]], ['cesped-cenital', [1280, 850]],
]);
const byNumber = new Map(grouped ? Object.entries(candidates) : candidates.map(photo => [photo.n, photo]));
const photos = new Map();

function download(url) {
  return execFileSync('curl', ['-sS', '--fail', '--max-time', '30', '--url', url], {
    maxBuffer: 32 * 1024 * 1024,
  });
}

function loadGroupedPhoto(candidate) {
  const id = candidate.unsplashId;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Invalid Unsplash photo ID');
  if (!photos.has(id)) {
    const photo = JSON.parse(download(`https://api.unsplash.com/photos/${id}`));
    const imageUrl = new URL(photo.urls.raw);
    if (imageUrl.origin !== 'https://images.unsplash.com') throw new Error('Invalid Unsplash image URL');
    imageUrl.searchParams.set('w', '1600');
    imageUrl.searchParams.set('q', '90');
    imageUrl.searchParams.set('fm', 'webp');
    photos.set(id, { source: download(imageUrl.href), downloadLocation: photo.links.download_location });
  }
  return photos.get(id);
}
const targets = new Set();
const replacements = [];

for (const [key, number] of Object.entries(selection)) {
  const candidate = byNumber.get(number);
  if (!candidate) throw new Error(`Unknown candidate ${number} for ${key}`);
  if (simonLera && !/^(?:obra-0[1-9]|detalle-0[1-3]|estudio-0[1-3]|sala-01)$/.test(key)) {
    throw new Error(`Invalid Simón Lera target: ${key}`);
  }
  if (liaFerro && !/^(?:trabajo-(?:0[1-9]|1[0-2])|estudio-0[1-3]|retrato-01)$/.test(key)) {
    throw new Error(`Invalid Lía Ferro target: ${key}`);
  }
  if (losAlmendros && !footballCrops.has(key)) throw new Error(`Invalid Los Almendros target: ${key}`);
  if (pinarAlto && !basketballCrops.has(key)) throw new Error(`Invalid Pinar Alto target: ${key}`);
  const requestedPath = path.resolve(publicDir, grouped
    ? `examples/${batch.slice(11)}/img/${key}.webp`
    : key.replace(/^public\//, ''));
  if (!requestedPath.startsWith(publicDir + path.sep)) throw new Error(`Invalid target: ${key}`);
  const realDirectory = await realpath(path.dirname(requestedPath));
  if (realDirectory !== path.dirname(requestedPath)) throw new Error(`Invalid target directory: ${key}`);
  const target = await realpath(requestedPath).catch(error => {
    if ((losAlmendros || pinarAlto) && error.code === 'ENOENT') return requestedPath;
    throw error;
  });
  if (target !== requestedPath || path.extname(target).toLowerCase() !== '.webp' || targets.has(target)) {
    throw new Error(`Expected a unique existing WebP path under public/: ${key}`);
  }
  targets.add(target);

  const photo = grouped ? loadGroupedPhoto(candidate) : candidate;
  const source = grouped ? photo.source
    : fileURLToPath(new URL(`${String(number).padStart(3, '0')}.webp`, candidatesDir));
  const crop = sharp(source).autoOrient();
  let width, height, position = sharp.strategy.attention;
  if (pinarAlto) {
    const [cropWidth, cropHeight, anchor] = basketballCrops.get(key);
    [width, height] = [cropWidth, cropHeight];
    position = anchor === 'attention' ? sharp.strategy.attention : anchor;
  } else if (losAlmendros) {
    [width, height] = footballCrops.get(key);
  } else {
    ({ width, height } = await sharp(target).metadata());
  }
  if (liaFerro) {
    if (key.startsWith('trabajo-')) [width, height] = [1120, 1400];
    if (key === 'retrato-01') [width, height] = [1080, 1440];
    crop.resize(width, height, { fit: 'cover', position })
      .modulate({ saturation: 0.85 })
      .linear([1.04, 1.03, 1.01], [-5, -6, -7]);
  } else if (simonLera && key.startsWith('obra-')) {
    const { autoOrient: original } = await crop.metadata();
    const scale = 1200 / Math.max(original.width, original.height);
    width = Math.round(original.width * scale);
    height = Math.round(original.height * scale);
    crop.resize({ width: original.width >= original.height ? 1200 : undefined,
      height: original.width < original.height ? 1200 : undefined });
  } else {
    if (simonLera && key.startsWith('detalle-')) height = width;
    crop.resize(width, height, { fit: 'cover', position });
  }
  let image;
  for (let quality = 78; ; quality = Math.max(1, quality - 2)) {
    image = await crop.clone().webp({ quality }).toBuffer();
    if (image.length < 300_000 || quality === 1) break;
  }
  if (image.length >= 300_000) throw new Error(`Cannot fit ${key} below 300 KB at ${width}×${height}`);

  const downloadUrl = new URL(photo.downloadLocation);
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
  const credit = grouped
    ? `${file} — Foto de ${candidate.photographer.replace(/[\r\n]+/g, ' ')} en Unsplash (${candidate.url})`
    : `${file} — Photo by ${candidate.author.replace(/[\r\n]+/g, ' ')} (${candidate.authorUrl}) on Unsplash (${candidate.page})`;
  replacements.push({ target, image, downloadUrl, downloadId: grouped ? candidate.unsplashId : undefined, creditsPath: path.join(creditsDir, 'CREDITS.md'), file, credit });
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

const registered = new Set();
for (const { target, image, downloadUrl, downloadId, creditsPath, file, credit } of replacements) {
  const credits = await readFile(creditsPath, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return grouped ? '# Créditos de fotografía\n' : '# Photo credits\n';
    throw error;
  });
  const lines = credits.trimEnd().split(/\r?\n/)
    .filter(line => !liaFerro || !line.startsWith('Ilustraciones tipográficas y de línea originales'))
    .filter(line => !simonLera || !line.startsWith('Las imágenes de obra, detalle, estudio y sala son marcadores de posición'));
  if (liaFerro && lines[0] === '# Imágenes provisionales') lines[0] = '# Créditos de fotografía';
  if (simonLera && !lines.includes('La trama de lino se genera mediante código.')) {
    lines.splice(1, 0, '', 'La trama de lino se genera mediante código.');
  }
  const index = lines.findIndex(line => line.startsWith(`${file} — `));
  if (index === -1) {
    if (lines.length === 1) lines.push('');
    lines.push(credit);
  } else {
    lines[index] = credit;
  }

  if (!registered.has(downloadId)) {
    execFileSync('curl', ['-sS', '--fail', '--max-time', '30', '--output', '/dev/null', '--url', downloadUrl.href]);
    if (downloadId) registered.add(downloadId);
  }
  await replaceFile(target, image);
  await replaceFile(creditsPath, lines.join('\n') + '\n');
  console.log(`Updated ${path.relative(publicDir, target)} (${image.length} bytes)`);
}
