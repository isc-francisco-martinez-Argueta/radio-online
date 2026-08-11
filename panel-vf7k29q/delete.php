<?php
/**
 * Elimina una canción de la lista y del disco.
 * Requiere sesión activa y token CSRF válido.
 */
require __DIR__ . '/_auth.php';
require_login();
$c = cfg();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()) {
    http_response_code(400);
    exit('Solicitud inválida.');
}

// Solo el nombre base, nunca rutas (evita path traversal)
$target = basename((string) ($_POST['file'] ?? ''));

$lib = load_library();
$found = false;

foreach ($lib['groups'] as $gid => $group) {
    $kept = [];
    foreach ($group['tracks'] as $t) {
        if (($t['file'] ?? '') === $target && $target !== '') {
            $found = true;
            $path = rtrim($c['music_dir'], '/') . '/' . $target;
            if (is_file($path)) {
                @unlink($path);
            }
            continue; // no conservar
        }
        $kept[] = $t;
    }
    $lib['groups'][$gid]['tracks'] = $kept;
}

if ($found) {
    save_library($lib);
    $_SESSION['flash'] = 'Canción eliminada.';
} else {
    $_SESSION['flash'] = 'No se encontró la canción.';
}

header('Location: index.php');
exit;
