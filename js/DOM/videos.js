const d = document;
const API = "api/youtube.php";
const CANAL_ID = "UCGpDKxLiIPffchUMTww5Hlw";            // @VOSFM
const CANAL_URL = "https://www.youtube.com/@VOSFM";
const NUEVO_DIAS = 7;                                   // etiqueta "Nuevo" si tiene menos de una semana

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas"… + fecha completa */
function cuando(iso) {
    const f = new Date(iso);
    if (isNaN(f)) return { rel: "", abs: "" };
    const dias = Math.floor((Date.now() - f.getTime()) / 86400000);
    const rel = dias <= 0 ? "hoy" : dias === 1 ? "ayer" : dias < 7 ? `hace ${dias} días`
        : dias < 30 ? `hace ${Math.floor(dias / 7)} semana${dias < 14 ? "" : "s"}`
        : f.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
    const abs = f.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    return { rel, abs, dias };
}

/**
 * Los títulos del canal suelen venir en MAYÚSCULAS: se muestran en formato de título
 * ("Desfile 20 de Noviembre 2026 Bochil, Chiapas"). Conectores en minúscula; siglas con punto (F.C) intactas.
 */
const MENORES = new Set(["de", "del", "y", "e", "o", "u", "en", "vs", "a", "al", "con", "por", "para"]);
function formatoTitulo(t = "") {
    const letras = t.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, "");
    if (!letras || letras !== letras.toUpperCase()) return t; // ya viene con mayúsculas y minúsculas
    return t.split(/(\s+)/).map((w, i) => {
        if (/^\s+$/.test(w) || w.includes(".") || /^\d/.test(w)) return w;
        const low = w.toLowerCase();
        if (i > 0 && MENORES.has(low)) return low;
        return low.charAt(0).toUpperCase() + low.slice(1);
    }).join("");
}

export default function videos(selector = "#videos") {
    const $sec = d.querySelector(selector);
    if (!$sec) return;

    const $layout = $sec.querySelector(".vid-layout");
    const $player = $sec.querySelector(".vid-player");
    const $facade = $sec.querySelector(".vid-facade");
    const $thumb = $sec.querySelector(".vid-thumb");
    const $badge = $sec.querySelector(".vid-badge");
    const $date = $sec.querySelector(".vid-date");
    const $title = $sec.querySelector(".vid-title");
    const $btnPlay = $sec.querySelector(".vid-btn-play");
    const $btnYt = $sec.querySelector(".vid-btn-yt");
    const $list = $sec.querySelector(".vid-list");
    const $more = $sec.querySelector(".vid-more");

    let lista = [];
    let actual = null; // video mostrado; null = modo respaldo (lista de subidas del canal)

    /* ---------- Reproducir aquí (carga el reproductor solo al pedirlo) ---------- */
    function reproducir() {
        // Si la radio está sonando, se pausa para no mezclar audio
        if (window.vosPlayerState?.active) {
            d.getElementById("play")?.click();
            d.dispatchEvent(new CustomEvent("vos:aviso", {
                detail: { message: "Pausamos la radio para que veas el video. Puedes volver a encenderla cuando quieras.", type: "info" },
            }));
        }
        const src = actual
            ? `https://www.youtube-nocookie.com/embed/${actual.id}?autoplay=1&rel=0&playsinline=1`
            : `https://www.youtube-nocookie.com/embed/videoseries?list=UU${CANAL_ID.slice(2)}&autoplay=1&rel=0&playsinline=1`;
        $player.innerHTML = `<iframe src="${src}" title="${esc(actual ? actual.titulo : "Videos de VOS FM")}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
        $sec.classList.add("is-playing");
        $btnPlay.disabled = true;
    }

    /* ---------- Mostrar un video en el bloque principal ---------- */
    function mostrar(v) {
        actual = v;
        // Si se estaba reproduciendo otro, se vuelve a la miniatura
        if (!$player.contains($facade)) {
            $player.innerHTML = "";
            $player.appendChild($facade);
        }
        $sec.classList.remove("is-playing");

        // Miniatura grande (maxres); si el video no la tiene, YouTube devuelve 120×90 → usar sddefault
        $thumb.onload = () => {
            if ($thumb.naturalWidth <= 120 && !$thumb.src.includes("sddefault")) {
                $thumb.src = `https://i.ytimg.com/vi/${v.id}/sddefault.jpg`;
            }
        };
        $thumb.onerror = () => { $thumb.src = v.miniatura; };
        $thumb.src = `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`;
        $thumb.alt = `Miniatura: ${formatoTitulo(v.titulo)}`;

        const t = cuando(v.fecha);
        $badge.hidden = !(t.dias !== undefined && t.dias < NUEVO_DIAS && v === lista[0]);
        $date.innerHTML = `<i class="far fa-calendar" aria-hidden="true"></i> Publicado ${esc(t.rel)} <span class="vid-date__abs">· ${esc(t.abs)}</span>`;
        $title.textContent = formatoTitulo(v.titulo);
        $facade.setAttribute("aria-label", `Reproducir aquí: ${formatoTitulo(v.titulo)}`);
        $btnPlay.disabled = false;
        $btnYt.href = v.url;

        $list.querySelectorAll(".vid-item").forEach(($b) => {
            const on = $b.dataset.id === v.id;
            $b.classList.toggle("is-current", on);
            $b.setAttribute("aria-current", on ? "true" : "false");
        });
    }

    /* ---------- Lista de videos anteriores ---------- */
    function pintarLista() {
        const resto = lista.slice(0, 6);
        $more.hidden = resto.length < 2;
        $list.innerHTML = resto.map((v) => `
            <li>
                <button type="button" class="vid-item" data-id="${esc(v.id)}">
                    <span class="vid-item__thumb">
                        <img src="https://i.ytimg.com/vi/${esc(v.id)}/mqdefault.jpg" alt="" width="320" height="180" loading="lazy" decoding="async">
                        <span class="vid-item__play" aria-hidden="true"><i class="fas fa-play"></i></span>
                    </span>
                    <span class="vid-item__text">
                        <span class="vid-item__title">${esc(formatoTitulo(v.titulo))}</span>
                        <span class="vid-item__date">${esc(cuando(v.fecha).rel)}</span>
                    </span>
                </button>
            </li>`).join("");
    }

    $list.addEventListener("click", (e) => {
        const $b = e.target.closest(".vid-item");
        if (!$b) return;
        const v = lista.find((x) => x.id === $b.dataset.id);
        if (!v) return;
        mostrar(v);
        // En celular, sube al reproductor para que se vea el cambio
        const top = $player.getBoundingClientRect().top;
        if (top < 70 || top > window.innerHeight * 0.6) {
            $player.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });
    $facade.addEventListener("click", reproducir);
    $btnPlay.addEventListener("click", reproducir);

    /* ---------- Estados ---------- */
    function listo() {
        $layout.classList.remove("is-loading");
        $layout.removeAttribute("aria-busy");
    }

    // Respaldo: si el servicio falla, se puede ver igual la lista de subidas del canal en YouTube
    function respaldo() {
        actual = null;
        listo();
        $layout.classList.add("is-fallback");
        $more.hidden = true;
        $badge.hidden = true;
        $thumb.removeAttribute("src");
        const sinInternet = navigator.onLine === false;
        $date.innerHTML = sinInternet
            ? `<i class="fas fa-wifi" aria-hidden="true"></i> Sin conexión: los videos necesitan internet`
            : `<i class="fas fa-info-circle" aria-hidden="true"></i> No pudimos cargar la lista de videos`;
        $title.textContent = sinInternet ? "Vuelve a intentarlo con internet" : "Mira lo más nuevo de VOS FM";
        $btnPlay.disabled = false;
        $btnYt.href = CANAL_URL;
    }

    function cargar() {
        fetch(API)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((data) => {
                lista = Array.isArray(data.videos) ? data.videos : [];
                if (!lista.length) { $sec.hidden = true; return; } // estado vacío: canal sin videos
                $layout.classList.remove("is-fallback");
                listo();
                pintarLista();
                mostrar(lista[0]);
                // El menú marca "Nuevo" en Videos si el último tiene menos de una semana
                d.dispatchEvent(new CustomEvent("vos:videos", { detail: { nuevo: cuando(lista[0].fecha).dias < NUEVO_DIAS } }));
            })
            .catch(respaldo);
    }

    // Si no cargó por falta de internet, se vuelve a intentar al recuperar la conexión (sin recargar la página)
    window.addEventListener("online", () => {
        if ($layout.classList.contains("is-fallback")) cargar();
    });

    cargar();
}
