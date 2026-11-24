/**
 * Registra el service worker y aplica las versiones nuevas del sitio.
 *
 * - Busca actualizaciones al abrir la app y cada vez que vuelve al frente
 *   (las apps instaladas pueden quedarse abiertas días).
 * - Cuando la versión nueva toma el control, recarga la página para mostrar
 *   los estilos nuevos; si la radio está sonando no la corta: la versión
 *   nueva se verá la próxima vez que abran la app.
 */
export default function actualizarApp(audioSelector) {
    if (!("serviceWorker" in navigator)) return;

    const sw = navigator.serviceWorker;
    const esActualizacion = Boolean(sw.controller); // sin controlador = primera instalación
    let recargando = false;

    sw.addEventListener("controllerchange", () => {
        const audio = document.querySelector(audioSelector);
        const sonando = audio && !audio.paused;
        if (!esActualizacion || sonando || recargando) return;

        recargando = true;
        window.location.reload();
    });

    window.addEventListener("load", async () => {
        try {
            const registro = await sw.register("./sw.js", { updateViaCache: "none" });
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "visible") registro.update();
            });
        } catch {
            // Sin service worker el sitio sigue funcionando en línea.
        }
    });
}
