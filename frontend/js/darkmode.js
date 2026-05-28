/**
 * darkmode.js - Toggle manual de modo claro/oscuro con persistencia en localStorage.
 * El botón se inyecta como FAB flotante si no existe en el DOM.
 */
(function () {
    const STORAGE_KEY = 'of_theme';

    function prefersDark() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function isDarkActive() {
        if (document.body.classList.contains('dark-theme')) {
            return true;
        }
        if (document.body.classList.contains('light-theme')) {
            return false;
        }
        return prefersDark();
    }

    function applyTheme(theme) {
        document.body.classList.remove('dark-theme', 'light-theme');

        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'light') {
            document.body.classList.add('light-theme');
        }

        syncToggleIcon();
    }

    function syncToggleIcon() {
        const btn = document.getElementById('btn-theme-toggle');
        if (!btn) {
            return;
        }

        const icon = btn.querySelector('i');
        if (!icon) {
            return;
        }

        const dark = isDarkActive();
        icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        btn.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
    }

    function bootstrapTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === 'dark' || saved === 'light') {
            applyTheme(saved);
            return;
        }

        applyTheme(null);
    }

    function ensureToggleButton() {
        let btn = document.getElementById('btn-theme-toggle');

        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'btn-theme-toggle';
            btn.className = 'theme-fab';
            btn.setAttribute('aria-label', 'Cambiar entre modo claro y oscuro');
            btn.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
            document.body.appendChild(btn);
        } else if (!btn.classList.contains('theme-fab')) {
            btn.classList.add('theme-fab');
            if (btn.parentElement && btn.parentElement !== document.body) {
                document.body.appendChild(btn);
            }
        }

        return btn;
    }

    function initToggle() {
        const btn = ensureToggleButton();

        btn.addEventListener('click', function () {
            const nextTheme = isDarkActive() ? 'light' : 'dark';
            localStorage.setItem(STORAGE_KEY, nextTheme);
            applyTheme(nextTheme);
        });
    }

    function init() {
        bootstrapTheme();
        ensureToggleButton();
        syncToggleIcon();
        initToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
