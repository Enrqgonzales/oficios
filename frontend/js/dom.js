/**
 * dom.js - Manipulación del DOM y diseño responsivo interactivo de Oficios Perú.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar menú hamburguesa
    initMobileMenu();
    // Inicializar cierre de modales generales al hacer click fuera o ESC
    initGlobalModalHandlers();
});

/**
 * Inicializa la lógica del menú responsivo (Hamburguesa)
 */
function initMobileMenu() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Buscar o inyectar el botón hamburguesa si no se encuentra
    let toggleBtn = document.getElementById('navbar-toggle');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'navbar-toggle';
        toggleBtn.className = 'navbar__toggle';
        toggleBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        
        // Insertarlo antes de las acciones del navbar
        const navbarWrapper = navbar.querySelector('.navbar__wrapper');
        const navbarActions = navbar.querySelector('.navbar__actions');
        if (navbarWrapper && navbarActions) {
            navbarWrapper.insertBefore(toggleBtn, navbarActions);
        }
    }

    const menu = document.getElementById('nav-menu');
    const actions = navbar.querySelector('.navbar__actions');

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !isExpanded);
        
        // Cambiar icono de hamburguesa a cerrar "X"
        const icon = toggleBtn.querySelector('i');
        if (isExpanded) {
            icon.className = 'fa-solid fa-bars animate-fade-in';
            if (menu) menu.classList.remove('navbar__menu--active');
            if (actions) actions.classList.remove('navbar__actions--active');
            navbar.classList.remove('navbar--expanded');
        } else {
            icon.className = 'fa-solid fa-xmark animate-fade-in';
            if (menu) menu.classList.add('navbar__menu--active');
            if (actions) actions.classList.add('navbar__actions--active');
            navbar.classList.add('navbar--expanded');
        }
    });

    // Cerrar menú si se hace click fuera del navbar o en un enlace
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            cerrarMenuMovil(toggleBtn, menu, actions, navbar);
        }
    });

    // Cerrar si se clickea un menú link
    if (menu) {
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                cerrarMenuMovil(toggleBtn, menu, actions, navbar);
            });
        });
    }
}

function cerrarMenuMovil(toggleBtn, menu, actions, navbar) {
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('i');
    // classList.contains recibe UNA sola clase: comprobamos solo "fa-xmark".
    if (icon && icon.classList.contains('fa-xmark')) {
        icon.className = 'fa-solid fa-bars';
        toggleBtn.setAttribute('aria-expanded', 'false');
        if (menu) menu.classList.remove('navbar__menu--active');
        if (actions) actions.classList.remove('navbar__actions--active');
        if (navbar) navbar.classList.remove('navbar--expanded');
    }
}

/**
 * Abre un elemento modal por ID.
 * @param {string} modalId - El ID del modal.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'flex';
    // Esperar un ciclo del event loop para agregar la clase activa y activar CSS transition
    setTimeout(() => {
        modal.classList.add('modal-active');
    }, 10);
    document.body.style.overflow = 'hidden'; // Previene scroll de fondo

    // Accesibilidad WCAG
    modal.setAttribute('aria-hidden', 'false');
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
    if (focusable.length > 0) {
        setTimeout(() => focusable[0].focus(), 100);
    }
}

/**
 * Cierra un elemento modal por ID.
 * @param {string} modalId - El ID del modal.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('modal-active');
    // Dar tiempo para animación de desvanecimiento
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Habilitar scroll
        modal.setAttribute('aria-hidden', 'true');
    }, 250);
}

/**
 * Registra manejadores para cerrar modales de forma general
 */
function initGlobalModalHandlers() {
    // Cerrar si hace click en fondo del modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-container')) {
            closeModal(e.target.id);
        }
    });

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal-container.modal-active');
            activeModals.forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

// Exportar funciones del DOM globalmente
window.DOMUtils = {
    openModal,
    closeModal,
    initMobileMenu
};
