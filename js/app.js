const audio = document.getElementById("audio");
const playPause = document.getElementById("play");

// Establecer la URL de la transmisión de radio (puede ser null si no hay radio disponible)
const radioUrl = "https://vosfm.com.mx/shoutcast-stream/;stream.mp3"; // Cambia a null para probar sin radio
const playlist = []; // Lista de reproducción de canciones (vacía para este caso)

let currentTrackIndex = 0; // Índice de la pista actual en la lista de reproducción
let isRadioPlaying = false; // Indica si está reproduciendo la radio o la lista de música

// Función para actualizar los íconos de play/pause según el estado del audio
function updatePlayPauseIcons() {
  if (!radioUrl && playlist.length === 0) {
    // Si no hay radio ni lista de reproducción, desactivar el botón
    playPause.querySelector(".pause-btn").classList.add("hide");
    playPause.querySelector(".play-btn").classList.remove("hide");
    playPause.classList.remove("red");
    playPause.classList.add("blue");
    playPause.disabled = true; // Desactivar el botón
    return;
  }

  if (audio.paused || audio.ended) {
    // Si el audio está pausado o ha terminado, mostrar el ícono de play
    playPause.querySelector(".pause-btn").classList.add("hide");
    playPause.querySelector(".play-btn").classList.remove("hide");
    playPause.classList.remove("red");
    playPause.classList.add("blue");
  } else {
    // Si el audio está reproduciéndose, mostrar el ícono de pause
    playPause.querySelector(".pause-btn").classList.remove("hide");
    playPause.querySelector(".play-btn").classList.add("hide");
    playPause.classList.add("red");
    playPause.classList.remove("blue");
  }
}

// Función para manejar el final de la reproducción
function handleEndOfAudio() {
  if (isRadioPlaying) {
    // Si es la radio, simplemente pausa y reinicia el botón
    audio.pause();
    updatePlayPauseIcons();
  } else {
    // Si es la lista de reproducción, reproduce la siguiente canción
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadAndPlayTrack(playlist[currentTrackIndex]);
  }
}

// Función para cargar y reproducir una pista específica
function loadAndPlayTrack(trackUrl) {
  audio.src = trackUrl;
  audio.play().catch((error) => {
    console.error("Error al reproducir la pista:", error);
  });
}

// Evento de clic en el botón de play/pause
playPause.addEventListener("click", () => {
  if (!radioUrl && playlist.length === 0) {
    // Si no hay radio ni lista de reproducción, no hacer nada
    return;
  }

  if (audio.paused || audio.ended) {
    if (radioUrl) {
      // Reproducir la radio si está disponible
      audio.src = radioUrl;
      isRadioPlaying = true;
    } else {
      // Reproducir la lista de reproducción si no hay radio
      loadAndPlayTrack(playlist[currentTrackIndex]);
      isRadioPlaying = false;
    }
    audio.play();
  } else {
    // Pausar la reproducción
    audio.pause();
  }
});

// Eventos del audio
audio.addEventListener("play", updatePlayPauseIcons);
audio.addEventListener("pause", updatePlayPauseIcons);
audio.addEventListener("ended", handleEndOfAudio);

// Cuando se carga la página, asegurarse de que el reproductor esté en modo inicial
window.addEventListener("DOMContentLoaded", () => {
  audio.pause(); // Asegurarse de que el audio no se reproduzca automáticamente
  updatePlayPauseIcons(); // Actualizar los íconos al estado correcto
});

//video

document.addEventListener('DOMContentLoaded', function() {
  var video = document.getElementById('video_background');
  video.play().catch(error => {
      console.log('Error al reproducir el video automáticamente:', error);
  });
});
