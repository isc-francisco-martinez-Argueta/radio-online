const audio = document.getElementById("audio");
const playPause = document.getElementById("play");

// Configuración
const CONFIG = {
    radioUrl: "https://vosfm.com.mx/shoutcast-stream/;stream.mp3",
    playlist: [],
    reconnectAttempts: 3,
    reconnectDelay: 2000
};

// Estado de la aplicación
const state = {
    currentTrackIndex: 0,
    isRadioPlaying: false,
    reconnectCount: 0
};

// Utilidad para mostrar mensajes de error
function showError(message) {
    console.error(message);
    // Opcional: mostrar un toast o notificación al usuario
    // Puedes agregar un elemento HTML para esto
}

// Función para actualizar los íconos de play/pause
function updatePlayPauseIcons() {
    const hasContent = CONFIG.radioUrl || CONFIG.playlist.length > 0;

    if (!hasContent) {
        playPause.querySelector(".pause-btn").classList.add("hide");
        playPause.querySelector(".play-btn").classList.remove("hide");
        playPause.classList.remove("red");
        playPause.classList.add("blue");
        playPause.disabled = true;
        return;
    }

    const isPaused = audio.paused || audio.ended;

    playPause.querySelector(".pause-btn").classList.toggle("hide", isPaused);
    playPause.querySelector(".play-btn").classList.toggle("hide", !isPaused);
    playPause.classList.toggle("red", !isPaused);
    playPause.classList.toggle("blue", isPaused);
    playPause.disabled = false;
}

// Función para cargar y reproducir una pista
async function loadAndPlayTrack(trackUrl) {
    try {
        audio.src = trackUrl;
        await audio.play();
    } catch (error) {
        showError("Error al reproducir la pista: " + error.message);
        handlePlaybackError();
    }
}

// Manejo de errores de reproducción
function handlePlaybackError() {
    if (state.isRadioPlaying && state.reconnectCount < CONFIG.reconnectAttempts) {
        state.reconnectCount++;
        console.log(`Intento de reconexión ${state.reconnectCount}/${CONFIG.reconnectAttempts}`);

        setTimeout(() => {
            loadAndPlayTrack(CONFIG.radioUrl);
        }, CONFIG.reconnectDelay);
    } else {
        audio.pause();
        updatePlayPauseIcons();
        state.reconnectCount = 0;
    }
}

// Función para manejar el final de la reproducción
function handleEndOfAudio() {
    if (state.isRadioPlaying) {
        audio.pause();
        updatePlayPauseIcons();
    } else if (CONFIG.playlist.length > 0) {
        state.currentTrackIndex = (state.currentTrackIndex + 1) % CONFIG.playlist.length;
        loadAndPlayTrack(CONFIG.playlist[state.currentTrackIndex]);
    }
}

// Evento de clic en el botón de play/pause
playPause.addEventListener("click", async () => {
    if (!CONFIG.radioUrl && CONFIG.playlist.length === 0) {
        return;
    }

    if (audio.paused || audio.ended) {
        state.reconnectCount = 0; // Resetear contador de reconexión

        if (CONFIG.radioUrl) {
            state.isRadioPlaying = true;
            await loadAndPlayTrack(CONFIG.radioUrl);
        } else {
            state.isRadioPlaying = false;
            await loadAndPlayTrack(CONFIG.playlist[state.currentTrackIndex]);
        }
    } else {
        audio.pause();
    }
});

// Event Listeners del audio
audio.addEventListener("play", updatePlayPauseIcons);
audio.addEventListener("pause", updatePlayPauseIcons);
audio.addEventListener("ended", handleEndOfAudio);
audio.addEventListener("error", handlePlaybackError);

// Inicialización cuando se carga la página
window.addEventListener("DOMContentLoaded", () => {
    audio.pause();
    updatePlayPauseIcons();
});

// Manejo del video de fondo
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video_background');

    if (video) {
        // Intentar reproducir el video
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Video reproduciéndose automáticamente');
                })
                .catch(error => {
                    console.log('No se pudo reproducir el video automáticamente:', error);
                    // El video se reproducirá cuando el usuario interactúe con la página
                });
        }
    }
});

// Prevenir problemas de reproducción en dispositivos móviles
if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'VOS FM 91.3',
        artist: 'Radio en Vivo',
        album: 'Bochil, Chiapas, México',
        artwork: [
            { src: 'img/icon-vos.png', sizes: '192x192', type: 'image/png' },
            { src: 'img/icon-vos.png', sizes: '512x512', type: 'image/png' }
        ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
        playPause.click();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        playPause.click();
    });
}