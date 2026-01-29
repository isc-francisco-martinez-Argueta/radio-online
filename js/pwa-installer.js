/**
 * PWA Installation Manager
 * Maneja la instalación de la PWA en diferentes dispositivos
 */

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        // Elementos del DOM
        this.card = document.getElementById('pwa-install-card');
        this.installBtn = document.getElementById('pwa-install-btn');
        this.laterBtn = document.getElementById('pwa-later-btn');
        this.closeBtn = document.getElementById('pwa-close-btn');
        this.iosInstructions = document.getElementById('pwa-ios-instructions');

        // Configuración
        this.config = {
            showDelay: 3000,              // Delay antes de mostrar (3 segundos)
            dismissedKey: 'pwa-dismissed', // LocalStorage key
            dismissedDuration: 7 * 24 * 60 * 60 * 1000, // 7 días
        };

        this.init();
    }

    init() {
        // No mostrar si ya está instalado
        if (this.isStandalone) {
            console.log('PWA: Ya está instalado');
            return;
        }

        // No mostrar si fue descartado recientemente
        if (this.wasDismissedRecently()) {
            console.log('PWA: Descartado recientemente');
            return;
        }

        // Configurar event listeners
        this.setupEventListeners();

        // Mostrar card después del delay
        setTimeout(() => this.showCard(), this.config.showDelay);
    }

    setupEventListeners() {
        // Capturar el evento beforeinstallprompt (solo Android/Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: beforeinstallprompt capturado');
            e.preventDefault();
            this.deferredPrompt = e;
        });

        // Click en botón de instalar
        this.installBtn?.addEventListener('click', () => {
            this.handleInstall();
        });

        // Click en botón "Más tarde"
        this.laterBtn?.addEventListener('click', () => {
            this.dismissCard();
        });

        // Click en botón cerrar
        this.closeBtn?.addEventListener('click', () => {
            this.dismissCard();
        });

        // Detectar si la instalación fue exitosa
        window.addEventListener('appinstalled', () => {
            console.log('PWA: Instalación exitosa');
            this.hideCard();
            this.showSuccessMessage();
        });
    }

    showCard() {
        if (!this.card) return;

        // Mostrar instrucciones de iOS si es necesario
        if (this.isIOS && this.iosInstructions) {
            this.iosInstructions.style.display = 'block';
            // Cambiar texto del botón para iOS
            const btnText = this.installBtn?.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = 'Ver instrucciones';
            }
        }

        // Mostrar card con animación
        this.card.classList.add('show', 'animate-in');

        // Anunciar para lectores de pantalla
        this.card.setAttribute('aria-hidden', 'false');
    }

    hideCard() {
        if (!this.card) return;

        this.card.classList.remove('show', 'animate-in');
        this.card.classList.add('hide');
        this.card.setAttribute('aria-hidden', 'true');
    }

    dismissCard() {
        this.hideCard();
        this.markAsDismissed();
    }

    async handleInstall() {
        // iOS: scroll to instructions
        if (this.isIOS) {
            this.iosInstructions?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });

            // Highlight instructions
            this.iosInstructions?.classList.add('highlight');
            setTimeout(() => {
                this.iosInstructions?.classList.remove('highlight');
            }, 2000);

            return;
        }

        // Android/Chrome: usar el prompt nativo
        if (!this.deferredPrompt) {
            console.warn('PWA: No hay prompt disponible');
            this.showManualInstructions();
            return;
        }

        // Mostrar loading state
        this.installBtn?.classList.add('loading');

        try {
            // Mostrar el prompt de instalación
            this.deferredPrompt.prompt();

            // Esperar la respuesta del usuario
            const { outcome } = await this.deferredPrompt.userChoice;

            console.log(`PWA: Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);

            if (outcome === 'accepted') {
                this.hideCard();
                // La instalación se completará y disparará 'appinstalled'
            } else {
                this.dismissCard();
            }

            // Limpiar el prompt
            this.deferredPrompt = null;

        } catch (error) {
            console.error('PWA: Error durante la instalación:', error);
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

        // Verificar si han pasado más de X días
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
        // Crear toast notification
        const toast = document.createElement('div');
        toast.className = `pwa-toast pwa-toast-${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        document.body.appendChild(toast);

        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 100);

        // Ocultar y eliminar
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Estilos para toast (agregar al CSS)
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

// Inyectar estilos del toast
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PWAInstaller();
    });
} else {
    new PWAInstaller();
}

// Exportar para uso manual si es necesario
window.PWAInstaller = PWAInstaller;