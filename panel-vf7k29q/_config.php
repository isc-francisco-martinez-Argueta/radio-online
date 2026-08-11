<?php
/**
 * Configuración del panel de administración.
 * No contiene secretos: las credenciales se guardan en data/credentials.php
 * (generado por setup.php la primera vez).
 */
return [
    // Nombre de la cookie de sesión (aislada del resto del sitio)
    'session_name'  => 'vosfm_admin',

    // Carpeta pública de canciones y lista (relativas a este módulo)
    'music_dir'     => __DIR__ . '/../musica',
    'music_url'     => '/musica', // ruta absoluta desde la raíz del sitio
    'playlist_file' => __DIR__ . '/../musica/playlist.json',

    // Formatos permitidos: extensión => MIME aceptados
    'allowed' => [
        'mp3' => ['audio/mpeg', 'audio/mp3'],
        'm4a' => ['audio/mp4', 'audio/x-m4a', 'audio/aac'],
        'aac' => ['audio/aac', 'audio/aacp'],
        'ogg' => ['audio/ogg', 'application/ogg'],
    ],

    // Tamaño máximo por archivo (25 MB)
    'max_size' => 25 * 1024 * 1024,

    // Bloqueo por intentos fallidos de login
    'max_attempts' => 5,
    'lockout_secs' => 900, // 15 minutos

    // Almacenamiento en archivos PHP (nunca legibles como texto por URL)
    'attempts_file' => __DIR__ . '/data/attempts.php',
    'credentials'   => __DIR__ . '/data/credentials.php',
];
