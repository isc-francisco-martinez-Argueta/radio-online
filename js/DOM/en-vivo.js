const d = document;

/**
 * Une el reproductor con el resto de la página:
 *  - Botones [data-player-toggle] (p. ej. "Escuchar en vivo" del programa al aire):
 *    encienden/apagan la radio y muestran el mismo estado. Solo se actualizan su .pt-icon
 *    y su .pt-label, así cada botón conserva su propio diseño.
 *      Textos por botón: data-label-idle / data-label-loading / data-label-playing
 *  - Mini reproductor de la barra (único reproductor de la página; toda la tarjeta se toca):
 *      detenido:   "Escuchar en vivo" / "● Al aire: Programa" (o "Música continua · Sigue: …")
 *      conectando: "VOS FM 91.3" / "Conectando…"
 *      sonando:    "VOS FM 91.3" / "En vivo · Programa"  (computadora: "● AL AIRE Programa" + avance)
 */
const ICONOS = {
    idle: '<i class="fas fa-play" aria-hidden="true"></i>',
    loading: '<span class="pt-spinner" aria-hidden="true"></span>',
    playing: '<i class="fas fa-pause" aria-hidden="true"></i>',
};

let ultimoEstado = { active: false, loading: false, disabled: false };
let programa = null;  // { titulo, inicio, fin, progreso } del programa al aire, o null
let siguiente = null; // { titulo, cuando } del próximo programa

const estadoDe = ({ active, loading }) => (loading ? "loading" : active ? "playing" : "idle");

export function syncPlayerToggles(estado = window.vosPlayerState || ultimoEstado) {
    ultimoEstado = { ...ultimoEstado, ...estado };
    const st = estadoDe(ultimoEstado);

    d.querySelectorAll("[data-player-toggle]").forEach(($b) => {
        // Botones que llegan vacíos (p. ej. los que dibuja programas.js)
        if (!$b.querySelector(".pt-label")) {
            $b.innerHTML = '<span class="pt-icon"></span><span class="pt-label"></span>';
        }
        const textos = {
            idle: $b.dataset.labelIdle || "Escuchar en vivo",
            loading: $b.dataset.labelLoading || "Conectando…",
            playing: $b.dataset.labelPlaying || "Pausar",
        };
        $b.dataset.state = st;
        $b.disabled = !!ultimoEstado.disabled;
        $b.setAttribute("aria-pressed", String(st !== "idle"));
        const $icon = $b.querySelector(".pt-icon"); // opcional: hay botones solo de texto
        if ($icon) $icon.innerHTML = ICONOS[st];
        $b.querySelector(".pt-label").textContent = textos[st];
    });

    pintarMiniReproductor(st);
}

function pintarMiniReproductor(st) {
    const $box = d.getElementById("background");
    const $txt = d.querySelector(".mp-status__text");
    if (!$box || !$txt) return;

    $box.classList.toggle("has-live", !!programa);
    $box.dataset.state = st;

    // Línea 1: detenido = la acción ("Escuchar en vivo"); conectando o sonando = la estación
    const $name = $box.querySelector(".mp-name");
    if ($name) $name.textContent = st === "idle" ? "Escuchar en vivo" : "VOS FM 91.3";

    // Línea 2: qué está al aire (celular siempre; computadora mientras no suena)
    const sinPrograma = siguiente ? `Música continua · Sigue: ${siguiente.titulo}` : "Música continua";
    const sinInternet = navigator.onLine === false;
    $box.classList.toggle("is-offline", sinInternet && st === "idle");
    $txt.textContent = {
        idle: sinInternet ? "Sin conexión a internet" : programa ? `Al aire: ${programa.titulo}` : sinPrograma,
        loading: "Conectando…",
        playing: programa ? `En vivo · ${programa.titulo}` : "En vivo · Música continua",
    }[st];

    // Computadora: "● AL AIRE Programa" + barra de avance 4:00 ━━●── 7:00 p.m.
    const $title = $box.querySelector(".mp-live__title");
    if ($title) $title.textContent = programa ? programa.titulo : "";
    if (programa) {
        const pct = `${Math.round(programa.progreso * 100)}%`;
        $box.querySelector(".mp-progress__ini").textContent = programa.inicio.replace(/ [ap]\.m\.$/, "");
        $box.querySelector(".mp-progress__fin").textContent = programa.fin;
        $box.querySelector(".mp-progress__track i").style.width = pct;
        d.querySelector(".menu-edge i")?.style.setProperty("width", pct); // celular: línea en el borde
    }
    d.querySelector(".menu")?.classList.toggle("has-live", !!programa);
}

export default function enVivo() {
    const $play = d.getElementById("play");

    // Toda la tarjeta del reproductor se puede tocar (no solo el botón redondo)
    d.getElementById("background")?.addEventListener("click", (e) => {
        if (!e.target.closest("#play")) $play?.click();
    });

    // Un solo lugar decide qué hace cualquier botón "Escuchar": el play del reproductor
    d.addEventListener("click", (e) => {
        const $b = e.target.closest("[data-player-toggle]");
        if (!$b || $b.disabled) return;
        e.preventDefault();
        $play?.click();
    });

    d.addEventListener("vos:player", (e) => syncPlayerToggles(e.detail));
    d.addEventListener("vos:conexion", () => syncPlayerToggles()); // se queda o vuelve internet

    const alCambiarPrograma = (info = window.vosPrograma) => {
        programa = info?.actual || null;
        siguiente = info?.siguiente || null;
        syncPlayerToggles();
    };
    d.addEventListener("vos:programa", (e) => alCambiarPrograma(e.detail));
    alCambiarPrograma();
}
