/**
 * PWA Installation Manager v4.0
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

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.platform = detectPlatform();
        this.isIOS = this.platform.os === 'ios';
        this.uninstallCheckInterval = null;

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
            dismissedDuration: 7 * 24 * 60 * 60 * 1000,
        };

        this.init();
    }

    checkIfInstalled() {
        const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true;
        const isAndroidInstalled = document.referrer.includes('android-app://');
        return isDisplayStandalone || isIOSStandalone || isAndroidInstalled;
    }

    shouldShowCard() {
        if (this.checkIfInstalled()) return false;
        if (localStorage.getItem(this.config.installedKey) === 'true') return false;
        if (this.wasDismissedRecently()) return false;
        return true;
    }

    init() {
        // Dentro de la app instalada no se ofrece instalar nada.
        if (this.checkIfInstalled()) return;

        this.renderGuide();
        this.wireInstallControls();

        if (!this.shouldShowCard()) {
            if (localStorage.getItem(this.config.installedKey) === 'true') {
                this.startUninstallCheck();
            }
            return;
        }

        this.setupEventListeners();
        setTimeout(() => this.showCard(), this.config.showDelay);
    }

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
     * Con instalación nativa (Chrome/Edge/Samsung en Android y computadora) se muestra el botón
     * "Instalar App". Sin ella (iPhone, Safari, Firefox...) se muestran los pasos y "Entendido".
     */
    updateMode() {
        const native = !!this.deferredPrompt;
        if (this.guide) this.guide.hidden = native;
        if (this.installBtn) this.installBtn.hidden = !native;
        if (this.laterBtn) this.laterBtn.textContent = native ? 'Más tarde' : 'Entendido';
    }

    /** Controles que funcionan siempre (aunque la tarjeta se haya cerrado antes). */
    wireInstallControls() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.updateMode();
        });

        this.installBtn?.addEventListener('click', () => this.handleInstall());
        this.laterBtn?.addEventListener('click', () => this.dismissCard());
        this.closeBtn?.addEventListener('click', () => this.hideCard());

        window.addEventListener('appinstalled', () => {
            this.markAsInstalled();
            this.hideCard();
            if (this.ctaWrap) this.ctaWrap.hidden = true;
            this.showSuccessMessage();
        });

        if (this.ctaWrap && this.ctaBtn) {
            this.ctaWrap.hidden = false;
            this.ctaBtn.addEventListener('click', () => this.showCard({ force: true }));
        }
    }

    setupEventListeners() {
        window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
            if (e.matches) {
                this.markAsInstalled();
            } else {
                this.checkIfUninstalled();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkIfUninstalled();
            }
        });

        this.startUninstallCheck();
    }

    startUninstallCheck() {
        if (localStorage.getItem(this.config.installedKey) === 'true') {
            this.uninstallCheckInterval = setInterval(() => {
                this.checkIfUninstalled();
            }, 30000);
        }
    }

    checkIfUninstalled() {
        const wasMarkedAsInstalled = localStorage.getItem(this.config.installedKey) === 'true';
        if (!wasMarkedAsInstalled) return;

        const isStillInstalled = this.checkIfInstalled();
        if (!isStillInstalled) {
            this.handleUninstall();
        }
    }

    handleUninstall() {
        localStorage.removeItem(this.config.installedKey);
        localStorage.removeItem(this.config.dismissedKey);

        if (this.uninstallCheckInterval) {
            clearInterval(this.uninstallCheckInterval);
            this.uninstallCheckInterval = null;
        }

        setTimeout(() => {
            if (!this.checkIfInstalled()) {
                this.showCard();
            }
        }, 2000);
    }

    markAsInstalled() {
        localStorage.setItem(this.config.installedKey, 'true');
        localStorage.removeItem(this.config.dismissedKey);
        this.startUninstallCheck();
    }

    resetInstallState() {
        localStorage.removeItem(this.config.installedKey);
        localStorage.removeItem(this.config.dismissedKey);

        if (this.uninstallCheckInterval) {
            clearInterval(this.uninstallCheckInterval);
            this.uninstallCheckInterval = null;
        }
    }

    /** @param {{force?: boolean}} opts  force = abierto a mano desde el botón del pie */
    showCard({ force = false } = {}) {
        if (!this.card) return;
        if (force ? this.checkIfInstalled() : !this.shouldShowCard()) return;

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
        // Esto previene el error: "Blocked aria-hidden on focused element"
        if (document.activeElement && this.card.contains(document.activeElement)) {
            document.activeElement.blur();
        }

        this.card.classList.remove('show', 'animate-in');
        this.card.classList.add('hide');

        // Aplicar aria-hidden con un pequeño delay
        // para asegurar que el foco ya se removió
        setTimeout(() => {
            this.card.setAttribute('aria-hidden', 'true');
        }, 50);
    }

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

            if (outcome === 'accepted') {
                this.markAsInstalled();
            }
            this.hideCard();
            this.deferredPrompt = null;
            this.updateMode();
        } catch (error) {
            this.showErrorMessage();
        } finally {
            this.installBtn?.classList.remove('loading');
        }
    }

    wasDismissedRecently() {
        const dismissed = localStorage.getItem(this.config.dismissedKey);
        if (!dismissed) return false;

        const dismissedTime = parseInt(dismissed, 10);
        const now = Date.now();
        return (now - dismissedTime) < this.config.dismissedDuration;
    }

    markAsDismissed() {
        localStorage.setItem(this.config.dismissedKey, Date.now().toString());
    }

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
