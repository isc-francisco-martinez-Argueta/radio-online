<?php
/**
 * Configuración inicial: crea el usuario/contraseña la PRIMERA vez.
 * Una vez que existe data/credentials.php, este script queda deshabilitado.
 * Para reconfigurar, borra data/credentials.php.
 */
require __DIR__ . '/_auth.php';
$c = cfg();

if (is_file($c['credentials'])) {
    http_response_code(403);
    exit('El panel ya está configurado. Para reconfigurar, elimina data/credentials.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check()) {
        $error = 'Token inválido, recarga la página.';
    } else {
        $user = trim((string) ($_POST['user'] ?? ''));
        $pass = (string) ($_POST['pass'] ?? '');
        if (strlen($user) < 3 || strlen($pass) < 8) {
            $error = 'Usuario mínimo 3 caracteres y contraseña mínimo 8.';
        } else {
            save_data($c['credentials'], [
                'user' => $user,
                'hash' => password_hash($pass, PASSWORD_DEFAULT),
            ]);
            header('Location: index.php');
            exit;
        }
    }
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Configuración inicial</title>
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
  <h1>Configuración inicial del panel</h1>
  <?php if ($error): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
  <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
  <label for="user">Usuario</label>
  <input id="user" name="user" type="text" minlength="3" required>
  <label for="pass">Contraseña (mín. 8)</label>
  <input id="pass" name="pass" type="password" minlength="8" required>
  <button type="submit">Crear administrador</button>
</form>
</body>
</html>
