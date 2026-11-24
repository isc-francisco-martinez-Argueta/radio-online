/**
 * PWA Installation Manager v4.1
 * v4.1: instalada = no se muestra nada; "Más tarde" = tarjeta en 7 días + botón en el pie.
 * v4.0: instrucciones de instalación según sistema y navegador
 *       (iPhone/iPad, Android, computadora; Safari, Chrome, Edge, Samsung, Firefox, Opera
 *       y navegadores internos de Facebook/Instagram/TikTok) + botón "Instalar la app" en el pie.
 * v3.2: correcciones de accesibilidad (ARIA, foco)
 */

// Ícono "Compartir" de iOS (cuadro con flecha hacia arriba)
const SHARE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7.5 7.5 12 3l4.5 4.5"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/></svg>';
const key = (content, label) => `<span class="kbd-icon" role="img" aria-label="${label}">${content}</span>`;
const SHARE = key(SHARE_SVG, 'Compartir');
const DOTS_V = key('⋮', 'menú de tres puntos');
const DOTS_H = key('•••', 'más opciones');
const BURGER = key('≡', 'menú');

/**
 * Detecta sistema, navegador y si estamos dentro de la app de Facebook/Instagram/TikTok.
 */
function detectPlatform() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS se presenta como Mac
    const isAndroid = /Android/i.test(ua);
    const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|musical_ly|TikTok|Line\//i.test(ua);

    let browser = 'other';
    if (/SamsungBrowser/i.test(ua)) browser = 'samsung';
    else if (/EdgiOS|EdgA|Edg\//.test(ua)) browser = 'edge';
    else if (/OPR\/|OPiOS|OPT\//.test(ua)) browser = 'opera';
    else if (/FxiOS|Firefox\//.test(ua)) browser = 'firefox';
    else if (/CriOS|Chrome\//.test(ua)) browser = 'chrome';
    else if (/Safari\//.test(ua)) browser = 'safari';

    return { os: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop', browser, inApp };
}

/**
 * Devuelve { icon, title, steps[], note? } con las instrucciones para este navegador.
 */
function installGuide({ os, browser, inApp }) {
    if (inApp) {
        return {
            icon: 'fas fa-external-link-alt',
            title: 'Abre la página en tu navegador',
            steps: [
                `Toca el menú ${os === 'ios' ? DOTS_H : DOTS_V} (arriba o abajo a la derecha).`,
                `Elige <strong>"Abrir en el navegador"</strong>${os === 'ios' ? ' o <strong>"Abrir en Safari"</strong>' : ''}.`,
                'Ahí te mostraremos cómo instalar la app.',
            ],
            note: 'Desde Facebook, Instagram o TikTok no se pueden instalar apps.',
        };
    }

    if (os === 'ios') {
        if (browser === 'safari') {
            return {
                icon: 'fab fa-apple',
                title: 'Instalar en iPhone o iPad (Safari)',
                steps: [
                    `Toca el botón <strong>Compartir</strong> ${SHARE}. Si no lo ves, toca primero ${DOTS_H}.`,
                    'Desliza hacia abajo y elige <strong>"Agregar a pantalla de inicio"</strong>.',
                    'Toca <strong>"Agregar"</strong> arriba a la derecha.',
                ],
            };
        }
        const where = browser === 'chrome' ? 'en la barra de direcciones (arriba a la derecha)' : 'en la barra del navegador';
        return {
            icon: 'fab fa-apple',
            title: 'Instalar en iPhone o iPad',
            steps: [
                `Toca el botón <strong>Compartir</strong> ${SHARE} ${where}.`,
                'Elige <strong>"Agregar a pantalla de inicio"</strong> (quizá debas tocar "Más" o desplazarte).',
                'Toca <strong>"Agregar"</strong>.',
            ],
            note: 'Si no aparece la opción, abre esta página en Safari.',
        };
    }

    if (os === 'android') {
        const guides = {
            chrome: [
                `Toca el menú ${DOTS_V} arriba a la derecha.`,
                'Elige <strong>"Instalar app"</strong> o <strong>"Agregar a la pantalla principal"</strong>.',
                'Confirma tocando <strong>"Instalar"</strong>.',
            ],
            samsung: [
                `Toca el menú ${BURGER} abajo a la derecha.`,
                'Elige <strong>"Añadir página a"</strong> → <strong>"Pantalla de inicio"</strong>.',
                'Confirma tocando <strong>"Añadir"</strong>.',
            ],
            firefox: [
                `Toca el menú ${DOTS_V}.`,
                'Elige <strong>"Instalar"</strong> o <strong>"Agregar a la pantalla de inicio"</strong>.',
                'Confirma tocando <strong>"Agregar"</strong>.',
            ],
            edge: [
                `Toca el menú ${DOTS_H} abajo al centro.`,
                'Elige <strong>"Agregar al teléfono"</strong> o <strong>"Instalar"</strong>.',
                'Confirma tocando <strong>"Instalar"</strong>.',
            ],
        };
        return {
            icon: 'fab fa-android',
            title: 'Instalar en Android',
            steps: guides[browser] || [
                `Abre el menú del navegador (${DOTS_V} o ${BURGER}).`,
                'Busca <strong>"Instalar app"</strong> o <strong>"Agregar a pantalla de inicio"</strong>.',
                'Confirma la instalación.',
            ],
        };
    }

    // Computadora
    if (browser === 'chrome') {
        return {
            icon: 'fab fa-chrome',
            title: 'Instalar en tu computadora (Chrome)',
            steps: [
                'Haz clic en el ícono <strong>Instalar</strong> (pantalla con flecha) al final de la barra de direcciones.',
                `Si no aparece: menú ${DOTS_V} → <strong>"Transmitir, guardar y compartir"</strong> → <strong>"Instalar página como app"</strong>.`,
                'Haz clic en <strong>"Instalar"</strong>.',
            ],
        };
    }
    if (browser === 'edge') {
        return {
            icon: 'fab fa-edge',
            title: 'Instalar en tu computadora (Edge)',
            steps: [
                `Abre el menú ${DOTS_H} arriba a la derecha.`,
                'Ve a <strong>"Aplicaciones"</strong> → <strong>"Instalar este sitio como una aplicación"</strong>.',
                'Haz clic en <strong>"Instalar"</strong>.',
            ],
        };
    }
    if (browser === 'safari') {
        return {
            icon: 'fab fa-safari',
            title: 'Instalar en tu Mac (Safari)',
            steps: [
                'En la barra de menú, abre <strong>Archivo</strong>.',
                'Elige <strong>"Agregar al Dock"</strong>.',
                'Haz clic en <strong>"Agregar"</strong>.',
            ],
            note: 'Requiere macOS Sonoma (14) o más reciente.',
        };
    }
    return {
        icon: 'fas fa-desktop',
        title: 'Tu navegador no permite instalar la app',
        steps: [
            'Abre <strong>vosfm.com.mx</strong> en Chrome, Edge o Safari.',
            'Haz clic en <strong>"Instalar la app de VOS FM"</strong> al final de la página.',
        ],
    };
}

/**
 * Reglas:
 *  - Instalada                → no se muestra ni la tarjeta ni el botón del pie.
 *  - "Más tarde" / "Entendido" / ✕ → la tarjeta vuelve a salir en 7 días;
 *                                    mientras tanto aparece el botón "Instalar la app" en el pie.
 *  - Primera visita           → sale la tarjeta (el botón del pie todavía no).
 */
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.platform = detectPlatform();

        this.card = document.getElementById('pwa-install-card');
        this.installBtn = document.getElementById('pwa-install-btn');
        this.laterBtn = document.getElementById('pwa-later-btn');
        this.closeBtn = document.getElementById('pwa-close-btn');
        this.guide = document.getElementById('pwa-guide');
        this.ctaWrap = document.getElementById('install-cta');
        this.ctaBtn = document.getElementById('install-cta-btn');

        this.config = {
            showDelay: 3000,
            dismissedKey: 'pwa-dismissed',
            installedKey: 'pwa-installed',
            dismissedDuration: 7 * 24 * 60 * 60 * 1000, // 1 semana
        };

        this.init();
    }

    /* ---------- almacenamiento (protegido: puede fallar en modo privado) ---------- */
    store(key, value) {
        try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch { /* sin almacenamiento: se comporta como primera visita */ }
    }

    read(key) {
        try { return localStorage.getItem(key); } catch { return null; }
    }

    /* ---------- estado ---------- */
    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');
    }

    isInstalled() {
        return this.isStandalone() || this.read(this.config.installedKey) === 'true';
    }

    wasDismissedRecently() {
        const dismissed = parseInt(this.read(this.config.dismissedKey) || '', 10);
        if (!dismissed) return false;
        return (Date.now() - dismissed) < this.config.dismissedDuration;
    }

    shouldShowCard() {
        return !this.isInstalled() && !this.wasDismissedRecently();
    }

    markAsInstalled() {
        this.store(this.config.installedKey, 'true');
        this.store(this.config.dismissedKey, null);
        this.refreshUI();
    }

    markAsUninstalled() {
        this.store(this.config.installedKey, null);
        this.refreshUI();
    }

    markAsDismissed() {
        this.store(this.config.dismissedKey, Date.now().toString());
        this.refreshUI();
    }

    resetInstallState() {
        this.store(this.config.installedKey, null);
        this.store(this.config.dismissedKey, null);
        this.refreshUI();
    }

    /** Botón del pie: solo si NO está instalada y eligieron "Más tarde" esta semana. */
    refreshUI() {
        if (this.ctaWrap) {
            this.ctaWrap.hidden = this.isInstalled() || !this.wasDismissedRecently();
        }
        if (this.isInstalled() && this.card?.classList.contains('show')) this.hideCard();
    }

    /* ---------- arranque ---------- */
    init() {
        // Abierta como app: queda marcada como instalada y no se ofrece nada.
        if (this.isStandalone()) {
            this.store(this.config.installedKey, 'true');
            return;
        }

        this.renderGuide();
        this.wireControls();
        this.refreshUI();
        this.detectInstalledApp();

        if (this.shouldShowCard()) {
            setTimeout(() => this.showCard(), this.config.showDelay);
        }
    }

    /**
     * Android/Chrome: pregunta al navegador si la PWA ya está instalada
     * (requiere "related_applications" en el manifest).
     */
    async detectInstalledApp() {
        if (!('getInstalledRelatedApps' in navigator)) return;
        try {
            const apps = await navigator.getInstalledRelatedApps();
            if (apps.some((a) => a.platform === 'webapp')) this.markAsInstalled();
        } catch { /* no soportado */ }
    }

    wireControls() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            // Chrome/Edge solo lanzan este evento si la app NO está instalada:
            // si estaba marcada como instalada, la desinstalaron.
            if (this.read(this.config.installedKey) === 'true') {
                this.markAsUninstalled();
                if (this.shouldShowCard()) this.showCard();
            }
            this.updateMode();
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.markAsInstalled();
            this.hideCard();
            this.showSuccessMessage();
        });

        this.installBtn?.addEventListener('click', () => this.handleInstall());
        this.laterBtn?.addEventListener('click', () => this.dismissCard());
        this.closeBtn?.addEventListener('click', () => this.dismissCard());
        this.ctaBtn?.addEventListener('click', () => this.showCard({ force: true }));
    }

    /* ---------- tarjeta ---------- */
    /** Llena la tarjeta con los pasos del navegador actual. */
    renderGuide() {
        if (!this.guide) return;
        const g = installGuide(this.platform);
        const title = this.guide.querySelector('#pwa-guide-title');
        const steps = this.guide.querySelector('#pwa-guide-steps');
        const note = this.guide.querySelector('#pwa-guide-note');

        title.innerHTML = `<i class="${g.icon}" aria-hidden="true"></i> ${g.title}`;
        steps.innerHTML = g.steps.map((s) => `<li>${s}</li>`).join('');
        if (g.note) {
            note.textContent = g.note;
            note.hidden = false;
        } else {
            note.hidden = true;
        }
    }

    /**
     * Con instalación nativa (Chrome/Edge/Samsung) se muestra el botón "Instalar App".
     * Sin ella (iPhone, Safari, Firefox...) se muestran los pasos y "Entendido".
     */
    updateMode() {
        const native = !!this.deferredPrompt;
        if (this.guide) this.guide.hidden = native;
        if (this.installBtn) this.installBtn.hidden = !native;
        if (this.laterBtn) this.laterBtn.textContent = native ? 'Más tarde' : 'Entendido';
        this.card?.classList.toggle('guide-mode', !native);
    }

    /** @param {{force?: boolean}} opts  force = abierta a mano desde el botón del pie */
    showCard({ force = false } = {}) {
        if (!this.card) return;
        if (force ? this.isInstalled() : !this.shouldShowCard()) return;

        this.updateMode();

        // ACCESIBILIDAD: Establecer aria-hidden ANTES de mostrar
        this.card.setAttribute('aria-hidden', 'false');
        this.card.classList.remove('hide');
        this.card.classList.add('show', 'animate-in');

        if (force) {
            const target = this.deferredPrompt ? this.installBtn : this.laterBtn;
            setTimeout(() => target?.focus(), 350);
        }
    }

    hideCard() {
        if (!this.card) return;

        // ACCESIBILIDAD CRÍTICA: Remover foco ANTES de aria-hidden
        if (document.activeElement && this.card.contains(document.activeElement)) {
            document.activeElement.blur();
        }

        this.card.classList.remove('show', 'animate-in');
        this.card.classList.add('hide');

        setTimeout(() => {
            this.card.setAttribute('aria-hidden', 'true');
        }, 50);
    }

    /** "Más tarde", "Entendido" o ✕: no volver a mostrarla en una semana. */
    dismissCard() {
        this.hideCard();
        this.markAsDismissed();
    }

    async handleInstall() {
        if (!this.deferredPrompt) {
            // Sin instalación nativa: resaltar los pasos.
            this.updateMode();
            this.guide?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.guide?.classList.add('highlight');
            setTimeout(() => this.guide?.classList.remove('highlight'), 1000);
            return;
        }

        this.installBtn?.classList.add('loading');

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;

            if (outcome === 'accepted') {
                this.markAsInstalled();
                this.hideCard();
            } else {
                // Cerró el diálogo del navegador: cuenta como "Más tarde".
                this.dismissCard();
            }
            this.updateMode();
        } catch (error) {
            this.showErrorMessage();
        } finally {
            this.installBtn?.classList.remove('loading');
        }
    }

    /* ---------- avisos ---------- */
    showSuccessMessage() {
        this.showToast('¡App instalada correctamente! 🎉', 'success');
    }

    showErrorMessage() {
        this.showToast('No se pudo instalar. Intenta de nuevo.', 'error');
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `pwa-toast pwa-toast-${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Estilos del aviso (toast). Colores oscuros: texto blanco con contraste ≥ 4.5:1.
const toastStyles = `
.pwa-toast {
    position: fixed;
    bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #1d2633;
    color: #fff;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 90%;
    text-align: center;
}
.pwa-toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}
.pwa-toast-success { background: #1b7a3e; }
.pwa-toast-error   { background: #b3242b; }
.pwa-toast-info    { background: #1e5a9e; }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaInstaller = new PWAInstaller();
    });
} else {
    window.pwaInstaller = new PWAInstaller();
}

window.PWAInstaller = PWAInstaller;
window.__pwaGuide = { detectPlatform, installGuide }; // para pruebas en consola
