/**
 * ANUNCIANTES DE LA PÁGINA — edita aquí.
 * Si las dos listas están vacías, la sección "Nuestros anunciantes" no aparece.
 *
 * BANNERS (formato principal, rotan solos):
 *   nombre:       nombre del negocio (texto alternativo / accesibilidad)
 *   imagen:       banner horizontal 1200 × 500 px (jpg, webp o svg)
 *   imagenMovil:  opcional, versión para celular 800 × 800 px
 *   enlace:       a dónde lleva al tocarlo (WhatsApp del cliente, Facebook, página…)
 *   hasta:        opcional, fecha "AAAA-MM-DD": después de ese día deja de mostrarse
 *
 * LOGOS (formato económico, cinta en movimiento):
 *   nombre, logo (PNG/SVG con fondo transparente, ~ 300 × 100 px), enlace (opcional), hasta (opcional)
 */
export const BANNERS = [
    // {
    //     nombre: "Nombre del negocio",
    //     imagen: "img/anunciantes/negocio-banner.webp",
    //     imagenMovil: "img/anunciantes/negocio-banner-movil.webp",
    //     enlace: "https://wa.me/52XXXXXXXXXX",
    //     hasta: "2026-12-31",
    // },
];

export const LOGOS = [
    // { nombre: "Nombre del negocio", logo: "img/anunciantes/negocio-logo.png", enlace: "https://facebook.com/negocio" },
];

/* Demostración: solo se ve abriendo la página con ?demo=anunciantes (negocios ficticios). */
export const DEMO = {
    BANNERS: [
        { nombre: "Panadería La Espiga (ejemplo)", imagen: "img/anunciantes/demo/panaderia.svg", imagenMovil: "img/anunciantes/demo/panaderia-movil.svg", enlace: "#" },
        { nombre: "Taller Mecánico Rápido (ejemplo)", imagen: "img/anunciantes/demo/taller.svg", imagenMovil: "img/anunciantes/demo/taller-movil.svg", enlace: "#" },
        { nombre: "Farmacia Bienestar (ejemplo)", imagen: "img/anunciantes/demo/farmacia.svg", imagenMovil: "img/anunciantes/demo/farmacia-movil.svg", enlace: "#" },
    ],
    LOGOS: [
        { nombre: "La Espiga", logo: "img/anunciantes/demo/logo-espiga.svg" },
        { nombre: "Taller Rápido", logo: "img/anunciantes/demo/logo-taller.svg" },
        { nombre: "Bienestar", logo: "img/anunciantes/demo/logo-farmacia.svg" },
        { nombre: "Café del Valle", logo: "img/anunciantes/demo/logo-cafe.svg" },
        { nombre: "Ferre Bochil", logo: "img/anunciantes/demo/logo-ferre.svg" },
        { nombre: "Moda Chiapas", logo: "img/anunciantes/demo/logo-moda.svg" },
    ],
};
