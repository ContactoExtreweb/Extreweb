---
title: "Cómo subir artículos al blog de Extreweb"
description: "Una guía rápida y sencilla para crear nuevos posts en tu web usando Markdown."
pubDate: 2026-06-28
category: "Tutorial"
heroImage: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1200&q=80"
---

¡Bienvenidos al nuevo motor de vuestro blog! 🚀

A partir de ahora, no hace falta tocar ni una sola línea de código complejo para publicar un artículo. Todo el sistema está automatizado gracias a las **Content Collections** de Astro.

## ¿Cómo publicar un artículo nuevo?

Es literalmente tan fácil como crear un archivo de texto. Sigue estos 3 pasos:

1. Ve a la carpeta `src/content/blog/` en tu proyecto.
2. Crea un archivo nuevo terminado en `.md` (por ejemplo, `mi-nuevo-post.md`). Este nombre será la URL de tu post.
3. Copia y pega la **cabecera de configuración** al principio del archivo.

### La cabecera de configuración (Frontmatter)

Todo archivo Markdown debe empezar con unas líneas entre tres guiones (`---`). Esto le dice a Astro cuál es el título, la foto, la fecha, etc. Cópialo tal que así:

```md
---
title: "El título de tu post"
description: "Un pequeño resumen para SEO y para la tarjeta del blog."
pubDate: 2026-07-01
category: "SEO"
heroImage: "URL_DE_TU_IMAGEN_AQUI"
---

Aquí empiezas a escribir tu artículo normal...
```

> **Consejo pro**: Para las imágenes (`heroImage`), puedes poner el enlace directo de una web como Unsplash, o guardar la foto en la carpeta `public` de tu proyecto y poner la ruta (ejemplo: `/imagenes/mi-foto.jpg`).

## ¿Cómo darle formato al texto?

Usamos **Markdown**, que es un lenguaje súper rápido de escribir.

Para hacer un subtítulo, pon almohadillas:
## Esto es un Subtítulo (h2)
### Esto es más pequeño (h3)

Para poner texto en **negrita**, rodéalo de dos asteriscos `**así**`.
Para poner texto en *cursiva*, usa un asterisco `*así*`.

Si quieres hacer una lista:
- Escribes un guión y un espacio
- Funciona automáticamente
- ¡Es comodísimo!

Si necesitas poner un bloque destacado (una cita):
> Esto es una cita muy elegante que llamará la atención del lector.

### ¿Y para poner imágenes dentro del texto?

Usas este formato:
`![Descripción para ciegos/SEO](url_de_la_imagen)`

¡Y ya está! Guardas el archivo, lo subes a GitHub, y **Netlify se encargará de crear la página, colocarla en el Grid principal del blog y optimizar todo el SEO automáticamente**. 

Siéntete libre de borrar este archivo (`como-subir-articulos.md`) o guardarlo como plantilla. ¡A escribir!
