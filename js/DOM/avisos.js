const d = document;

const ICONOS = {
    info: "fas fa-info-circle",
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
};

/**
 * Avisos (toasts) de toda la página. Cualquier script los muestra con:
 *   document.dispatchEvent(new CustomEvent("vos:aviso", { detail: { message, type } }))
 * type: "info" | "success" | "error"
 */
export default function avisos() {
    const $stack = d.createElement("div");
    $stack.className = "vos-toast-stack";
    $stack.setAttribute("role", "status");
    $stack.setAttribute("aria-live", "polite");
    d.body.appendChild($stack);

    function cerrar($t) {
        $t.classList.remove("is-in");
        setTimeout(() => $t.remove(), 250);
    }

    d.addEventListener("vos:aviso", (e) => {
        const { message, type = "info", duration } = e.detail || {};
        if (!message) return;

        // Evita repetir el mismo mensaje si ya está en pantalla
        for (const $t of $stack.children) {
            if ($t.dataset.msg === message) return;
        }
        while ($stack.children.length >= 2) $stack.firstElementChild.remove();

        const $t = d.createElement("div");
        $t.className = `vos-toast vos-toast--${type}`;
        $t.dataset.msg = message;
        $t.innerHTML = `
            <i class="${ICONOS[type] || ICONOS.info}" aria-hidden="true"></i>
            <p></p>
            <button type="button" class="vos-toast__close" aria-label="Cerrar aviso"><i class="fas fa-times" aria-hidden="true"></i></button>`;
        $t.querySelector("p").textContent = message;
        $t.querySelector(".vos-toast__close").addEventListener("click", () => cerrar($t));
        $stack.appendChild($t);
        requestAnimationFrame(() => $t.classList.add("is-in"));

        setTimeout(() => cerrar($t), duration || (type === "error" ? 8000 : 5500));
    });
}
