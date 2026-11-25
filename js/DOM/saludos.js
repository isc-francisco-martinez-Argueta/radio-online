const d = document;
const CABINA = "529191621276"; // WhatsApp de cabina (919 162 1276)

/**
 * Mensaje para saludos en cabina: solo a quién saludan y desde dónde se comunican.
 * Sin emojis (en los enlaces de WhatsApp a veces llegan como "�"); estilo con *negritas*.
 */
export function mensajeSaludo() {
    return [
        "*¡Hola, VOS FM 91.3!*",
        "",
        "*Saludos para:* ",
        "*Me comunico desde:* ",
    ].join("\n");
}

export const enlaceSaludo = () =>
    `https://wa.me/${CABINA}?text=${encodeURIComponent(mensajeSaludo())}`;

/** Opción "WhatsApp · Mensajes y saludos en cabina" del chat flotante. */
export default function saludos(selector = ".chat-option--wa") {
    d.querySelectorAll(selector).forEach(($a) => ($a.href = enlaceSaludo()));
}
