/**
 * PWA Installation Manager v3.2
 * NUEVO v3.2: Correcciones de accesibilidad (ARIA, foco)
 */

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.uninstallCheckInterval = null;

        this.card = document.getElementById('pwa-install-card');
        this.installBtn = document.getElementById('pwa-install-btn');
        this.laterBtn = document.getElementById('pwa-later-btn');
        this.closeBtn = document.getElementById('pwa-close-btn');
        this.iosInstructions = document.getElementById('pwa-ios-instructions');

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
        if (!this.shouldShowCard()) {
            if (localStorage.getItem(this.config.installedKey) === 'true') {
                this.startUninstallCheck();
            }
            return;
        }

        this.setupEventListeners();
        setTimeout(() => this.showCard(), this.config.showDelay);
    }

    setupEventListeners() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });

        this.installBtn?.addEventListener('click', () => this.handleInstall());
        this.laterBtn?.addEventListener('click', () => this.dismissCard());
        this.closeBtn?.addEventListener('click', () => this.hideCard());

        window.addEventListener('appinstalled', () => {
            this.markAsInstalled();
            this.hideCard();
            this.showSuccessMessage();
        });

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

    showCard() {
        if (!this.card || !this.shouldShowCard()) return;

        if (this.isIOS && this.iosInstructions) {
            this.iosInstructions.style.display = 'block';
            const btnText = this.installBtn?.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Ver instrucciones';
        }

        // ACCESIBILIDAD: Establecer aria-hidden ANTES de mostrar
        this.card.setAttribute('aria-hidden', 'false');
        this.card.classList.remove('hide');
        this.card.classList.add('show', 'animate-in');
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
        if (this.isIOS) {
            this.iosInstructions?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.iosInstructions?.classList.add('highlight');
            setTimeout(() => this.iosInstructions?.classList.remove('highlight'), 2000);
            return;
        }

        if (!this.deferredPrompt) {
            this.showManualInstructions();
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

    showManualInstructions() {
        const message = this.isIOS
            ? 'En Safari: Toca el botón compartir y selecciona "Añadir a pantalla de inicio"'
            : 'Abre el menú del navegador y selecciona "Instalar aplicación"';
        this.showToast(message, 'info', 5000);
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

// Estilos
const toastStyles = `
.pwa-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
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
.pwa-toast-success {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
}
.pwa-toast-error {
    background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
}
.pwa-toast-info {
    background: linear-gradient(135deg, var(--blue) 0%, #1e5a9e 100%);
}
.pwa-ios-instructions.highlight {
    animation: highlight-pulse 1s ease;
}
@keyframes highlight-pulse {
    0%, 100% { background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%); }
    50% { background: linear-gradient(135deg, #d4e9ff 0%, #c2e0ff 100%); }
}
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