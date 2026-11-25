import { PROGRAMAS } from "../programas-data.js?v=75";
import { syncPlayerToggles } from "./en-vivo.js?v=75";

/**
 * Sección "Nuestros programas": slider centrado con autoplay.
 *  - La tarjeta activa va al centro; las vecinas, a los lados más chicas (vuelta infinita).
 *  - Avanza solo cada INTERVALO ms (barra de progreso en los indicadores).
 *  - Se pausa con el mouse encima, al enfocar con teclado, al abrir un flyer,
 *    si la sección no está a la vista, si la pestaña está oculta o con el botón ⏸.
 *  - Deslizar con el dedo / arrastrar, flechas, teclado ← →, clic en una vecina.
 *  - "En vivo" y "Siguiente" según la hora de Chiapas.
 */
const INTERVALO = 5000;
const d = document;
const TZ = "America/Mexico_City"; // hora de Chiapas
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- tiempo ---------- */
const toMin = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

function ahora() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: Number(get("hour")) * 60 + Number(get("minute")) };
}

function hora12(hhmm, conSufijo = true) {
    let [h, m] = hhmm.split(":").map(Number);
    const sufijo = h < 12 ? "a.m." : "p.m.";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")}${conSufijo ? " " + sufijo : ""}`;
}

/** "7:00 – 10:00 a.m." (un solo a.m./p.m. si coinciden) */
function rango(p) {
    const mismo = (toMin(p.inicio) < 720) === (toMin(p.fin) <= 720);
    return `${hora12(p.inicio, !mismo)} – ${hora12(p.fin)}`;
}

function textoDias(dias) {
    const s = [...dias].sort((a, b) => a - b).join(",");
    const fijos = {
        "1,2,3,4,5": "Lunes a viernes",
        "1,2,3,4,5,6": "Lunes a sábado",
        "0,1,2,3,4,5,6": "Todos los días",
        "0,6": "Fines de semana",
    };
    if (fijos[s]) return fijos[s];
    if (dias.length === 1) return DIAS[dias[0]] + (dias[0] === 6 || dias[0] === 0 ? "s" : "");
    return dias.map((n) => DIAS[n].slice(0, 3)).join(", ");
}

/** Versión corta para la tarjeta: "Lun a Vie", "Sábados"... */
function diasCorto(dias) {
    const s = [...dias].sort((a, b) => a - b).join(",");
    const fijos = { "1,2,3,4,5": "Lun a Vie", "1,2,3,4,5,6": "Lun a Sáb", "0,1,2,3,4,5,6": "Diario", "0,6": "Sáb y Dom" };
    if (fijos[s]) return fijos[s];
    if (dias.length === 1) return textoDias(dias);
    return dias.map((n) => DIAS[n].slice(0, 3)).join(", ");
}

const estaAlAire = (p, t) =>
    p.dias.includes(t.day) && t.min >= toMin(p.inicio) && t.min < toMin(p.fin);

/** Minutos que faltan para la próxima emisión (o Infinity). */
function proximaEmision(p, t) {
    for (let k = 0; k < 8; k++) {
        const day = (t.day + k) % 7;
        const start = toMin(p.inicio);
        if (p.dias.includes(day) && (k > 0 || start > t.min)) {
            return { dias: k, falta: k * 1440 + start - t.min };
        }
    }
    return { dias: Infinity, falta: Infinity };
}

function textoCuando(p, t) {
    const { dias } = proximaEmision(p, t);
    if (dias === 0) return `Hoy · ${hora12(p.inicio)}`;
    if (dias === 1) return `Mañana · ${hora12(p.inicio)}`;
    if (dias < 8) return `${DIAS[(t.day + dias) % 7]} · ${hora12(p.inicio)}`;
    return "";
}

/* ---------- render ---------- */
const esc = (s = "") => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function tarjeta(p, i, n) {
    const img = p.miniatura || p.flyer;
    const flyer = img
        ? `<img src="${esc(img)}" alt="Flyer de ${esc(p.titulo)}" ${i < 3 ? "" : 'loading="lazy"'} decoding="async" draggable="false" width="560" height="700">`
        : `<span class="prog-placeholder" aria-hidden="true">
               <img src="img/logo-vos-blanco.svg" alt="" width="160" height="160" draggable="false">
               <span class="prog-placeholder__name">${esc(p.titulo)}</span>
               <span class="prog-placeholder__soon">Flyer próximamente</span>
           </span>`;

    return `
    <li class="prog-card" data-index="${i}" aria-roledescription="diapositiva" aria-label="${i + 1} de ${n}: ${esc(p.titulo)}">
        <button type="button" class="prog-flyer" ${img ? "" : 'aria-disabled="true"'}
                aria-label="${img ? `Ver flyer de ${esc(p.titulo)}` : esc(p.titulo)}">
            ${flyer}
            <span class="prog-badge" hidden></span>
            ${p.flyer ? '<span class="prog-zoom" aria-hidden="true"><i class="fas fa-expand"></i></span>' : ""}
        </button>
        <div class="prog-bar"></div>
    </li>`;
}

export default function programas(selector = "#programas") {
    const $sec = d.querySelector(selector);
    if (!$sec) return;
    if (!PROGRAMAS.length) { $sec.hidden = true; return; } // estado vacío: no mostrar una sección hueca

    const n = PROGRAMAS.length;
    const $slider = $sec.querySelector(".prog-slider");
    const $stage = $sec.querySelector(".prog-stage");
    const $now = $sec.querySelector(".prog-now");
    const $dots = $sec.querySelector(".prog-dots");
    const $pause = $sec.querySelector(".prog-pause");
    const $dialog = d.getElementById("flyer-dialog");

    $stage.innerHTML = PROGRAMAS.map((p, i) => tarjeta(p, i, n)).join("");
    const $cards = [...$stage.children];

    $cards.forEach(($c, i) => {
        const $img = $c.querySelector(".prog-flyer > img");
        $img?.addEventListener("error", () => {
            const p = PROGRAMAS[i];
            p.flyer = null; // no abrir un visor con imagen rota
            $img.outerHTML = `<span class="prog-placeholder" aria-hidden="true">
                <img src="img/logo-vos-blanco.svg" alt="" width="160" height="160" draggable="false">
                <span class="prog-placeholder__name">${esc(p.titulo)}</span>
                <span class="prog-placeholder__soon">Flyer no disponible</span></span>`;
            $c.querySelector(".prog-zoom")?.remove();
        }, { once: true });
    });

    $dots.innerHTML = PROGRAMAS.map((p, i) =>
        `<button type="button" class="prog-dot" data-index="${i}" aria-label="Ir a ${esc(p.titulo)}"><span class="fill"></span></button>`
    ).join("");
    const $dotList = [...$dots.children];
    $sec.style.setProperty("--prog-dur", `${INTERVALO}ms`);

    /* ---------- posición de las tarjetas ---------- */
    let activo = 0;
    const prevRel = new Array(n).fill(null);

    function relativo(i) {
        const mitad = Math.floor(n / 2);
        return ((i - activo + n + mitad) % n + n) % n - mitad; // -2..2 con 5 tarjetas
    }

    function acomodar() {
        const w = $cards[0].offsetWidth || 300;
        const movil = window.innerWidth <= 760;
        const pasos = movil ? [0, w * 0.93, w * 1.75] : [0, w * 0.8, w * 1.48];
        const escalas = [1, 0.86, 0.72];
        const opacidades = movil ? [1, 0.6, 0] : [1, 0.75, 0.35];
        const brillos = [1, 0.55, 0.4];

        $cards.forEach(($c, i) => {
            const rel = relativo(i);
            const a = Math.min(Math.abs(rel), 2);
            const lejos = Math.abs(rel) > 2;

            // Al dar la vuelta (de un extremo al otro) no se anima, para que no cruce por enfrente
            if (prevRel[i] !== null && Math.abs(rel - prevRel[i]) > 1) {
                $c.classList.add("no-anim");
                requestAnimationFrame(() => requestAnimationFrame(() => $c.classList.remove("no-anim")));
            }
            prevRel[i] = rel;

            $c.style.setProperty("--x", `${Math.sign(rel) * pasos[a]}px`);
            $c.style.setProperty("--s", escalas[a]);
            $c.style.setProperty("--o", lejos ? 0 : opacidades[a]);
            $c.style.setProperty("--b", brillos[a]);
            $c.style.setProperty("--z", 10 - a);
            $c.classList.toggle("is-active", rel === 0);
            $c.setAttribute("aria-hidden", String(lejos));
            $c.querySelectorAll("button").forEach((b) => (b.tabIndex = rel === 0 ? 0 : -1));
        });

        $dotList.forEach(($d, i) => {
            $d.classList.toggle("is-active", i === activo);
            $d.setAttribute("aria-current", i === activo ? "true" : "false");
        });
    }

    function ir(i) {
        activo = (i + n) % n;
        acomodar();
    }

    /* ---------- autoplay: lo marca la barra de progreso ---------- */
    const pausas = new Set();
    const autoplay = !reduceMotion && n > 1;
    $sec.classList.toggle("no-autoplay", !autoplay);

    function pausar(motivo, si) {
        si ? pausas.add(motivo) : pausas.delete(motivo);
        $sec.classList.toggle("is-paused", pausas.size > 0);
    }

    $dots.addEventListener("animationend", (e) => {
        if (autoplay && e.animationName === "prog-fill") ir(activo + 1);
    });

    $pause?.addEventListener("click", () => {
        const pausado = !pausas.has("usuario");
        pausar("usuario", pausado);
        $pause.setAttribute("aria-label", pausado ? "Reanudar el carrusel" : "Pausar el carrusel");
        $pause.innerHTML = `<i class="fas fa-${pausado ? "play" : "pause"}" aria-hidden="true"></i>`;
    });

    $slider.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pausar("mouse", true); });
    $slider.addEventListener("pointerleave", () => pausar("mouse", false));
    $slider.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) pausar("foco", true); });
    $slider.addEventListener("focusout", () => pausar("foco", false));
    d.addEventListener("visibilitychange", () => pausar("oculta", d.hidden));
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(([e]) => pausar("fuera", !e.isIntersecting), { threshold: 0.25 }).observe($slider);
    }

    /* ---------- navegación ---------- */
    $sec.querySelector(".prog-arrow--prev")?.addEventListener("click", () => ir(activo - 1));
    $sec.querySelector(".prog-arrow--next")?.addEventListener("click", () => ir(activo + 1));
    $dots.addEventListener("click", (e) => {
        const $d = e.target.closest(".prog-dot");
        if ($d) ir(Number($d.dataset.index));
    });
    $slider.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); ir(activo - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); ir(activo + 1); }
    });

    /* Arrastrar / deslizar */
    let x0 = null, dx = 0, arrastro = false;
    $stage.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        x0 = e.clientX; dx = 0; arrastro = false;
    });
    $stage.addEventListener("pointermove", (e) => {
        if (x0 === null) return;
        dx = e.clientX - x0;
        if (!arrastro && Math.abs(dx) > 8) {
            arrastro = true;
            $stage.classList.add("is-dragging");
            $stage.setPointerCapture?.(e.pointerId);
            pausar("arrastre", true);
        }
        if (arrastro) $stage.style.setProperty("--drag", `${dx * 0.6}px`);
    });
    const soltar = () => {
        if (x0 === null) return;
        x0 = null;
        $stage.classList.remove("is-dragging");
        $stage.style.setProperty("--drag", "0px");
        pausar("arrastre", false);
        if (arrastro && Math.abs(dx) > 50) ir(activo + (dx < 0 ? 1 : -1));
    };
    $stage.addEventListener("pointerup", soltar);
    $stage.addEventListener("pointercancel", soltar);

    /* Clics: vecina → pasa al centro; activa → abre flyer o escucha */
    $stage.addEventListener("click", (e) => {
        if (arrastro) { e.preventDefault(); arrastro = false; return; } // fue un arrastre, no un clic
        const $c = e.target.closest(".prog-card");
        if (!$c) return;
        const i = Number($c.dataset.index);
        if (i !== activo) { e.stopPropagation(); e.preventDefault(); ir(i); return; }

        if (e.target.closest("[data-player-toggle]")) return; // lo maneja en-vivo.js
        if (e.target.closest(".prog-flyer") && PROGRAMAS[i].flyer) abrir(i);
    });

    /* ---------- En vivo / Siguiente (cada minuto) ---------- */
    let enVivo = -1;
    function actualizar() {
        const t = ahora();
        enVivo = PROGRAMAS.findIndex((p) => estaAlAire(p, t));
        const siguiente = PROGRAMAS
            .map((p, i) => ({ i, ...proximaEmision(p, t) }))
            .filter((x) => x.i !== enVivo)
            .sort((a, b) => a.falta - b.falta)[0]?.i ?? -1;

        $cards.forEach(($c, i) => {
            const p = PROGRAMAS[i];
            const live = i === enVivo;
            $c.classList.toggle("is-live", live);
            $c.classList.toggle("is-next", i === siguiente);

            const $badge = $c.querySelector(".prog-badge");
            $badge.hidden = !(live || i === siguiente);
            $badge.className = "prog-badge " + (live ? "prog-badge--live" : "prog-badge--next");
            $badge.innerHTML = live ? '<span class="dot"></span>En vivo' : "Siguiente";

            $c.querySelector(".prog-bar").innerHTML = live
                ? '<button type="button" class="prog-listen" data-player-toggle></button>'
                : `<span class="prog-bar__time"><i class="far fa-clock" aria-hidden="true"></i>${diasCorto(p.dias)} · ${rango(p)}</span>`;
        });

        if ($now) {
            const i = enVivo >= 0 ? enVivo : siguiente;
            const p = PROGRAMAS[i];
            if (p) {
                $now.dataset.index = i;
                $now.className = "prog-now" + (enVivo >= 0 ? " prog-now--live" : "");
                $now.innerHTML = enVivo >= 0
                    ? `<span class="dot"></span><span><small>Al aire ahora</small><strong>${esc(p.titulo)}</strong></span><span class="prog-now__time">hasta ${hora12(p.fin)}</span>`
                    : `<i class="far fa-clock" aria-hidden="true"></i><span><small>Siguiente programa</small><strong>${esc(p.titulo)}</strong></span><span class="prog-now__time">${textoCuando(p, t)}</span>`;
            }
        }
        syncPlayerToggles();
        acomodar(); // los botones nuevos respetan el tabIndex de la tarjeta

        // Lo que usan la barra del reproductor y el menú: título, horario, avance (0–1) y cuándo sale
        const info = (i) => {
            if (i < 0) return null;
            const p = PROGRAMAS[i];
            const ini = toMin(p.inicio), fin = toMin(p.fin);
            return {
                titulo: p.titulo,
                inicio: hora12(p.inicio),
                fin: hora12(p.fin),
                progreso: i === enVivo ? Math.min(1, Math.max(0, (t.min - ini) / (fin - ini))) : 0,
                cuando: textoCuando(p, t), // "Mañana · 7:00 a.m."
            };
        };
        window.vosPrograma = { actual: info(enVivo), siguiente: info(siguiente) };
        d.dispatchEvent(new CustomEvent("vos:programa", { detail: window.vosPrograma }));
        return { enVivo, siguiente };
    }

    // La píldora "Al aire / Siguiente" lleva a esa tarjeta
    $now?.addEventListener("click", () => {
        if ($now.dataset.index) ir(Number($now.dataset.index));
    });

    /* ---------- Visor del flyer ---------- */
    const conFlyer = PROGRAMAS.map((p, i) => (p.flyer ? i : -1)).filter((i) => i >= 0);
    let enVisor = -1;
    function abrir(i) {
        if (!$dialog) return;
        const p = PROGRAMAS[i];
        enVisor = i;
        const $img = $dialog.querySelector(".flyer-dialog__img");
        const $fig = $dialog.querySelector(".flyer-dialog__figure");
        if ($img.getAttribute("src") !== p.flyer) {
            $fig.classList.remove("is-error");
            $fig.classList.add("is-loading");
            $img.onload = () => $fig.classList.remove("is-loading");
            $img.onerror = () => { $fig.classList.remove("is-loading"); $fig.classList.add("is-error"); };
            $img.src = p.flyer;
        }
        $img.alt = `Flyer de ${p.titulo}`;
        $dialog.querySelector(".flyer-dialog__title").textContent = p.titulo;
        $dialog.querySelector(".flyer-dialog__meta").textContent = `${textoDias(p.dias)} · ${rango(p)}`;
        $dialog.querySelectorAll(".flyer-dialog__nav").forEach((b) => (b.hidden = conFlyer.length < 2));
        if (!$dialog.open) { $dialog.showModal(); pausar("visor", true); }
    }
    function mover(dir) {
        const pos = conFlyer.indexOf(enVisor);
        abrir(conFlyer[(pos + dir + conFlyer.length) % conFlyer.length]);
    }
    if ($dialog) {
        $dialog.querySelector(".flyer-dialog__close")?.addEventListener("click", () => $dialog.close());
        $dialog.querySelector(".flyer-dialog__nav--prev")?.addEventListener("click", () => mover(-1));
        $dialog.querySelector(".flyer-dialog__nav--next")?.addEventListener("click", () => mover(1));
        $dialog.addEventListener("click", (e) => { if (e.target === $dialog) $dialog.close(); });
        $dialog.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") mover(-1);
            if (e.key === "ArrowRight") mover(1);
        });
        $dialog.addEventListener("close", () => {
            pausar("visor", false);
            if (enVisor >= 0) ir(enVisor); // al cerrar, el slider queda en el último flyer visto
        });
    }

    /* ---------- arranque ---------- */
    const { enVivo: vivo, siguiente } = actualizar();
    activo = vivo >= 0 ? vivo : Math.max(0, siguiente); // empieza en el programa al aire
    $cards.forEach(($c) => $c.classList.add("no-anim"));
    acomodar();
    requestAnimationFrame(() => requestAnimationFrame(() => $cards.forEach(($c) => $c.classList.remove("no-anim"))));

    window.addEventListener("resize", acomodar);
    setInterval(actualizar, 60 * 1000);
}
