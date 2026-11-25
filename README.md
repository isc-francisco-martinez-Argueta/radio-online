# radio-online
Landing page para una estación de radio, pagina creada para transmitir en linea la radio "Vos fm 91.3"

-[Landing Page Radio online](https://www.vosfm.com.mx/)

## Publicar una versión nueva

Para que **quien ya instaló la app** y **quien ya abrió la página** reciban los cambios:

1. Sube la versión (cambia `sw.js`, los `?v=` de `index.html` y los `import` de `js/`):

   ```sh
   node tools/nueva-version.mjs
   ```

2. Sube **todos** los archivos al servidor, incluidos `sw.js` y `.htaccess`.

Qué pasa en los dispositivos:

- **Navegador:** al abrir la página, el HTML pide `styles.css?v=N` y los demás archivos con la versión nueva, así que ninguna caché puede servir los viejos.
- **App instalada:** el service worker nuevo se instala, borra la caché anterior y la página se recarga sola. Si la radio está sonando no se corta: se avisa y la recarga ocurre cuando la pausen.
- **Servidor:** `.htaccess` pide revalidar HTML, CSS, JS y `sw.js` (Apache). En nginx el equivalente es `add_header Cache-Control "no-cache";` para esos archivos.
