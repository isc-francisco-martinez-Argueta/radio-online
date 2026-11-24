# Logo VOS 91.3 animado (WebP con transparencia)

Genera dos WebP animados con fondo transparente y loop infinito:

- `img/logo-vos-animado-blanco.webp`: letras blancas, para fondos oscuros.
- `img/logo-vos-animado-oscuro.webp`: letras oscuras, para fondos claros.

Se dibujan a partir de `img/logo-vos-blanco.svg` e `img/logo-vos-oscuro.svg`.

## Generar

```sh
cd tools/logo-animado
npm run build
```

Necesitas Node 18 o superior e `img2webp`. Si te falta `img2webp`, instálalo con `brew install webp`. La primera vez el comando instala solo las dependencias.

### Opciones

```sh
ANCHO=800 FPS=24 CALIDAD=75 npm run build
```

| Variable  | Por defecto | Qué cambia                                    |
|-----------|-------------|-----------------------------------------------|
| `ANCHO`   | 1000        | Ancho en píxeles (el alto es 45 % del ancho)  |
| `FPS`     | 30          | Cuadros por segundo                           |
| `CALIDAD` | 82          | Calidad de compresión (0–100); menos pesa menos |

## La animación (6 s por vuelta)

| Tiempo      | Qué pasa |
|-------------|----------|
| 0 – 1.7 s   | La V y la S se dibujan y se rellenan, la "O" aparece con rebote y "91.3" sube cifra por cifra |
| 1.8 – 5 s   | La "O" late, salen ondas de sonido y un brillo cruza el logo |
| Todo        | El degradado de la "O" da una vuelta completa, así que el loop no salta |
| 5.1 – 6 s   | Se desvanece para volver a empezar |

Los tiempos se cambian en `render.js`: busca las llamadas a `prog(t, inicio, fin)`. La duración total está en `T`.
