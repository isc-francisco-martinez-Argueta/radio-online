const audio = document.getElementById("audio");
const playPause = document.getElementById("play");

function handleAudioState() {
  if (audio.paused || audio.ended) {
    playPause.querySelector(".pause-btn").classList.toggle("hide");
    playPause.querySelector(".play-btn").classList.toggle("hide");
    playPause.classList.toggle("red"); // Cambiar el color del botón de reproducción
    playPause.classList.toggle("blue");
  } else {
    playPause.querySelector(".pause-btn").classList.toggle("hide");
    playPause.querySelector(".play-btn").classList.toggle("hide");
    playPause.classList.toggle("blue"); // Cambiar el color del botón de reproducción
    playPause.classList.toggle("red");    
  }
}

function handleEndOfAudio() {
  handleAudioState(); // Manejar el estado del audio al finalizar
  // Aquí puedes agregar más acciones que deseas realizar al finalizar el audio
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