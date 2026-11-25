<?php
/**
 * Últimos videos del canal de YouTube de VOS FM (@VOSFM), en JSON.
 *
 * Lee el feed público del canal (no necesita clave de API) y lo guarda en caché
 * 30 minutos para no consultar YouTube en cada visita. Si YouTube no responde,
 * entrega la última copia guardada.
 *
 * Respuesta: { canal: {id, nombre, url}, actualizado, videos: [{id, titulo, fecha, url, miniatura}] }
 */
declare(strict_types=1);

const CANAL_ID   = 'UCGpDKxLiIPffchUMTww5Hlw';      // https://www.youtube.com/@VOSFM
const CANAL_URL  = 'https://www.youtube.com/@VOSFM';
const MAX_VIDEOS = 6;
const CACHE_TTL  = 1800;                            // 30 minutos

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function responder(array $datos, int $codigo = 200, int $maxAge = 600): void
{
    http_response_code($codigo);
    header('Cache-Control: public, max-age=' . $maxAge);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function rutaCache(): string
{
    $dir = __DIR__ . '/cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (!is_dir($dir) || !is_writable($dir)) {
        $dir = sys_get_temp_dir();
    }
    return $dir . '/youtube-' . CANAL_ID . '.json';
}

function descargarFeed(): ?string
{
    $url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' . CANAL_ID;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_USERAGENT      => 'VOSFM-Web/1.0',
        ]);
        $xml  = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($xml !== false && $code === 200) ? (string) $xml : null;
    }

    $ctx = stream_context_create(['http' => ['timeout' => 8, 'user_agent' => 'VOSFM-Web/1.0']]);
    $xml = @file_get_contents($url, false, $ctx);
    return $xml === false ? null : $xml;
}

function leerVideos(string $xml): ?array
{
    libxml_use_internal_errors(true);
    $feed = simplexml_load_string($xml);
    if ($feed === false) {
        return null;
    }

    $videos = [];
    foreach ($feed->entry as $entry) {
        $yt = $entry->children('http://www.youtube.com/xml/schemas/2015');
        $id = (string) $yt->videoId;
        if (!preg_match('/^[A-Za-z0-9_-]{11}$/', $id)) {
            continue;
        }
        $videos[] = [
            'id'        => $id,
            'titulo'    => trim(html_entity_decode((string) $entry->title, ENT_QUOTES | ENT_HTML5, 'UTF-8')),
            'fecha'     => (string) $entry->published,
            'url'       => 'https://www.youtube.com/watch?v=' . $id,
            'miniatura' => 'https://i.ytimg.com/vi/' . $id . '/hqdefault.jpg',
        ];
        if (count($videos) >= MAX_VIDEOS) {
            break;
        }
    }

    return [
        'canal' => [
            'id'     => CANAL_ID,
            'nombre' => trim((string) $feed->title) ?: 'VOS FM',
            'url'    => CANAL_URL,
        ],
        'actualizado' => gmdate('c'),
        'videos'      => $videos,
    ];
}

$cache = rutaCache();

// 1) Copia reciente en caché
if (is_file($cache) && (time() - filemtime($cache)) < CACHE_TTL) {
    $datos = json_decode((string) file_get_contents($cache), true);
    if (is_array($datos)) {
        responder($datos);
    }
}

// 2) Consultar YouTube
$xml   = descargarFeed();
$datos = $xml ? leerVideos($xml) : null;

if ($datos !== null) {
    @file_put_contents($cache, json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    responder($datos);
}

// 3) YouTube no respondió: usar la última copia aunque sea vieja
if (is_file($cache)) {
    $datos = json_decode((string) file_get_contents($cache), true);
    if (is_array($datos)) {
        responder($datos, 200, 120);
    }
}

responder(['error' => 'No se pudieron obtener los videos', 'canal' => ['url' => CANAL_URL]], 502, 60);
