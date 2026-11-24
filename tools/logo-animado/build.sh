#!/bin/sh
# Genera img/logo-vos-animado-blanco.webp y img/logo-vos-animado-oscuro.webp
# Requiere: Node 18+ (npm install en esta carpeta) e img2webp (brew install webp).
# Opcional: ANCHO=800 FPS=24 CALIDAD=75 npm run build
set -e
cd "$(dirname "$0")"

ANCHO="${ANCHO:-1000}"
FPS="${FPS:-30}"
CALIDAD="${CALIDAD:-82}"
DURACION=$(( (1000 + FPS / 2) / FPS ))   # ms por cuadro
IMG=../../img

command -v img2webp >/dev/null || { echo "Falta img2webp: brew install webp"; exit 1; }
[ -d node_modules ] || npm install --silent

for variante in blanco:#ffffff oscuro:#101828; do
    nombre="${variante%%:*}"
    color="${variante#*:}"
    rm -rf "cuadros-$nombre"
    node render.js "$IMG/logo-vos-$nombre.svg" "cuadros-$nombre" "$color" "$ANCHO" "$FPS"
    img2webp -loop 0 -lossy -q "$CALIDAD" -m 4 -d "$DURACION" "cuadros-$nombre"/*.png \
        -o "$IMG/logo-vos-animado-$nombre.webp"
    rm -rf "cuadros-$nombre"
done

ls -lh "$IMG"/logo-vos-animado-*.webp
