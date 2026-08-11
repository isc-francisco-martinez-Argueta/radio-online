# Panel de administración · Música de respaldo VOS FM

Módulo privado para subir canciones que se reproducen automáticamente
**cuando el stream en vivo está apagado o falla**. Sin base de datos: todo se
guarda en archivos.

## 1. Renombra la carpeta (recomendado)

La carpeta se llama `panel-vf7k29q/` a propósito (nombre no adivinable). Puedes
renombrarla a lo que quieras, por ejemplo `panel-mi-clave-secreta/`. Todo el
código usa rutas relativas, así que seguirá funcionando. **No enlaces esta
carpeta desde ninguna página pública.**

## 2. Configura tu usuario y contraseña

Entra una sola vez a:

```
https://vosfm.com.mx/TU-CARPETA/setup.php
```

Crea usuario (mín. 3) y contraseña (mín. 8). Se guarda cifrada con
`password_hash` en `data/credentials.php`. Después de esto, `setup.php` queda
deshabilitado automáticamente. Para reconfigurar, borra `data/credentials.php`.

## 3. Uso normal

Entra a `https://vosfm.com.mx/TU-CARPETA/` → inicia sesión → gestiona grupos y
canciones (MP3, M4A, AAC, OGG; máx. 25 MB). Cada cambio actualiza
`/musica/playlist.json`, que la página pública lee sola.

## 4. Grupos de reproducción

La música de respaldo se organiza en **grupos** que tú creas con el nombre que
quieras (ej. «Canciones 1», «Comerciales 1», «Canciones 2»…).

- **Activar / Desactivar:** cada grupo se puede activar o desactivar. Solo los
  grupos activos entran en la reproducción; los inactivos se saltan sin
  borrarse.
- **Orden = secuencia:** los grupos activos suenan **en secuencia, de arriba
  hacia abajo**, en el orden que les des con las flechas ▲▼. Al terminar el
  último, vuelve a empezar en bucle.
- **Orden dentro del grupo:** las pistas de cada grupo también se reordenan con
  ▲▼ y suenan en ese orden.
- **Subir:** al subir una canción eliges a qué grupo va.

Ejemplo: «Canciones 1» → «Comerciales 1» → «Canciones 2» → «Comerciales 2»,
todos activos y en ese orden, reproduce grupo por grupo intercalando música y
comerciales. Si no quieres que salgan los comerciales, desactiva ese grupo.

Por dentro: la estructura de grupos vive en `data/library.php`, y el panel
regenera `/musica/playlist.json` como la concatenación de las pistas de todos
los grupos activos, en orden. Esa es la lista que consume la web.

## 5. Cómo funciona el respaldo

`js/app.js` intenta primero el stream en vivo. Si falla tras varios reintentos,
cambia solo a la lista local (los grupos activos) y la reproduce en secuencia y
en bucle. Cuando el visitante vuelve a pulsar play, intenta de nuevo el stream
primero.

## Seguridad incluida

- Contraseña cifrada (`password_hash` / `password_verify`).
- Sesión con cookie `HttpOnly`, `SameSite=Strict` y `Secure` (bajo HTTPS).
- Protección CSRF en todos los formularios.
- Bloqueo tras 5 intentos fallidos (15 min) por IP.
- Subidas validadas por extensión **y** MIME real; nombre aleatorio en disco.
- Credenciales e intentos guardados como archivos `.php` (no legibles como
  texto por URL) dentro de `data/`.
- Cabeceras `noindex` para que buscadores no indexen el panel.

## Nginx (opcional pero recomendado)

Si tienes acceso a la configuración del servidor, añade estas reglas como
defensa adicional. **No son imprescindibles** (los datos ya están como `.php`),
pero refuerzan todo:

```nginx
# 1) Nunca ejecutar PHP dentro de la carpeta pública de música
location ^~ /musica/ {
    location ~ \.php$ { return 403; }
}

# 2) Bloquear acceso directo a la carpeta de datos del panel
#    (ajusta el nombre si renombras la carpeta)
location ~ ^/panel-[^/]+/data/ {
    deny all;
    return 403;
}
```

En hosting compartido sin acceso a Nginx, el panel sigue siendo seguro: no se
sirve ningún secreto en texto plano.

## Límites de subida

`.user.ini` sube los límites a 30 MB. Si tu hosting no respeta `.user.ini`,
pide a soporte subir `upload_max_filesize` y `post_max_size`.
