import { BANNERS, LOGOS, DEMO } from "../anunciantes-data.js?v=75";

const d = document;
const INTERVALO = 6000;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Quita los anuncios vencidos ("hasta" ya pasó). */
const vigentes = (xs) => {
    const hoy = new Date().toISOString().slice(0, 10);
    return xs.filter((x) => !x.hasta || x.hasta >= hoy);
};

/**
 * Sección "Nuestros anunciantes": banner que rota + cinta de logos.
 * Se oculta sola si no hay anunciantes vigentes.
 */
export default function anunciantes(selector = "#anunciantes") {
    const $sec = d.querySelector(selector);
    if (!$sec) return;

    const demo = new URLSearchParams(location.search).get("demo") === "anunciantes";
    const banners = vigentes(demo ? DEMO.BANNERS : BANNERS);
    const logos = vigentes(demo ? DEMO.LOGOS : LOGOS);

    if (!banners.length && !logos.length) { $sec.hidden = true; return; } // estado vacío
    $sec.hidden = false;
    $sec.classList.toggle("is-demo", demo);

    /* ---------- Banner principal ---------- */
    const $rot = $sec.querySelector(".spon-rotator");
    const $slides = $sec.querySelector(".spon-slides");
    const $dots = $sec.querySelector(".spon-dots");

    if (!banners.length) {
        $rot.hidden = true;
    } else {
        $slides.innerHTML = banners.map((b, i) => `
            <a class="spon-slide${i === 0 ? " is-active" : ""}" href="${esc(b.enlace || "#")}"
               ${b.enlace && b.enlace !== "#" ? 'target="_blank" rel="sponsored noopener noreferrer"' : ""}
               aria-label="${esc(b.nombre)}" ${i === 0 ? "" : 'tabindex="-1" aria-hidden="true"'}>
                <picture>
                    ${b.imagenMovil ? `<source media="(max-width: 590px)" srcset="${esc(b.imagenMovil)}">` : ""}
                    <img src="${esc(b.imagen)}" alt="${esc(b.nombre)}" width="1200" height="500"
                         ${i === 0 ? "" : 'loading="lazy"'} decoding="async" draggable="false">
                </picture>
            </a>`).join("");
        const $s = [...$slides.children];
        // En celular, formato cuadrado solo si TODOS tienen versión cuadrada (si no, se recortarían)
        $slides.classList.toggle("is-square", banners.every((b) => b.imagenMovil));

        $dots.innerHTML = banners.length > 1
            ? banners.map((b, i) => `<button type="button" class="prog-dot${i === 0 ? " is-active" : ""}" aria-label="Ver anuncio de ${esc(b.nombre)}"><span class="fill"></span></button>`).join("")
            : "";
        const $d = [...$dots.children];

        let actual = 0;
        const ir = (i) => {
            actual = (i + $s.length) % $s.length;
            $s.forEach(($x, k) => {
                const on = k === actual;
                $x.classList.toggle("is-active", on);
                $x.tabIndex = on ? 0 : -1;
                $x.setAttribute("aria-hidden", String(!on));
            });
            $d.forEach(($x, k) => $x.classList.toggle("is-active", k === actual));
        };

        // Autoplay marcado por la barra de progreso (se pausa con el mouse, fuera de vista o pestaña oculta)
        const pausas = new Set();
        const pausar = (m, si) => { si ? pausas.add(m) : pausas.delete(m); $rot.classList.toggle("is-paused", pausas.size > 0); };
        $rot.style.setProperty("--prog-dur", `${INTERVALO}ms`);
        $rot.classList.toggle("no-autoplay", reduceMotion || $s.length < 2);
        $dots.addEventListener("animationend", (e) => { if (!reduceMotion && e.animationName === "prog-fill") ir(actual + 1); });
        $dots.addEventListener("click", (e) => { const $b = e.target.closest(".prog-dot"); if ($b) ir($d.indexOf($b)); });
        $rot.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pausar("mouse", true); });
        $rot.addEventListener("pointerleave", () => pausar("mouse", false));
        d.addEventListener("visibilitychange", () => pausar("oculta", d.hidden));
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(([e]) => pausar("fuera", !e.isIntersecting), { threshold: 0.3 }).observe($rot);
        }

        // Deslizar con el dedo
        let x0 = null;
        $slides.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
        $slides.addEventListener("pointerup", (e) => {
            if (x0 === null) return;
            const dx = e.clientX - x0; x0 = null;
            if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
        });
        $slides.addEventListener("click", (e) => {
            if (e.target.closest('a[href="#"]')) e.preventDefault(); // demo: no navega
        });
    }

    /* ---------- Cinta de logos ---------- */
    const $strip = $sec.querySelector(".spon-strip");
    if (!logos.length) {
        $strip.hidden = true;
    } else {
        const item = (l, dup) => {
            const img = `<img src="${esc(l.logo)}" alt="${dup ? "" : esc(l.nombre)}" height="44" loading="lazy" decoding="async">`;
            return `<li${dup ? ' aria-hidden="true"' : ""}>${l.enlace
                ? `<a href="${esc(l.enlace)}" target="_blank" rel="sponsored noopener noreferrer"${dup ? ' tabindex="-1"' : ""}>${img}</a>`
                : img}</li>`;
        };
        // Se duplica la lista para que el movimiento sea continuo
        $strip.querySelector(".spon-track").innerHTML =
            logos.map((l) => item(l, false)).join("") + logos.map((l) => item(l, true)).join("");
        $strip.style.setProperty("--spon-dur", `${Math.max(18, logos.length * 5)}s`);
    }
}
