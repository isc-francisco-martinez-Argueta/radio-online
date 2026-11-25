const d = document;

/**
 * Menú de la barra superior:
 *  - ☰ (celular): abre/cierra el menú con las secciones y redes.
 *    Se cierra al elegir una sección, con Escape, al tocar fuera o al pasar a pantalla grande.
 *  - Resalta la sección en la que está el usuario (en la barra y en el menú).
 *  - Pistas en el menú: programa al aire / siguiente y "Nuevo" en Videos.
 */
export default function menu() {
    const $btn = d.getElementById("menu-burger");
    const $sheet = d.getElementById("menu-sheet");
    const $nav = d.querySelector(".menu");
    if (!$btn || !$sheet || !$nav) return;

    /* ---------- Abrir / cerrar ---------- */
    const abierto = () => !$sheet.hidden;
    function abrir(si) {
        $sheet.hidden = !si;
        $nav.classList.toggle("is-open", si);
        $btn.setAttribute("aria-expanded", String(si));
        $btn.setAttribute("aria-label", si ? "Cerrar menú" : "Abrir menú");
        d.documentElement.classList.toggle("menu-abierto", si); // evita que la página se desplace detrás
        if (si) $sheet.querySelector("a")?.focus({ preventScroll: true });
    }
    $btn.addEventListener("click", () => abrir(!abierto()));
    $sheet.addEventListener("click", (e) => {
        if (e.target.closest("a[href^='#']") || e.target === $sheet) abrir(false);
    });
    d.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && abierto()) { abrir(false); $btn.focus(); }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) abrir(false); });

    /* ---------- Logo de la barra: solo cuando el logo grande ya no se ve ---------- */
    const $logoGrande = d.querySelector(".img-header .logo-fx");
    if ($logoGrande && "IntersectionObserver" in window) {
        new IntersectionObserver(([e]) => $nav.classList.toggle("show-brand", !e.isIntersecting), {
            rootMargin: "-80px 0px 0px 0px", // la barra fija tapa los primeros 80 px
        }).observe($logoGrande);
    } else {
        $nav.classList.add("show-brand");
    }

    /* ---------- Sección activa ---------- */
    const $links = [...d.querySelectorAll(".menu-links a[data-sec], .menu-sheet a[data-sec]")];
    const secciones = [...new Set($links.map((a) => a.dataset.sec))]
        .map((id) => d.getElementById(id))
        .filter(Boolean);

    function marcar(id) {
        $links.forEach((a) => {
            const on = a.dataset.sec === id;
            a.classList.toggle("is-active", on);
            if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
    }
    if ("IntersectionObserver" in window && secciones.length) {
        const visibles = new Map();
        const io = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => visibles.set(e.target.id, e.intersectionRatio));
            // La sección con más presencia en la franja central de la pantalla
            const [id] = [...visibles.entries()].sort((a, b) => b[1] - a[1])[0] || [];
            if (id && visibles.get(id) > 0) marcar(id);
        }, { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.01, 0.25, 0.5, 1] });
        secciones.forEach((s) => io.observe(s));
    }
    marcar("header");

    /* ---------- Pistas del menú ---------- */
    const $hintProg = $sheet.querySelector('[data-hint="programas"]');
    const pintarPrograma = (info = window.vosPrograma) => {
        if (!$hintProg) return;
        $hintProg.textContent = info?.actual ? `Al aire: ${info.actual.titulo}`
            : info?.siguiente ? `Sigue: ${info.siguiente.titulo}` : "";
    };
    d.addEventListener("vos:programa", (e) => pintarPrograma(e.detail));
    pintarPrograma();

    d.addEventListener("vos:videos", (e) => {
        const $h = $sheet.querySelector('[data-hint="videos"]');
        if ($h) $h.textContent = e.detail?.nuevo ? "Nuevo" : "";
    });
}
