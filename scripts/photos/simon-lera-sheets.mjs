import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';

const curl = promisify(execFile);
const columns = 4;
const tileWidth = 440;
const imageHeight = 300;
const labelHeight = 54;
const tileHeight = imageHeight + labelHeight;

export async function buildSimonLeraSheets(directory, groups) {
  const sheets = new URL('sheets/', directory);
  await mkdir(sheets, { recursive: true });
  const index = {};
  const downloads = new Map();

  for (const [queryIndex, candidates] of groups.entries()) {
    const queryNumber = queryIndex + 1;
    const tiles = [];
    for (let start = 0; start < candidates.length; start += columns) {
      const row = await Promise.all(candidates.slice(start, start + columns).map(async (candidate, column) => {
        const id = `q${queryNumber}-${String(start + column + 1).padStart(2, '0')}`;
        const { raw, ...credit } = candidate;
        index[id] = credit;
        if (!downloads.has(raw)) downloads.set(raw, downloadThumbnail(raw));
        const photo = await downloads.get(raw);
        await writeFile(new URL(`${id}.webp`, directory), photo);
        const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${labelHeight}">
          <text x="${tileWidth / 2}" y="39" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="36">${id}</text>
        </svg>`);
        const left = column * tileWidth;
        const top = (start / columns) * tileHeight;
        return [{ input: photo, left, top }, { input: label, left, top: top + imageHeight }];
      }));
      tiles.push(...row.flat());
    }
    const sheet = sharp({
      create: {
        width: columns * tileWidth,
        height: Math.max(1, Math.ceil(candidates.length / columns)) * tileHeight,
        channels: 3,
        background: '#141414',
      },
    });
    if (tiles.length) sheet.composite(tiles);
    await sheet.jpeg({ quality: 85 }).toFile(fileURLToPath(new URL(`sheet-${queryNumber}.jpg`, sheets)));
  }

  await writeFile(new URL('index.json', directory), JSON.stringify(index, null, 2) + '\n');
}

async function downloadThumbnail(raw) {
  const url = new URL(raw);
  url.searchParams.set('w', String(tileWidth));
  url.searchParams.set('fm', 'webp');
  const { stdout } = await curl('curl', [
    '-sS', '--fail', '--max-time', '30', '--url', url.href,
  ], { encoding: 'buffer', maxBuffer: 4 * 1024 * 1024 });
  return sharp(stdout)
    .autoOrient()
    .resize(tileWidth, imageHeight, { fit: 'contain', background: '#222' })
    .webp()
    .toBuffer();
}
