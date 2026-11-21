import sharp from 'sharp';

const size = 256;
const pixels = Buffer.alloc(size * size);
const example = process.argv[2] ?? 'ruido';
if (!['ruido', 'bar-caribe', 'ines-arranz'].includes(example)) throw new Error(`Unknown example: ${example}`);
let seed = { ruido: 0x52554944, 'bar-caribe': 0x43415249, 'ines-arranz': 0x494e4553 }[example];
for (let index = 0; index < pixels.length; index++) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  pixels[index] = (seed >>> 28) * 17;
}

await sharp(pixels, { raw: { width: size, height: size, channels: 1 } })
  .png({ palette: true, colours: 16, dither: 0 })
  .toFile(`public/examples/${example}/img/grain.png`);
