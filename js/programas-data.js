/**
 * PROGRAMAS DE VOS FM — edita aquí.
 *
 * dias:    0 = domingo, 1 = lunes, 2 = martes, 3 = miércoles, 4 = jueves, 5 = viernes, 6 = sábado
 * inicio / fin: hora de Chiapas en formato 24 h ("07:00", "13:30"). "fin" no se incluye.
 * flyer:   imagen grande (se abre al tocar la tarjeta). Recomendado 1080 × 1350 (4:5).
 * miniatura: versión chica para la tarjeta (≈ 560 × 700). Si falta, se usa "flyer".
 *            Si no hay flyer, la tarjeta muestra un diseño "Flyer próximamente".
 *
 * ⚠️  Los programas 2 a 5 son de ejemplo: cambia nombre, conductores, horario y flyer.
 */
export const PROGRAMAS = [
    {
        id: "la-manana-con-vos",
        titulo: "La Mañana con VOS",
        lema: "Información, buena música y la mejor compañía",
        conductores: "Conductores por confirmar",
        dias: [1, 2, 3, 4, 5],
        inicio: "07:00",
        fin: "10:00",
        flyer: "img/programas/la-manana-con-vos.webp",
        miniatura: "img/programas/la-manana-con-vos-thumb.webp",
    },
    {
        id: "programa-2",
        titulo: "Programa 2",
        lema: "Nombre y descripción por definir",
        conductores: "Por confirmar",
        dias: [1, 2, 3, 4, 5],
        inicio: "10:00",
        fin: "13:00",
    },
    {
        id: "programa-3",
        titulo: "Programa 3",
        lema: "Nombre y descripción por definir",
        conductores: "Por confirmar",
        dias: [1, 2, 3, 4, 5],
        inicio: "13:00",
        fin: "16:00",
    },
    {
        id: "programa-4",
        titulo: "Programa 4",
        lema: "Nombre y descripción por definir",
        conductores: "Por confirmar",
        dias: [1, 2, 3, 4, 5],
        inicio: "16:00",
        fin: "19:00",
    },
    {
        id: "programa-5",
        titulo: "Programa 5",
        lema: "Nombre y descripción por definir",
        conductores: "Por confirmar",
        dias: [6],
        inicio: "09:00",
        fin: "13:00",
    },
];
