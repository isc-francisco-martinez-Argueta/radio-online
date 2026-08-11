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

// --- Lectura/escritura de la lista de reproducción pública ---
function load_playlist(): array {
    $c = cfg();
    if (is_file($c['playlist_file'])) {
        $j = json_decode((string) file_get_contents($c['playlist_file']), true);
        if (is_array($j) && isset($j['tracks']) && is_array($j['tracks'])) {
            return $j['tracks'];
        }
    }
    return [];
}

function save_playlist(array $tracks): void {
    $c = cfg();
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
