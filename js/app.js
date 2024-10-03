const audio = document.getElementById("audio");
const playPause = document.getElementById("play");

// Establecer la URL de la transmisión de radio
const radioUrl = "https://vosfm.com.mx/shoutcast-stream/;stream.mp3";
audio.src = radioUrl;

function togglePlayPauseIcons() {
  playPause.querySelector(".pause-btn").classList.toggle("hide");
  playPause.querySelector(".play-btn").classList.toggle("hide");
  playPause.classList.toggle("red");
  playPause.classList.toggle("blue");
}

function handleAudioState() {
  togglePlayPauseIcons();
}

function handleEndOfAudio() {
  audio.currentTime = 0; // Reiniciar el audio al principio
  audio.pause();
  handleAudioState(); // Asegurar que los iconos estén en el estado correcto
}

playPause.addEventListener("click", () => {
  if (audio.paused || audio.ended) {
    audio.play();
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", handleAudioState);
audio.addEventListener("pause", handleAudioState);
audio.addEventListener("ended", handleEndOfAudio);

audio.addEventListener('ended', function() {
  console.log('La reproducción del audio ha terminado.');
  handleEndOfAudio()
});



//video

document.addEventListener('DOMContentLoaded', function() {
  var video = document.getElementById('video_background');
  video.play().catch(error => {
      console.log('Error al reproducir el video automáticamente:', error);
  });
});
