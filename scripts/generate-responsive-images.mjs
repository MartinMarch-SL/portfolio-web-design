import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

for (const directory of ['public/examples/ruido/img', 'public/showcase/img']) {
  for (const name of await readdir(directory)) {
    if (!name.endsWith('.webp') || /-(640|1080)w\.webp$/.test(name)) continue;
    const original = join(directory, name);
    await Promise.all([640, 1080].map(width =>
      sharp(original).resize({ width }).webp({ quality: 82 })
        .toFile(join(directory, name.replace('.webp', `-${width}w.webp`))),
    ));
  }
}
