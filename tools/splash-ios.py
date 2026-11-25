#!/usr/bin/env python3
"""
Pantallas de inicio de la app para iPhone/iPad (apple-touch-startup-image).

iOS solo usa la imagen si mide EXACTAMENTE lo que la pantalla del modelo, por eso hay una por tamaño.
Cada imagen reproduce el primer cuadro de la pantalla de carga de index.html (#app-loader):
mismo fondo azul nocturno, mismo brillo y el logo en el mismo tamaño y posición,
para que al pasar de la imagen del sistema a la página no se note el cambio.

Uso:  python3 tools/splash-ios.py
Genera img/splash/*.png e imprime las etiquetas <link> para pegar en <head> de index.html.
Requiere Pillow (pip install pillow).
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "img" / "splash"
LOGO = RAIZ / "img" / "logo-vos-blanco@2x.png"   # PNG del logo de letras blancas (2508 × 2508)

FONDO = (8, 26, 51)          # #081A33 (paleta Azul nocturno)
BRILLO = (96, 230, 255)      # #60E6FF al 14 %, como el fondo de #app-loader
BRILLO_ALFA = 0.14

# (ancho CSS, alto CSS, densidad, modelos)
DISPOSITIVOS = [
    (440, 956, 3, "iPhone 16/17 Pro Max"),
    (420, 912, 3, "iPhone Air"),
    (402, 874, 3, "iPhone 16 Pro, 17, 17 Pro"),
    (430, 932, 3, "iPhone 14 Pro Max, 15 Plus/Pro Max, 16 Plus"),
    (393, 852, 3, "iPhone 14 Pro, 15, 15 Pro, 16"),
    (428, 926, 3, "iPhone 12/13 Pro Max, 14 Plus"),
    (390, 844, 3, "iPhone 12, 13, 14, 12/13 Pro, 16e"),
    (375, 812, 3, "iPhone X, XS, 11 Pro, 12/13 mini"),
    (414, 896, 3, "iPhone XS Max, 11 Pro Max"),
    (414, 896, 2, "iPhone XR, 11"),
    (414, 736, 3, "iPhone 6/7/8 Plus"),
    (375, 667, 2, "iPhone SE 2/3, 6/7/8"),
    (320, 568, 2, "iPhone SE (1.ª), 5s"),
    (1024, 1366, 2, "iPad Pro 12.9/13"),
    (834, 1194, 2, "iPad Pro 11, Air 11"),
    (820, 1180, 2, "iPad Air 10.9, iPad 10.ª"),
    (768, 1024, 2, "iPad 9.7, mini (anteriores)"),
    (744, 1133, 2, "iPad mini 6/7"),
]


def brillo(ancho: int, alto: int) -> Image.Image:
    """radial-gradient(60% 45% at 50% 45%, BRILLO 14 %, transparent 70%) dibujado en pequeño y escalado."""
    w = 160
    h = max(1, round(w * alto / ancho))
    capa = Image.new("RGBA", (w, h))
    px = capa.load()
    cx, cy, rx, ry = w * 0.5, h * 0.45, w * 0.6, h * 0.45
    for y in range(h):
        for x in range(w):
            d = (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) ** 0.5
            a = max(0.0, 1 - d / 0.7) * BRILLO_ALFA
            px[x, y] = (*BRILLO, round(a * 255))
    return capa.resize((ancho, alto), Image.BICUBIC)


def logo_recortado() -> Image.Image:
    im = Image.open(LOGO).convert("RGBA")
    return im.crop(im.getbbox())


def pantalla(css_w: int, css_h: int, dpr: int, logo: Image.Image) -> Image.Image:
    W, H = css_w * dpr, css_h * dpr
    img = Image.new("RGBA", (W, H), (*FONDO, 255))
    img.alpha_composite(brillo(W, H))

    # Misma geometría que #app-loader: logo min(64vw, 270px) dentro de un viewBox "30 380 1195 520",
    # luego 22 px, la barra de 3 px, 22 px y el texto (~16 px); todo centrado en vertical.
    caja_w = min(0.64 * css_w, 270)
    escala = caja_w / 1195                       # unidades del SVG → px CSS
    caja_h = 520 * escala
    total = caja_h + 22 + 3 + 22 + 16
    top = (css_h - total) / 2
    left = (css_w - caja_w) / 2

    # El contenido del logo ocupa x 42.5–1212, y 435.5–849 en coordenadas del SVG
    lx = left + (42.5 - 30) * escala
    ly = top + (435.5 - 380) * escala
    lw = (1212 - 42.5) * escala
    lh = lw * logo.height / logo.width
    marca = logo.resize((round(lw * dpr), round(lh * dpr)), Image.LANCZOS)
    img.alpha_composite(marca, (round(lx * dpr), round(ly * dpr)))

    # Barra de carga (solo el carril, como en el primer cuadro de la animación)
    bx = (css_w - 150) / 2
    by = top + caja_h + 22
    carril = Image.new("RGBA", (150 * dpr, 3 * dpr), (255, 255, 255, round(0.12 * 255)))
    img.alpha_composite(carril, (round(bx * dpr), round(by * dpr)))
    return img.convert("RGB")


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    logo = logo_recortado()
    etiquetas = []
    for css_w, css_h, dpr, modelos in DISPOSITIVOS:
        nombre = f"splash-{css_w * dpr}x{css_h * dpr}.png"
        pantalla(css_w, css_h, dpr, logo).save(SALIDA / nombre, optimize=True)
        media = (f"(device-width: {css_w}px) and (device-height: {css_h}px) and "
                 f"(-webkit-device-pixel-ratio: {dpr}) and (orientation: portrait)")
        etiquetas.append(f'    <link rel="apple-touch-startup-image" media="{media}" href="img/splash/{nombre}" /> <!-- {modelos} -->')
        print(f"  {nombre:28} {modelos}")
    print("\n".join(["", "<!-- Pegar en <head> -->", *etiquetas]))


if __name__ == "__main__":
    main()
