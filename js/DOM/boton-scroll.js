const d = document, w = window;

/**
 * Scroll to top button functionality (Versión moderna sin APIs deprecadas)
 * @param {string} btn - CSS selector for the button
 * @param {number} threshold - Scroll position to show button (default: 500px)
 */
export default function scrollTopButton(btn, threshold = 500) {
    const $scrollBtn = d.querySelector(btn);

    // Validación
    if (!$scrollBtn) {
        console.warn(`ScrollTopButton: No se encontró el elemento "${btn}"`);
        return;
    }

    // Estado para optimizar rendimiento
    let isVisible = false;
    let ticking = false;

    // Función para obtener scroll position (moderno)
    const getScrollTop = () => {
        // scrollY es el estándar moderno (antes era pageYOffset)
        return w.scrollY ?? d.documentElement.scrollTop;
    };

    // Función para actualizar visibilidad del botón
    const updateButtonVisibility = () => {
        const scrollTop = getScrollTop();
        const shouldBeVisible = scrollTop > threshold;

        if (shouldBeVisible !== isVisible) {
            isVisible = shouldBeVisible;
            $scrollBtn.classList.toggle("hidden-scroll-top", !isVisible);
        }
    };

    // Event listener optimizado con requestAnimationFrame
    w.addEventListener("scroll", () => {
        if (!ticking) {
            w.requestAnimationFrame(() => {
                updateButtonVisibility();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Click handler directo en el botón
    $scrollBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // scrollTo es el método estándar moderno
        w.scrollTo({
            behavior: "smooth",
            top: 0,
        });

        // Opcional: Trigger evento personalizado
        w.dispatchEvent(new CustomEvent('scrollToTop'));
    });

    // Inicialización: verificar posición inicial
    updateButtonVisibility();
}