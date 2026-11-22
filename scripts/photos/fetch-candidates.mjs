import { execFileSync } from 'node:child_process';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { buildSimonLeraSheets } from './simon-lera-sheets.mjs';

const example = process.argv[2] ?? 'ruido';
if (!['ruido', 'mares', 'simon-lera'].includes(example)) throw new Error(`Unknown example: ${example}`);
const simonLera = example === 'simon-lera';
const directory = new URL(example === 'ruido' ? './candidates/' : `./candidates-${example}/`, import.meta.url);
const queries = simonLera ? [
  ['abstract oil painting texture', 'squarish'],
  ['impasto painting abstract', 'squarish'],
  ['abstract painting canvas ochre', 'portrait'],
  ['textured abstract art white', 'landscape'],
  ['palette knife painting detail', 'landscape'],
  ['artist studio painting', 'landscape'],
  ['painter hands brush', 'portrait'],
  ['art gallery white wall painting', 'landscape'],
] : example === 'mares' ? [
  ['Palma cathedral Mallorca bay', 'landscape'],
  ['Palma old town Mallorca sandstone', 'portrait'],
  ['Mallorca villa pool mediterranean', 'landscape'],
  ['Mallorca stone house shutters', 'landscape'],
  ['mediterranean living room terrace', 'landscape'],
  ['mediterranean interior detail', 'portrait'],
  ['architecture studio interior', 'landscape'],
  ['natural light professional portrait', 'portrait'],
] : [
  ['streetwear portrait', 'portrait'],
  ['hoodie street fashion', 'portrait'],
  ['urban fashion editorial', 'portrait'],
  ['black and white street fashion', 'portrait'],
  ['skater fashion', 'portrait'],
  ['cargo pants outfit', 'portrait'],
  ['workwear jacket fashion', 'portrait'],
  ['concrete city fashion', 'landscape'],
  ['sewing workshop', 'landscape'],
  ['textile factory', 'landscape'],
  ['barcelona street night', 'landscape'],
  ['streetwear model group', 'landscape'],
];

const photos = new Map();
const errors = [];
const groups = queries.map(() => []);
for (const [queryIndex, [query, orientation]] of queries.entries()) {
  const params = new URLSearchParams({ query, per_page: simonLera ? '20' : '12', orientation, content_filter: 'high' });
  try {
    const response = execFileSync('curl', [
      '-sS', '--fail', '--max-time', '30', '--url', `https://api.unsplash.com/search/photos?${params}`,
    ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    for (const photo of JSON.parse(response).results) {
      if (photo.premium === true || photo.plus === true) continue;
      if (simonLera) {
        groups[queryIndex].push({
          unsplashId: photo.id,
          photographer: photo.user.name,
          url: photo.links.html,
          raw: photo.urls.raw,
        });
        continue;
      }
      if (photos.has(photo.id)) continue;
      photos.set(photo.id, {
        n: photos.size + 1,
        id: photo.id,
        query,
        w: photo.width,
        h: photo.height,
        author: photo.user.name,
        authorUrl: photo.user.links.html,
        page: photo.links.html,
        raw: photo.urls.raw,
        downloadLocation: photo.links.download_location,
        alt: photo.alt_description ?? null,
      });
    }
  } catch (error) {
    errors.push(`${query}: ${error.message}`);
  }
}
if (errors.length) console.error(errors.join('\n'));
if (simonLera) {
  console.log(`${queries.length} Unsplash search requests used`);
  await buildSimonLeraSheets(directory, groups);
  if (errors.length) process.exitCode = 1;
} else {
  await buildOriginalSheets();
}

async function buildOriginalSheets() {
  if (!photos.size) throw new Error('No eligible Unsplash photos returned.');

  const candidates = [...photos.values()];
  await mkdir(directory, { recursive: true });
  const tileWidth = 200;
  const imageHeight = 260;
  const labelHeight = 42;
  const columns = 10;
  const sheetSize = 50;
  const tileHeight = imageHeight + labelHeight;
  const sheets = [];
  let tiles = [];

  for (const candidate of candidates) {
    const number = String(candidate.n).padStart(3, '0');
    const url = new URL(candidate.raw);
    url.searchParams.set('w', '1600');
    url.searchParams.set('q', '80');
    url.searchParams.set('fm', 'webp');
    const photo = execFileSync('curl', [
      '-sS', '--fail', '--max-time', '30', '--retry', '2', '--url', url.href,
    ], { maxBuffer: 32 * 1024 * 1024 });
    const tile = await sharp(photo)
      .autoOrient()
      .resize(tileWidth, imageHeight, { fit: 'contain', background: '#222' })
      .ensureAlpha()
      .raw()
      .toBuffer();
    await writeFile(new URL(`${number}.webp`, directory), photo);
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${labelHeight}">
      <text x="100" y="31" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="30">${number}</text>
    </svg>`);
    const left = (tiles.length / 2 % columns) * tileWidth;
    const top = Math.floor(tiles.length / 2 / columns) * tileHeight;
    tiles.push({
      input: tile, raw: { width: tileWidth, height: imageHeight, channels: 4 }, left, top,
    }, { input: label, left, top: top + imageHeight });

    if (tiles.length === sheetSize * 2 || candidate.n === candidates.length) {
      const name = `sheet-${sheets.length + 1}.jpg`;
      await sharp({
        create: {
          width: columns * tileWidth,
          height: Math.ceil(tiles.length / 2 / columns) * tileHeight,
          channels: 3,
          background: '#000',
        },
      }).composite(tiles).jpeg({ quality: 70 }).toFile(fileURLToPath(new URL(name, directory)));
      sheets.push(name);
      tiles = [];
    }
  }
  for (const name of await readdir(directory)) {
    const number = /^(\d{3})\.webp$/.exec(name);
    if ((number && Number(number[1]) > candidates.length)
        || (/^sheet-\d+\.jpg$/.test(name) && !sheets.includes(name))) {
      await unlink(new URL(name, directory));
    }
  }
  await writeFile(new URL('index.json', directory), JSON.stringify(candidates, null, 2) + '\n');
  console.log(`${candidates.length} candidates`);
  for (const sheet of sheets) console.log(`scripts/photos/candidates/${sheet}`);
  if (errors.length) process.exitCode = 1;
}
