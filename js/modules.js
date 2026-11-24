import { digitalClock } from "./DOM/reloj.js";
import scrollTopButton from "./DOM/boton-scroll.js";
import actualizarApp from "./DOM/actualizar-app.js";

const d = document;


d.addEventListener("DOMContentLoaded", (e)=>{
    digitalClock("#reloj");
    scrollTopButton("#top-btn");
    
})

actualizarApp("#audio");
