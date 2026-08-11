const audio = document.getElementById("audio");
const playPause = document.getElementById("play");

// Configuración
const CONFIG = {
    radioUrl: "https://vosfm.com.mx/shoutcast-stream/;stream.mp3",
    playlistUrl: "/musica/playlist.json", // lista de respaldo (alimentada desde el panel)
    playlist: [],                          // se llena en tiempo de ejecución con URLs
    reconnectAttempts: 1,
    reconnectDelay: 2000
};

// Estado de la aplicación
const state = {
    mode: "idle",          // "idle" | "radio" | "playlist"
    currentTrackIndex: 0,
    reconnectCount: 0,
    playlistFailures: 0,   // fallos consecutivos en modo lista (evita bucle infinito)
    loading: false,        // true mientras se conecta/buferiza
    gen: 0,                // "generación" del intento actual (ignora errores rezagados)
    reconnectTimer: null
};

// Aviso informativo (p. ej. stream caído). No es un fallo crítico: la app
// reintenta y, si hace falta, pasa a la lista local de respaldo.
function showError(message) {
    console.warn(message);
}

// Cargar la lista de respaldo generada por el panel de administración
async function loadPlaylist() {
    try {
        const res = await fetch(CONFIG.playlistUrl, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        CONFIG.playlist = (data.tracks || [])
            .map((t) => t.url)
            .filter((url) => typeof url === "string" && url.length > 0);
    } catch (_) {
        // Sin lista de respaldo disponible; se continúa solo con el stream.
    }
}

/**
 * Dibuja el botón según la INTENCIÓN (encendido/apagado), no según cada
 * evento del audio. Esto evita el parpadeo play/pause durante la carga:
 * si el usuario quiere oír (mode != idle), se muestra "pause" de forma
 * estable aunque el audio esté buferizando.
 */
function renderButton() {
    const hasContent = CONFIG.radioUrl || CONFIG.playlist.length > 0;
    const active = state.mode === "radio" || state.mode === "playlist";

    playPause.disabled = !hasContent;
    playPause.querySelector(".pause-btn").classList.toggle("hide", !active);
    playPause.querySelector(".play-btn").classList.toggle("hide", active);
    playPause.classList.toggle("red", active);
    playPause.classList.toggle("blue", !active);
    playPause.classList.toggle("loading", active && state.loading);
    playPause.setAttribute(
        "aria-label",
        active ? (state.loading ? "Conectando…" : "Detener radio") : "Reproducir radio"
    );
}

// Cargar y reproducir una fuente (stream o pista)
async function loadAndPlayTrack(trackUrl) {
    const gen = ++state.gen; // marca este intento; invalida los anteriores
    try {
        state.loading = true;
        renderButton();
        // Detener carga/reproducción previa para evitar
        // "play() request was interrupted by a new load request".
        audio.pause();
        // Para las canciones locales añadimos un parámetro anti-caché: así la
        // petición nunca coincide con una respuesta vieja/corrupta del service
        // worker y siempre baja fresca de la red (con soporte de rango 206).
        // El stream en vivo se usa tal cual.
        audio.src = (trackUrl === CONFIG.radioUrl)
            ? trackUrl
            : trackUrl + (trackUrl.includes("?") ? "&" : "?") + "cb=" + Date.now();
        audio.load();
        await audio.play();
        if (gen !== state.gen) return; // otra carga tomó el relevo
        // Éxito: el evento "playing" quitará el estado de carga.
        state.reconnectCount = 0;
        state.playlistFailures = 0;
    } catch (error) {
        if (gen !== state.gen) return; // error de un intento viejo: ignorar
        showError("Error al reproducir: " + error.message);
        handlePlaybackError();
    }
}

// Diagnóstico: consulta el estado HTTP real de cada pista para saber si el
// problema es la ruta/servidor (404, tipo MIME incorrecto) o el navegador.
async function diagnoseTracks() {
    for (const url of CONFIG.playlist) {
        try {
            const r = await fetch(url, { method: "HEAD", cache: "no-store" });
            console.log(
                `  ${url} → HTTP ${r.status} · tipo: ${r.headers.get("content-type") || "(sin content-type)"}`
            );
        } catch (e) {
            console.log(`  ${url} → no accesible (${e.message})`);
        }
    }
}

// Cancelar cualquier reintento pendiente
function cancelReconnect() {
    if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer);
        state.reconnectTimer = null;
    }
}

// Detener por completo la reproducción y volver a estado apagado
function stopPlayback() {
    cancelReconnect();
    state.mode = "idle";
    state.loading = false;
    audio.pause();
    renderButton();
}

// Manejo de errores de reproducción con fallback automático a la lista local
function handlePlaybackError() {
    if (state.reconnectTimer) {
        return; // ya hay un reintento en curso (evita duplicados)
    }

    // 1) En modo radio: reintentar reconectar al stream
    if (state.mode === "radio" && state.reconnectCount < CONFIG.reconnectAttempts) {
        state.reconnectCount++;
        console.log(`Reconexión ${state.reconnectCount}/${CONFIG.reconnectAttempts}`);
        state.reconnectTimer = setTimeout(() => {
            state.reconnectTimer = null;
            loadAndPlayTrack(CONFIG.radioUrl);
        }, CONFIG.reconnectDelay);
        return;
    }

    // 2) Stream agotado: cambiar a la lista de respaldo si existe
    if (state.mode === "radio" && CONFIG.playlist.length > 0) {
        console.log("Stream no disponible: reproduciendo lista local de respaldo.");
        state.mode = "playlist";
        state.currentTrackIndex = 0;
        state.playlistFailures = 0;
        loadAndPlayTrack(CONFIG.playlist[0]);
        return;
    }

    // 3) En modo lista: saltar a la siguiente pista si una falla,
    //    pero detenerse si TODAS fallan (evita bucle infinito).
    if (state.mode === "playlist" && CONFIG.playlist.length > 0) {
        state.playlistFailures++;
        if (state.playlistFailures >= CONFIG.playlist.length) {
            console.warn("Ninguna canción de la lista se pudo reproducir. Diagnóstico:");
            diagnoseTracks();
            stopPlayback();
            return;
        }
        state.currentTrackIndex = (state.currentTrackIndex + 1) % CONFIG.playlist.length;
        state.reconnectTimer = setTimeout(() => {
            state.reconnectTimer = null;
            loadAndPlayTrack(CONFIG.playlist[state.currentTrackIndex]);
        }, 500);
        return;
    }

    // 4) Nada reproducible
    stopPlayback();
}

// Al terminar una pista: en modo lista, avanzar en bucle
function handleEndOfAudio() {
    if (state.mode === "playlist" && CONFIG.playlist.length > 0) {
        state.currentTrackIndex = (state.currentTrackIndex + 1) % CONFIG.playlist.length;
        loadAndPlayTrack(CONFIG.playlist[state.currentTrackIndex]);
    } else {
        stopPlayback();
    }
}

// Botón play/pause
playPause.addEventListener("click", async () => {
    if (!CONFIG.radioUrl && CONFIG.playlist.length === 0) {
        return;
    }

    // Si ya está encendido (reproduciendo o cargando), apagar.
    if (state.mode !== "idle") {
        stopPlayback();
        return;
    }

    // Encender: reiniciar contadores y empezar por el stream.
    cancelReconnect();
    state.reconnectCount = 0;
    state.playlistFailures = 0;

    if (CONFIG.radioUrl) {
        state.mode = "radio";
        await loadAndPlayTrack(CONFIG.radioUrl);
    } else {
        state.mode = "playlist";
        state.currentTrackIndex = 0;
        await loadAndPlayTrack(CONFIG.playlist[0]);
    }
});

// Eventos del elemento de audio: solo actualizan el estado de "carga".
// El ícono se decide por state.mode (intención), no por estos eventos,
// para no parpadear durante la conexión/buffer.
audio.addEventListener("playing", () => {
    state.loading = false;
    renderButton();
});
audio.addEventListener("waiting", () => {
    if (state.mode !== "idle") {
        state.loading = true;
        renderButton();
    }
});
audio.addEventListener("ended", handleEndOfAudio);
// Los fallos de carga se gestionan en el catch de loadAndPlayTrack (con control
// de generación). Un listener global de "error" aquí dispararía también con
// fuentes anteriores y rompería el cambio a la lista de respaldo.

// Inicialización
window.addEventListener("DOMContentLoaded", async () => {
    audio.pause();
    await loadPlaylist();
    renderButton();

    // Video de fondo
    const video = document.getElementById("video_background");
    if (video) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                // Se reproducirá cuando el usuario interactúe con la página.
                console.log("No se pudo reproducir el video automáticamente:", error);
            });
        }
    }
});

// Controles del sistema (bloqueo/notificación) en móviles
if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: "VOS FM 91.3",
        artist: "Radio en Vivo",
        album: "Bochil, Chiapas, México",
        artwork: [
            { src: "img/icon-vos.png", sizes: "192x192", type: "image/png" },
            { src: "img/icon-vos.png", sizes: "512x512", type: "image/png" }
        ]
    });

    navigator.mediaSession.setActionHandler("play", () => playPause.click());
    navigator.mediaSession.setActionHandler("pause", () => playPause.click());
}
