<?php
/**
 * Recibe una canción, la valida (extensión + MIME real + tamaño),
 * la guarda con nombre aleatorio y la añade a playlist.json.
 * Requiere sesión activa y token CSRF válido.
 */
require __DIR__ . '/_auth.php';
require_login();
$c = cfg();

function fail(string $msg): void {
    $_SESSION['flash'] = $msg;
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()) {
    http_response_code(400);
    fail('Solicitud inválida.');
}

// Grupo destino
$lib = load_library();
$group = (string) ($_POST['group'] ?? array_key_first($lib['groups']));
if (!isset($lib['groups'][$group])) {
    fail('El grupo seleccionado no existe.');
}

if (empty($_FILES['song']) || ($_FILES['song']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail('No se recibió el archivo (¿supera el límite del servidor?).');
}

$file = $_FILES['song'];

if ($file['size'] <= 0 || $file['size'] > $c['max_size']) {
    fail('El archivo está vacío o supera el tamaño máximo (25 MB).');
}

// 1) Extensión en lista blanca
$ext = strtolower(pathinfo((string) $file['name'], PATHINFO_EXTENSION));
if (!isset($c['allowed'][$ext])) {
    fail('Formato no permitido. Usa MP3, M4A, AAC u OGG.');
}

// 2) MIME real del contenido (no confiar en el nombre)
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string) $finfo->file($file['tmp_name']);
if (!in_array($mime, $c['allowed'][$ext], true)) {
    fail('El contenido del archivo no coincide con un audio válido.');
}

// 3) Nombre aleatorio (evita colisiones y oculta el nombre original en disco)
$safe = bin2hex(random_bytes(8)) . '.' . $ext;
if (!is_dir($c['music_dir'])) {
    mkdir($c['music_dir'], 0755, true);
}
$dest = rtrim($c['music_dir'], '/') . '/' . $safe;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    fail('No se pudo guardar el archivo en el servidor.');
}

// 4) Título visible: nombre original saneado
$title = preg_replace('/\.[^.]+$/', '', (string) $file['name']);
$title = preg_replace('/[^\p{L}\p{N}\s\-\_\.\(\)]/u', '', (string) $title);
$title = trim((string) mb_substr((string) $title, 0, 120));
if ($title === '') {
    $title = $safe;
}

// 5) Añadir la pista al grupo elegido
$lib['groups'][$group]['tracks'][] = [
    'file'  => $safe,
    'url'   => $c['music_url'] . '/' . $safe,
    'title' => $title,
    'added' => date('c'),
];
save_library($lib); // republica el playlist.json si el grupo es el activo

$nombre = $lib['groups'][$group]['name']; // index.php escapa el flash al mostrarlo
fail("Canción añadida al grupo «{$nombre}».");
