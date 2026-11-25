import scrollTopButton from "./DOM/boton-scroll.js?v=75";
import actualizarApp from "./DOM/actualizar-app.js?v=75";
import chatFlotante from "./DOM/chat-flotante.js?v=75";
import programas from "./DOM/programas.js?v=75";
import avisos from "./DOM/avisos.js?v=75";
import enVivo from "./DOM/en-vivo.js?v=75";
import publicidad from "./DOM/publicidad.js?v=75";
import anunciantes from "./DOM/anunciantes.js?v=75";
import saludos from "./DOM/saludos.js?v=75";
import revelar from "./DOM/revelar.js?v=75";
import videos from "./DOM/videos.js?v=75";
import menu from "./DOM/menu.js?v=75";
import conexion from "./DOM/conexion.js?v=75";

const d = document;


d.addEventListener("DOMContentLoaded", (e)=>{
    scrollTopButton("#top-btn");
    chatFlotante("#chat-float");
    avisos();
    conexion();
    enVivo();
    programas("#programas");
    menu();
    publicidad("#ads-form");
    anunciantes("#anunciantes");
    saludos(".chat-option--wa");
    videos("#videos");
    revelar();   // al final: los bloques ya existen (programas, anunciantes…)
    
})

actualizarApp("#audio");
