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
$lib    = load_library();
$groups = $lib['groups'];
$flash  = $_SESSION['flash'] ?? '';
unset($_SESSION['flash']);

// Tipo de aviso para SweetAlert2 (heurística por el texto del mensaje).
$flashType = ($flash && preg_match('/no se|no existe|inv[aá]lid|error|no puedes|vac[ií]|\bno\b/i', $flash))
    ? 'error'
    : 'success';

// Primer grupo activo (para preseleccionar en el formulario de subida).
$firstEnabled = null;
foreach ($groups as $gid => $g) {
    if (!empty($g['enabled'])) { $firstEnabled = $gid; break; }
}
if ($firstEnabled === null) {
    $firstEnabled = array_key_first($groups);
}

// Renderiza los botones ▲/▼ que envían una acción de reordenar a group.php.
function order_control(string $action, array $hidden, bool $canUp, bool $canDown): void {
    $csrf = csrf_token();
    echo '<span class="mover">';
    foreach ([['up', '▲', $canUp], ['down', '▼', $canDown]] as [$dir, $icon, $enabled]) {
        echo '<form method="post" action="group.php">';
        echo '<input type="hidden" name="csrf" value="' . h($csrf) . '">';
        echo '<input type="hidden" name="action" value="' . h($action) . '">';
        foreach ($hidden as $k => $v) {
            echo '<input type="hidden" name="' . h($k) . '" value="' . h($v) . '">';
        }
        echo '<input type="hidden" name="dir" value="' . $dir . '">';
        echo '<button type="submit"' . ($enabled ? '' : ' disabled') . ' aria-label="mover ' . $dir . '">' . $icon . '</button>';
        echo '</form>';
    }
    echo '</span>';
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Administrar música · VOS FM</title>
<link href="https://cdn.jsdelivr.net/npm/tom-select@2/dist/css/tom-select.css" rel="stylesheet">
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e6edf3;margin:0;padding:0;
    background:radial-gradient(1100px 460px at 50% -12%, #17293f, transparent 62%), #0e151f}
  header{position:sticky;top:0;z-index:30;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.5rem;
    padding:.9rem 1.5rem;background:rgba(18,26,37,.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
    border-bottom:1px solid #2b3947;box-shadow:0 8px 24px rgba(0,0,0,.28)}
  header h1{font-size:1.05rem;margin:0;display:flex;align-items:center;gap:.55rem}
  header h1::before{content:"";width:10px;height:10px;border-radius:50%;background:#2b6ab5;box-shadow:0 0 10px #2b6ab5}
  header a{color:#9db8d6;text-decoration:none;font-size:.9rem;white-space:nowrap}
  .header-links{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
  .help-link{display:inline-flex;align-items:center;gap:.35rem;border:1px solid #2b6ab5;border-radius:8px;padding:.35rem .7rem;color:#9db8d6}
  .help-link:hover{background:#12233a}
  main{max-width:1140px;margin:0 auto;padding:1.5rem 1.25rem 3rem;display:grid;grid-template-columns:1fr;gap:1.25rem}
  .card{background:#161f2b;border:1px solid #2b3947;border-radius:14px;padding:1.35rem 1.5rem;box-shadow:0 12px 32px rgba(0,0,0,.28)}
  .card h2{font-size:1.02rem;margin:0 0 1rem;padding-bottom:.65rem;border-bottom:1px solid #22303d;display:flex;align-items:center;gap:.55rem}
  .card h2::before{content:"";width:4px;height:1.05rem;border-radius:3px;background:linear-gradient(#3f8fe0,#2b6ab5)}
  @media (min-width:900px){
    main{grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);align-items:start}
    .card--groups{grid-column:1;grid-row:1}
    .card--upload{grid-column:2;grid-row:1;position:sticky;top:5rem}
    .card--songs{grid-column:1 / -1;grid-row:2}
  }
  input[type=file]{width:100%;padding:.6rem;border-radius:8px;border:1px solid #2b3947;background:#0f1720;color:#e6edf3}
  button{padding:.6rem 1rem;border:0;border-radius:8px;background:#2b6ab5;color:#fff;font-weight:600;cursor:pointer}
  button.danger{background:#8a2b3a}
  form.upload button{width:100%;margin-top:.75rem}
  ul{list-style:none;margin:0;padding:0}
  .track{display:flex;flex-wrap:nowrap;align-items:center;gap:.5rem;padding:.55rem 0;border-bottom:1px solid #22303d}
  .track:last-child{border-bottom:0}
  .track .title{flex:1 1 auto;min-width:0;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .track form{flex:0 0 auto;margin:0}
  .play-toggle{flex:0 0 auto;width:38px;height:38px;padding:0;border-radius:50%;
    background:#2b6ab5;color:#fff;font-size:.9rem;line-height:1;display:inline-flex;
    align-items:center;justify-content:center;transition:transform .12s ease,background .12s ease}
  .play-toggle:hover{transform:scale(1.06)}
  .play-toggle.playing{background:#8a2b3a}
  .danger.icon{width:38px;height:38px;padding:0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center}
  .empty{color:#7d8da3;font-size:.9rem}
  .flash{background:#1f3b2a;color:#b4ffcf;padding:.6rem;border-radius:8px;margin-bottom:1rem;font-size:.88rem}
  .hint{color:#7d8da3;font-size:.8rem;margin-top:.5rem}
  select{width:100%;padding:.6rem;border-radius:8px;border:1px solid #2b3947;background:#0f1720;color:#e6edf3}
  /* Tom Select — tema oscuro */
  .ts-wrapper{width:100%}
  .ts-control{background:#0f1720 !important;border:1px solid #2b3947 !important;border-radius:8px !important;color:#e6edf3 !important;box-shadow:none !important;padding:.5rem .6rem !important;min-height:0 !important}
  .ts-control input,.ts-control .item{color:#e6edf3 !important}
  .ts-control input::placeholder{color:#7d8da3 !important}
  .ts-wrapper.focus .ts-control{border-color:#2b6ab5 !important}
  .ts-wrapper.single .ts-control:after{border-color:#9db8d6 transparent transparent transparent !important}
  .ts-dropdown{background:#161f2b !important;border:1px solid #2b3947 !important;color:#e6edf3 !important;margin-top:.25rem !important;box-shadow:0 8px 24px rgba(0,0,0,.4) !important;border-radius:8px !important}
  .ts-dropdown .option{color:#e6edf3;padding:.5rem .6rem}
  .ts-dropdown .option.active,.ts-dropdown .active{background:#2b6ab5 !important;color:#fff !important}
  .ts-dropdown .no-results{color:#7d8da3}
  label{display:block;font-size:.82rem;color:#9db8d6;margin:.25rem 0}
  .row-create{display:flex;gap:.5rem;flex-wrap:wrap}
  .row-create input{flex:1 1 160px;padding:.6rem;border-radius:8px;border:1px solid #2b3947;background:#0f1720;color:#e6edf3}
  .group-row{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;padding:.7rem 0;border-bottom:1px solid #22303d}
  .group-row:last-child{border-bottom:0}
  .group-name{flex:1 1 auto;font-weight:600;min-width:120px;word-break:break-word}
  .badge{background:#1f3b2a;color:#b4ffcf;border-radius:999px;padding:.15rem .6rem;font-size:.72rem;white-space:nowrap}
  .badge.off{background:#332027;color:#e0a0a0}
  .count{color:#7d8da3;font-size:.8rem;white-space:nowrap}
  .actions{display:flex;gap:.4rem;flex-wrap:wrap}
  button.ghost{background:transparent;border:1px solid #2b6ab5;color:#9db8d6}
  button.small{padding:.4rem .7rem;font-size:.82rem}
  .mover{display:inline-flex;gap:.25rem;margin-right:.35rem}
  .mover button{padding:.35rem .55rem;font-size:.8rem;line-height:1;background:#22303d;color:#c9d6e5}
  .mover button[disabled]{opacity:.35;cursor:default}
  .track-order{display:inline-flex;flex:0 0 auto}
  .grouplist{margin-top:.75rem;border:1px solid #22303d;border-radius:10px;overflow:hidden}
  .grouplist summary{list-style:none;cursor:pointer;user-select:none;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;
    padding:.7rem .85rem;background:#121a25;font-size:.95rem;color:#c9d6e5}
  .grouplist summary::-webkit-details-marker{display:none}
  .grouplist summary:hover{background:#16202d}
  .grouplist .g-name{font-weight:600}
  .grouplist .chev{transition:transform .15s ease;color:#7d8da3;font-size:.9rem}
  .grouplist[open] .chev{transform:rotate(90deg)}
  .grouplist ul,.grouplist>.empty{padding:.25rem .85rem .5rem}
  .track{transition:background .12s ease;border-radius:8px}
  .track:hover{background:#1b2735}
  .group-row{transition:background .12s ease;border-radius:8px}
  .group-row:hover{background:#1a2634}
  @media (max-width:520px){
    main{padding:1rem}
    .card{padding:1rem}
    .track{gap:.35rem}
    .mover{margin-right:.15rem;gap:.15rem}
    .mover button{padding:.3rem .4rem}
    .play-toggle,.danger.icon{width:34px;height:34px}
  }
</style>
</head>
<body>
<header>
  <h1>Administrar música de respaldo</h1>
  <nav class="header-links">
    <a href="MANUAL.html" target="_blank" rel="noopener" class="help-link">? Ayuda</a>
    <a href="logout.php">Cerrar sesión</a>
  </nav>
</header>
<main>
  <!-- Grupos -->
  <div class="card card--groups">
    <h2>Grupos de reproducción</h2>
    <p class="hint" style="margin-top:0">Los grupos <strong>activos</strong> se reproducen en secuencia, de arriba hacia abajo. Usa ▲▼ para ordenarlos. Desactiva un grupo para saltarlo.</p>

    <form class="row-create" method="post" action="group.php">
      <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
      <input type="hidden" name="action" value="create">
      <input type="text" name="name" placeholder="Nombre del grupo (ej. Comerciales)" maxlength="60" required>
      <button type="submit">Crear grupo</button>
    </form>

    <div style="margin-top:1rem">
      <?php
        $gIndex = 0;
        $gTotal = count($groups);
        foreach ($groups as $gid => $g):
            $isEnabled = !empty($g['enabled']);
      ?>
        <div class="group-row">
          <?php order_control('move_group', ['group' => $gid], $gIndex > 0, $gIndex < $gTotal - 1); ?>
          <span class="group-name"><?= h($g['name']) ?></span>
          <?php if ($isEnabled): ?>
            <span class="badge">● Activo</span>
          <?php else: ?>
            <span class="badge off">○ Inactivo</span>
          <?php endif; ?>
          <span class="count"><?= count($g['tracks']) ?> pista(s)</span>
          <span class="actions">
            <form method="post" action="group.php">
              <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="action" value="toggle">
              <input type="hidden" name="group" value="<?= h($gid) ?>">
              <button class="ghost small" type="submit"><?= $isEnabled ? 'Desactivar' : 'Activar' ?></button>
            </form>
            <?php if (count($groups) > 1): ?>
              <form method="post" action="group.php" data-confirm="¿Eliminar el grupo «<?= h($g['name']) ?>» y todas sus canciones?" data-confirm-btn="Sí, eliminar">
                <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="group" value="<?= h($gid) ?>">
                <button class="danger small" type="submit">Eliminar</button>
              </form>
            <?php endif; ?>
          </span>
        </div>
      <?php $gIndex++; endforeach; ?>
    </div>
  </div>

  <!-- Subir canción -->
  <div class="card card--upload">
    <h2>Subir canción</h2>
    <form class="upload" method="post" action="upload.php" enctype="multipart/form-data">
      <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
      <label for="group">Añadir al grupo</label>
      <select id="group" name="group">
        <?php foreach ($groups as $gid => $g): ?>
          <option value="<?= h($gid) ?>" <?= $gid === $firstEnabled ? 'selected' : '' ?>>
            <?= h($g['name']) ?><?= empty($g['enabled']) ? ' (inactivo)' : '' ?>
          </option>
        <?php endforeach; ?>
      </select>
      <input type="file" name="song" accept=".mp3,.m4a,.aac,.ogg,audio/*" required style="margin-top:.5rem">
      <p class="hint">Formatos: MP3, M4A, AAC, OGG · máx. 25 MB.</p>
      <button type="submit">Subir</button>
    </form>
  </div>

  <!-- Canciones por grupo -->
  <div class="card card--songs">
    <h2>Canciones</h2>
    <?php foreach ($groups as $gid => $g): ?>
      <details class="grouplist" open>
        <summary>
          <span class="chev" aria-hidden="true">▸</span>
          <span class="g-name"><?= h($g['name']) ?></span>
          <?php if (!empty($g['enabled'])): ?>
            <span class="badge">● Activo</span>
          <?php else: ?>
            <span class="badge off">○ Inactivo</span>
          <?php endif; ?>
          <span class="count"><?= count($g['tracks']) ?></span>
        </summary>
        <?php if (!$g['tracks']): ?>
          <p class="empty">Sin canciones en este grupo.</p>
        <?php else: ?>
          <ul>
            <?php
              $tIndex = 0;
              $tTotal = count($g['tracks']);
              foreach ($g['tracks'] as $t):
            ?>
              <li class="track">
                <?php order_control('move_track', ['group' => $gid, 'file' => $t['file']], $tIndex > 0, $tIndex < $tTotal - 1); ?>
                <button type="button" class="play-toggle" data-src="<?= h($t['url']) ?>" aria-label="Reproducir">▶</button>
                <span class="title"><?= h($t['title'] ?? $t['file']) ?></span>
                <form method="post" action="delete.php" data-confirm="¿Eliminar esta canción?" data-confirm-btn="Sí, eliminar">
                  <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
                  <input type="hidden" name="file" value="<?= h($t['file']) ?>">
                  <button class="danger icon" type="submit" aria-label="Eliminar" title="Eliminar">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </form>
              </li>
            <?php $tIndex++; endforeach; ?>
          </ul>
        <?php endif; ?>
      </details>
    <?php endforeach; ?>
  </div>
</main>

<script>
  // Previsualización: un solo audio compartido; al reproducir uno se pausa el
  // anterior. Cada botón alterna ▶ / ⏸ de su propia pista.
  (function () {
    const preview = new Audio();
    let currentBtn = null;

    function toPlay(btn) {
      if (!btn) return;
      btn.classList.remove('playing');
      btn.textContent = '▶';
      btn.setAttribute('aria-label', 'Reproducir');
    }
    function toPause(btn) {
      if (!btn) return;
      btn.classList.add('playing');
      btn.textContent = '⏸';
      btn.setAttribute('aria-label', 'Pausar');
    }

    document.querySelectorAll('.play-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-src');
        // Mismo botón sonando: pausar.
        if (currentBtn === btn && !preview.paused) {
          preview.pause();
          return;
        }
        // Cambiar de pista.
        if (currentBtn && currentBtn !== btn) toPlay(currentBtn);
        currentBtn = btn;
        const abs = new URL(src, location.href).href;
        if (preview.src !== abs) preview.src = src;
        preview.play().catch(() => {});
      });
    });

    preview.addEventListener('playing', () => toPause(currentBtn));
    preview.addEventListener('pause', () => toPlay(currentBtn));
    preview.addEventListener('ended', () => { toPlay(currentBtn); currentBtn = null; });
    preview.addEventListener('error', () => toPlay(currentBtn));
  })();
</script>

<script src="https://cdn.jsdelivr.net/npm/tom-select@2/dist/js/tom-select.complete.min.js"></script>
<script>
  // Convierte los <select> en buscables con Tom Select.
  if (window.TomSelect) {
    document.querySelectorAll('select').forEach((el) => {
      new TomSelect(el, { create: false, allowEmptyOption: false });
    });
  }
</script>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
  const SWAL_THEME = { background: '#161f2b', color: '#e6edf3' };

  // Confirmaciones con SweetAlert2 para cualquier formulario con data-confirm.
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (form.dataset.confirmed) return; // ya confirmado: dejar enviar
      e.preventDefault();
      Swal.fire({
        ...SWAL_THEME,
        title: '¿Estás seguro?',
        text: form.getAttribute('data-confirm'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: form.getAttribute('data-confirm-btn') || 'Sí',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#8a2b3a',
        cancelButtonColor: '#2b6ab5',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          form.dataset.confirmed = '1';
          form.submit();
        }
      });
    });
  });

  <?php if ($flash): ?>
  // Aviso tras la última acción (toast).
  Swal.fire({
    ...SWAL_THEME,
    toast: true,
    position: 'top-end',
    icon: '<?= $flashType ?>',
    title: <?= json_encode($flash, JSON_UNESCAPED_UNICODE) ?>,
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true
  });
  <?php endif; ?>
</script>
</body>
</html>
