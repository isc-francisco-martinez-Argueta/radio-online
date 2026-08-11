<?php
/**
 * Página principal del panel: muestra el login si no hay sesión,
 * o el tablero (subir/eliminar canciones) si el usuario está autenticado.
 */
require __DIR__ . '/_auth.php';
$c = cfg();

// Si aún no hay credenciales, ir a la configuración inicial.
if (!is_file($c['credentials'])) {
    header('Location: setup.php');
    exit;
}

$error = '';

// --- Procesar login ---
if (!is_logged_in() && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (login_locked()) {
        $error = 'Demasiados intentos fallidos. Espera unos minutos.';
    } elseif (!csrf_check()) {
        $error = 'Token inválido, recarga la página.';
    } else {
        $creds = load_data($c['credentials']);
        $user  = trim((string) ($_POST['user'] ?? ''));
        $pass  = (string) ($_POST['pass'] ?? '');
        $ok = !empty($creds['hash'])
            && hash_equals((string) $creds['user'], $user)
            && password_verify($pass, $creds['hash']);
        if ($ok) {
            session_regenerate_id(true);
            $_SESSION['auth'] = true;
            clear_failed_login();
            header('Location: index.php');
            exit;
        }
        register_failed_login();
        $error = 'Credenciales incorrectas.';
    }
}

// --- Vista de login ---
if (!is_logged_in()) {
    ?>
    <!doctype html>
    <html lang="es">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Acceso</title>
    <style>
      body{font-family:system-ui,sans-serif;background:#0f1720;color:#e6edf3;display:grid;place-items:center;min-height:100vh;margin:0}
      form{background:#161f2b;padding:2rem;border-radius:12px;width:min(92vw,360px);box-shadow:0 10px 30px rgba(0,0,0,.4)}
      h1{font-size:1.15rem;margin:0 0 1rem}
      label{display:block;margin:.75rem 0 .25rem;font-size:.85rem}
      input{width:100%;padding:.6rem;border-radius:8px;border:1px solid #2b3947;background:#0f1720;color:#e6edf3;box-sizing:border-box}
      button{width:100%;margin-top:1.2rem;padding:.7rem;border:0;border-radius:8px;background:#2b6ab5;color:#fff;font-weight:600;cursor:pointer}
      .err{background:#3b1f27;color:#ffb4b4;padding:.6rem;border-radius:8px;margin-bottom:1rem;font-size:.85rem}
    </style>
    </head>
    <body>
    <form method="post" autocomplete="off">
      <h1>Panel VOS FM</h1>
      <?php if ($error): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
      <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
      <label for="user">Usuario</label>
      <input id="user" name="user" type="text" required autofocus>
      <label for="pass">Contraseña</label>
      <input id="pass" name="pass" type="password" required>
      <button type="submit">Entrar</button>
    </form>
    </body>
    </html>
    <?php
    exit;
}

// --- Tablero (sesión activa) ---
$tracks = load_playlist();
$flash  = $_SESSION['flash'] ?? '';
unset($_SESSION['flash']);
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Administrar música · VOS FM</title>
<style>
  :root{color-scheme:dark}
  body{font-family:system-ui,sans-serif;background:#0f1720;color:#e6edf3;margin:0;padding:0}
  header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;background:#161f2b;border-bottom:1px solid #2b3947}
  header h1{font-size:1.1rem;margin:0}
  header a{color:#9db8d6;text-decoration:none;font-size:.9rem}
  main{max-width:760px;margin:0 auto;padding:1.5rem}
  .card{background:#161f2b;border:1px solid #2b3947;border-radius:12px;padding:1.25rem;margin-bottom:1.5rem}
  .card h2{font-size:1rem;margin:0 0 1rem}
  input[type=file]{width:100%;padding:.6rem;border-radius:8px;border:1px solid #2b3947;background:#0f1720;color:#e6edf3;box-sizing:border-box}
  button{padding:.6rem 1rem;border:0;border-radius:8px;background:#2b6ab5;color:#fff;font-weight:600;cursor:pointer}
  button.danger{background:#8a2b3a}
  ul{list-style:none;margin:0;padding:0}
  li{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.6rem 0;border-bottom:1px solid #22303d}
  li:last-child{border-bottom:0}
  .title{font-size:.92rem;word-break:break-word}
  .empty{color:#7d8da3;font-size:.9rem}
  .flash{background:#1f3b2a;color:#b4ffcf;padding:.6rem;border-radius:8px;margin-bottom:1rem;font-size:.88rem}
  audio{height:32px}
  .hint{color:#7d8da3;font-size:.8rem;margin-top:.5rem}
</style>
</head>
<body>
<header>
  <h1>Administrar música de respaldo</h1>
  <a href="logout.php">Cerrar sesión</a>
</header>
<main>
  <?php if ($flash): ?><div class="flash"><?= h($flash) ?></div><?php endif; ?>

  <div class="card">
    <h2>Subir canción</h2>
    <form method="post" action="upload.php" enctype="multipart/form-data">
      <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
      <input type="file" name="song" accept=".mp3,.m4a,.aac,.ogg,audio/*" required>
      <p class="hint">Formatos: MP3, M4A, AAC, OGG · máx. 25 MB.</p>
      <button type="submit">Subir a la lista</button>
    </form>
  </div>

  <div class="card">
    <h2>Lista actual (<?= count($tracks) ?>)</h2>
    <?php if (!$tracks): ?>
      <p class="empty">Aún no hay canciones. Sube la primera arriba.</p>
    <?php else: ?>
      <ul>
        <?php foreach ($tracks as $t): ?>
          <li>
            <span class="title"><?= h($t['title'] ?? $t['file']) ?></span>
            <span style="display:flex;gap:.75rem;align-items:center">
              <audio controls preload="none" src="<?= h($t['url']) ?>"></audio>
              <form method="post" action="delete.php" onsubmit="return confirm('¿Eliminar esta canción?')">
                <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
                <input type="hidden" name="file" value="<?= h($t['file']) ?>">
                <button class="danger" type="submit">Eliminar</button>
              </form>
            </span>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </div>
</main>
</body>
</html>
