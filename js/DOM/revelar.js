const d = document;

/**
 * Efecto al bajar: cada bloque aparece (sube y se desvanece) cuando entra en pantalla.
 *  - Se aplica a contenedores (no a las tarjetas del slider, que tienen su propia animación).
 *  - Solo se activa si hay IntersectionObserver y el usuario NO pidió "reducir movimiento";
 *    si este script no carga, todo se ve normal (nunca queda contenido oculto).
 *
 * [selector, tipo de efecto, orden dentro de su sección (para escalonar)]
 */
const BLOQUES = [
    [".plataformasradio .sec-eyebrow", "up", 0],
    [".plataformasradio .radios", "up", 1],
    [".sec-head", "up", 0],
    [".prog-slider", "zoom", 1],
    [".prog-controls", "up", 2],
    [".spon-rotator", "zoom", 1],
    [".spon-strip", "up", 2],
    [".ads-hero", "up", 1],
    [".ads-form", "up", 2],
    [".vid-main", "zoom", 1],
    [".vid-more", "up", 2],
    [".footer-brand", "up", 0],
    [".footer-social-icons", "up", 1],
    [".install-cta", "up", 2],
];
const PASO = 120; // ms entre elementos de una misma sección

export default function revelar() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const $els = [];
    BLOQUES.forEach(([sel, tipo, orden]) => {
        d.querySelectorAll(sel).forEach(($el) => {
            $el.dataset.reveal = tipo;
            $el.style.setProperty("--reveal-delay", `${orden * PASO}ms`);
            $els.push($el);
        });
    });
    if (!$els.length) return;

    const io = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-visible");
            io.unobserve(e.target); // aparece una sola vez
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    d.documentElement.classList.add("js-reveal");
    $els.forEach(($el) => io.observe($el));
}
