import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const directories = ['public/examples/ruido/img', 'public/examples/bar-caribe/img', 'public/examples/ines-arranz/img', 'public/examples/mares/img', 'public/showcase/img'];
const selected = process.argv.slice(2);
for (const directory of directories.filter(directory => !selected.length || selected.includes(directory))) {
  for (const name of await readdir(directory)) {
    if (!name.endsWith('.webp') || /-(640|1080|1600)w\.webp$/.test(name)) continue;
    const original = join(directory, name);
    const widths = name === 'hero-portrait.webp' ? [640, 1080, 1600] : [640, 1080];
    const { width: originalWidth } = await sharp(original).metadata();
    await Promise.all(widths.filter(width => width <= originalWidth).map(width =>
      sharp(original).resize({ width }).webp({ quality: 82 })
        .toFile(join(directory, name.replace('.webp', `-${width}w.webp`))),
    ));
  }
}
