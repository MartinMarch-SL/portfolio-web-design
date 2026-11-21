# Añadir una entrada al Cuaderno

Crea un archivo Markdown en `data/posts/` con un nombre como `mi-nueva-entrada.md`. El nombre determina la dirección del artículo. Copia el bloque de cabecera de otra entrada y completa `title`, `date` (AAAA-MM-DD), `category` (Ansiedad, Relaciones, Autoestima o Hábitos), `excerpt`, `cover` (nombre de la imagen sin «.webp») y `featured` (true o false).

Usa encabezados de nivel 2 para las secciones del índice. Guarda la portada WebP en `public/examples/ines-arranz/img/`, registra sus créditos y ejecuta `node scripts/generate-responsive-images.mjs`. El tiempo de lectura, el listado y el RSS se actualizan al compilar.

Para una nota al margen, escribe `<span class="sidenote">Nota. Texto breve.</span>` dentro del párrafo al que acompaña. En escritorio aparece a la derecha. En pantallas estrechas se lee dentro del texto.

Los archivos `retrato-02.webp` y `retrato-03.webp` marcan los espacios para dos retratos más. Para sustituirlos, usa sus rutas bajo `examples/ines-arranz/img/` como claves en el mapa de `scripts/photos/apply-selection.mjs`.
