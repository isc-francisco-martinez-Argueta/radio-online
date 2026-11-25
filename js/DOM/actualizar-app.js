/**
 * Registra el service worker y aplica las versiones nuevas del sitio.
 *
 * - Busca actualizaciones al abrir la app y cada vez que vuelve al frente
 *   (las apps instaladas pueden quedarse abiertas días).
 * - Cuando la versión nueva toma el control, recarga la página para mostrar
 *   los estilos nuevos. Si la radio está sonando no la corta: avisa y recarga
 *   en cuanto la pausen.
 */
export default function actualizarApp(audioSelector) {
    if (!("serviceWorker" in navigator)) return;

    const sw = navigator.serviceWorker;
    const esActualizacion = Boolean(sw.controller); // sin controlador = primera instalación
    let recargando = false;

    sw.addEventListener("controllerchange", () => {
        if (!esActualizacion || recargando) return;
        const audio = document.querySelector(audioSelector);
        const sonando = audio && !audio.paused;

        if (sonando) {
            // No se corta la radio: se avisa y se aplica en cuanto la pausen.
            document.dispatchEvent(new CustomEvent("vos:aviso", {
                detail: { message: "Hay una versión nueva de la página. Se aplicará cuando pauses la radio.", type: "info", duration: 7000 },
            }));
            // Ojo: el reproductor también pausa por dentro al cambiar de canción;
            // solo se recarga si después de la pausa la radio quedó apagada.
            const alPausar = () => setTimeout(() => {
                if (recargando) return;
                if (window.vosPlayerState?.active) {
                    audio.addEventListener("pause", alPausar, { once: true });
                    return;
                }
                recargando = true;
                window.location.reload();
            }, 400);
            audio.addEventListener("pause", alPausar, { once: true });
            return;
        }

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
