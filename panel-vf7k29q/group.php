<?php
/**
 * Gestión de grupos de reproducción: crear, activar y eliminar.
 * Requiere sesión activa y token CSRF válido.
 */
require __DIR__ . '/_auth.php';
require_login();
$c = cfg();

function back(string $msg): void {
    $_SESSION['flash'] = $msg;
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()) {
    http_response_code(400);
    back('Solicitud inválida.');
}

$action = (string) ($_POST['action'] ?? '');
$lib = load_library();

switch ($action) {
    case 'create':
        $name = (string) ($_POST['name'] ?? '');
        $name = preg_replace('/[^\p{L}\p{N}\s\-\_\.\(\)]/u', '', $name);
        $name = trim((string) mb_substr((string) $name, 0, 60));
        if ($name === '') {
            back('El nombre del grupo no puede estar vacío.');
        }
        $id = new_group_id();
        $lib['groups'][$id] = ['name' => $name, 'enabled' => true, 'tracks' => []];
        save_library($lib);
        back("Grupo «{$name}» creado.");
        break;

    case 'toggle':
        $gid = (string) ($_POST['group'] ?? '');
        if (!isset($lib['groups'][$gid])) {
            back('El grupo no existe.');
        }
        $lib['groups'][$gid]['enabled'] = empty($lib['groups'][$gid]['enabled']);
        save_library($lib); // republica la secuencia sin/ con este grupo
        $estado = $lib['groups'][$gid]['enabled'] ? 'activado' : 'desactivado';
        back("Grupo «{$lib['groups'][$gid]['name']}» {$estado}.");
        break;

    case 'delete':
        $gid = (string) ($_POST['group'] ?? '');
        if (!isset($lib['groups'][$gid])) {
            back('El grupo no existe.');
        }
        if (count($lib['groups']) <= 1) {
            back('No puedes eliminar el único grupo. Crea otro primero.');
        }
        // Borrar del disco las canciones del grupo
        foreach ($lib['groups'][$gid]['tracks'] as $t) {
            $path = rtrim($c['music_dir'], '/') . '/' . basename((string) ($t['file'] ?? ''));
            if (($t['file'] ?? '') !== '' && is_file($path)) {
                @unlink($path);
            }
        }
        $name = $lib['groups'][$gid]['name'];
        unset($lib['groups'][$gid]);
        save_library($lib);
        back("Grupo «{$name}» eliminado.");
        break;

    case 'move_group':
        $gid = (string) ($_POST['group'] ?? '');
        $dir = ($_POST['dir'] ?? '') === 'up' ? 'up' : 'down';
        $ids = array_keys($lib['groups']);
        $i = array_search($gid, $ids, true);
        if ($i !== false) {
            $j = $dir === 'up' ? $i - 1 : $i + 1;
            if ($j >= 0 && $j < count($ids)) {
                [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
                $reordered = [];
                foreach ($ids as $id) {
                    $reordered[$id] = $lib['groups'][$id];
                }
                $lib['groups'] = $reordered;
                save_library($lib);
            }
        }
        back('Orden de grupos actualizado.');
        break;

    case 'move_track':
        $gid  = (string) ($_POST['group'] ?? '');
        $file = basename((string) ($_POST['file'] ?? ''));
        $dir  = ($_POST['dir'] ?? '') === 'up' ? 'up' : 'down';
        if (isset($lib['groups'][$gid])) {
            $tracks = array_values($lib['groups'][$gid]['tracks']);
            $i = null;
            foreach ($tracks as $k => $t) {
                if (($t['file'] ?? '') === $file) { $i = $k; break; }
            }
            if ($i !== null) {
                $j = $dir === 'up' ? $i - 1 : $i + 1;
                if ($j >= 0 && $j < count($tracks)) {
                    [$tracks[$i], $tracks[$j]] = [$tracks[$j], $tracks[$i]];
                    $lib['groups'][$gid]['tracks'] = $tracks;
                    save_library($lib); // republica el orden si es el grupo activo
                }
            }
        }
        back('Orden actualizado.');
        break;

    default:
        back('Acción no reconocida.');
}
