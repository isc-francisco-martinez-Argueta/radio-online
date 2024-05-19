
// Navegation Menu
let btnMenu = document.querySelector('.btn-menu');
let barIconX = document.querySelector('.btn-menu i');
let menu = document.querySelector('.list-container');
let menuContent = document.querySelector('.menu');
var activador = true;





//Scroll Efect

 let prevScrollPos = window.pageYOffset;
 let goTop = document.querySelector('.go-top');

window.onscroll = () => {
  
  //Hide & Show - Scroll Menu (Function)
  let currentScrollPos = window.pageYOffset;

  if (prevScrollPos > currentScrollPos) {
    menuContent.style.top = '0px';
    menuContent.style.transition = '0.5s';
  }else{
    menuContent.style.top = '-80px';
    menuContent.style.transition = '0.5s';
  }
  prevScrollPos = currentScrollPos;
   
}




alert('ds');

const audio = document.getElementById("audio");
  const playPause = document.getElementById("play");
  const mute = document.getElementById("muted");

playPause.addEventListener("click", () => {
  if (audio.paused || audio.ended) {
    alert('hola');
    playPause.querySelector(".pause-btn").classList.toggle("hide");
    playPause.querySelector(".play-btn").classList.toggle("hide");
    background.querySelector(".play").classList.toggle("red");
    background.querySelector(".play").classList.toggle("blue");
    audio.play();

    

  } else {


    
    audio.pause();
    playPause.querySelector(".pause-btn").classList.toggle("hide");
    playPause.querySelector(".play-btn").classList.toggle("hide");
    background.querySelector(".play").classList.toggle("blue");
    background.querySelector(".play").classList.toggle("red");

    
  }
  
  
});








