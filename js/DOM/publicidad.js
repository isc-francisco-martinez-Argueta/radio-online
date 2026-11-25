const d = document;
const WHATSAPP = "524425952901"; // ventas / cotizaciones

/** Cómo se ve cada medio dentro del mensaje. */
const MEDIOS = {
    radio: "Radio 91.3 FM",
    "página web": "Página web (vosfm.com.mx)",
    Facebook: "Facebook de VOS FM",
};

/**
 * Mensaje de cotización que llega a WhatsApp.
 * Sin emojis: en los enlaces de WhatsApp a veces llegan como "�" (WhatsApp Web, escritorio,
 * algunos Android). El estilo se da con lo que WhatsApp siempre muestra bien: *negritas* y viñetas.
 * Deja espacios para que el cliente complete sus datos.
 */
export function mensajeCotizacion(medios = []) {
    const lista = medios.length
        ? medios.map((m) => `• ${MEDIOS[m] || m}`).join("\n")
        : "• Aún no lo sé, quiero conocer las opciones";

    return [
        "*¡Hola, VOS FM 91.3!*",
        "Quiero *anunciar mi negocio* con ustedes.",
        "",
        "*ME INTERESA ANUNCIARME EN:*",
        lista,
        "",
        "*Mi negocio:* ",
        "*Ubicación:* ",
        "",
        "¿Me comparten precios y paquetes disponibles? ¡Gracias!",
    ].join("\n");
}

export const enlaceCotizacion = (medios = []) =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensajeCotizacion(medios))}`;

/**
 * Sección de publicidad: un solo botón de WhatsApp.
 * El mensaje se arma con los medios marcados (radio, página web, Facebook).
 */
export default function publicidad(selector = "#ads-form") {
    // La opción "Publicidad" del chat flotante usa el mismo mensaje
    d.querySelectorAll(".chat-option--ads").forEach(($a) => ($a.href = enlaceCotizacion()));

    const $form = d.querySelector(selector);
    if (!$form) return;
    const $cta = $form.querySelector("#ads-cta");
    const $label = $form.querySelector("#ads-cta-label");
    const $checks = [...$form.querySelectorAll('input[name="medio"]')];

    function actualizar() {
        const medios = $checks.filter((c) => c.checked).map((c) => c.value);
        $cta.href = enlaceCotizacion(medios);
        $label.textContent = medios.length > 1
            ? `Cotizar ${medios.length} medios por WhatsApp`
            : "Cotizar por WhatsApp";
    }

    $form.addEventListener("change", actualizar);
    $form.addEventListener("submit", (e) => e.preventDefault()); // Enter no recarga la página
    actualizar();
}
