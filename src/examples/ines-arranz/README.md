# Añadir una entrada al blog

Crea un archivo Markdown en `data/posts/` con un nombre como `mi-nueva-entrada.md`. El nombre determina la dirección del artículo. Copia el bloque de cabecera de otra entrada y completa `title`, `date` (AAAA-MM-DD), `category` (Ansiedad, Relaciones, Autoestima o Hábitos), `excerpt`, `cover` (nombre de la imagen sin «.webp») y `featured` (true o false). Si marcas varias entradas como destacadas, se muestra la más reciente.

Usa encabezados de nivel 2 para las secciones del índice. Guarda la portada WebP en `public/examples/ines-arranz/img/`, registra sus créditos y ejecuta `node scripts/generate-responsive-images.mjs`. El tiempo de lectura, el listado y el RSS se actualizan al compilar.
