const d = document;

/**
 * Botón flotante de chat (WhatsApp / Messenger).
 * Abre y cierra el menú; se cierra con Escape, al hacer clic fuera o al elegir una opción.
 * @param {string} root - selector del contenedor (.chat-float)
 */
export default function chatFlotante(root) {
    const $root = d.querySelector(root);
    if (!$root) return;

    const $btn = $root.querySelector(".chat-toggle");
    const $menu = $root.querySelector(".chat-menu");
    if (!$btn || !$menu) return;

    const setOpen = (open) => {
        $menu.hidden = !open;
        $root.classList.toggle("is-open", open);
        $btn.setAttribute("aria-expanded", String(open));
        $btn.setAttribute("aria-label", open ? "Cerrar chat" : "Abrir chat con la cabina");
        if (open) $menu.querySelector("a")?.focus();
    };

    $btn.addEventListener("click", () => setOpen($menu.hidden));

    $menu.addEventListener("click", (e) => {
        if (e.target.closest("a")) setOpen(false);
    });

    d.addEventListener("click", (e) => {
        if (!$menu.hidden && !$root.contains(e.target)) setOpen(false);
    });

    d.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !$menu.hidden) {
            setOpen(false);
            $btn.focus();
        }
    });
}
