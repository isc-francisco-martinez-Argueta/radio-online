<?php
/**
 * Sesión segura, helpers de autenticación, CSRF, almacenamiento en disco
 * y límite de intentos de login. Incluido por todas las páginas del panel.
 */
$config = require __DIR__ . '/_config.php';

// --- Sesión endurecida ---
session_name($config['session_name']);
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Strict',
    'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();

// --- Cabeceras de seguridad ---
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');

function cfg(): array {
    global $config;
    return $config;
}

function is_logged_in(): bool {
    return !empty($_SESSION['auth']) && $_SESSION['auth'] === true;
}

function require_login(): void {
    if (!is_logged_in()) {
        header('Location: index.php');
        exit;
    }
}

// --- CSRF ---
function csrf_token(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_check(): bool {
    return isset($_POST['csrf'], $_SESSION['csrf'])
        && is_string($_POST['csrf'])
        && hash_equals($_SESSION['csrf'], $_POST['csrf']);
}

// --- Datos persistidos como archivos PHP (no legibles como texto) ---
function load_data(string $file, array $default = []): array {
    if (is_file($file)) {
        // Evita que OPcache sirva una versión vieja del archivo recién escrito.
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate($file, true);
        }
        $data = include $file;
        return is_array($data) ? $data : $default;
    }
    return $default;
}

function save_data(string $file, array $data): void {
    $dir = dirname($file);
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }
    $php = "<?php return " . var_export($data, true) . ";\n";
    file_put_contents($file, $php, LOCK_EX);
    // Invalida el caché de OPcache para que el próximo include lea lo recién guardado.
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate($file, true);
    }
}

// --- Límite de intentos de login (por IP) ---
function client_ip(): string {
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function login_locked(): bool {
    $c = cfg();
    $a = load_data($c['attempts_file']);
    $rec = $a[client_ip()] ?? null;
    if (!$rec) {
        return false;
    }
    return $rec['count'] >= $c['max_attempts']
        && (time() - $rec['last']) < $c['lockout_secs'];
}

function register_failed_login(): void {
    $c = cfg();
    $a = load_data($c['attempts_file']);
    $ip = client_ip();
    $rec = $a[$ip] ?? ['count' => 0, 'last' => 0];
    if ((time() - $rec['last']) > $c['lockout_secs']) {
        $rec['count'] = 0; // ventana expirada, reiniciar
    }
    $rec['count']++;
    $rec['last'] = time();
    $a[$ip] = $rec;
    save_data($c['attempts_file'], $a);
}

function clear_failed_login(): void {
    $c = cfg();
    $a = load_data($c['attempts_file']);
    unset($a[client_ip()]);
    save_data($c['attempts_file'], $a);
}

// --- Librería de grupos ---------------------------------------------------
// Estructura:
//   [ 'groups' => [ 'grp_xxx' => ['name'=>'...', 'enabled'=>true, 'tracks'=>[ {file,url,title,added}, ... ]] ] ]
// Los grupos ACTIVOS (enabled) se reproducen en secuencia, respetando el orden
// de los grupos y el de las pistas dentro de cada grupo.

function new_group_id(): string {
    return 'grp_' . bin2hex(random_bytes(4));
}

function load_library(): array {
    $c = cfg();
    $lib = load_data($c['library']);

    // Inicializar con un grupo por defecto si está vacía. Id fijo ('grp_default')
    // para que sea estable aunque library.php no exista todavía.
    if (empty($lib['groups']) || !is_array($lib['groups'])) {
        $lib = ['groups' => ['grp_default' => ['name' => 'Música', 'enabled' => true, 'tracks' => []]]];
    }

    // Normalizar cada grupo: asegurar 'enabled' y 'tracks'.
    foreach ($lib['groups'] as $gid => $g) {
        if (!isset($g['enabled'])) {
            $lib['groups'][$gid]['enabled'] = true;
        }
        if (!isset($g['tracks']) || !is_array($g['tracks'])) {
            $lib['groups'][$gid]['tracks'] = [];
        }
    }
    unset($lib['active']); // campo antiguo (modelo de un solo grupo): ya no se usa
    return $lib;
}

function save_library(array $lib): void {
    $c = cfg();
    save_data($c['library'], $lib);
    publish_playlist($lib); // regenera el playlist.json público
}

// Escribe en musica/playlist.json la concatenación de TODOS los grupos activos,
// en el orden de los grupos y de sus pistas. Eso define la secuencia de reproducción.
function publish_playlist(array $lib): void {
    $c = cfg();
    $tracks = [];
    foreach ($lib['groups'] as $g) {
        if (!empty($g['enabled'])) {
            foreach ($g['tracks'] as $t) {
                $tracks[] = $t;
            }
        }
    }
    $json = json_encode(
        ['tracks' => array_values($tracks)],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    file_put_contents($c['playlist_file'], $json . "\n", LOCK_EX);
}

// --- Utilidad para escapar HTML ---
function h(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}
