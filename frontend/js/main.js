/**
 * main.js - Lógica global de Negocio, validación estricta de formularios y llamadas a API para Oficios Perú.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar validación del Log In
    initLoginForm();

    // Inicializar validación de Registro de cuenta
    initRegisterForm();

    // Inicializar formulario de publicar oficio
    initOfrecerForm();

    // Inicializar búsqueda rápida del hero en la página de inicio
    initHeroSearchForm();

    // Inicializar el Catálogo de Técnicos (si estamos en la página de catálogo u home)
    initCatalogLogic();

    // Inicializar la página de perfil del técnico (producto.html?id=N)
    initProductoPage();

    // Reflejar sesión activa en la barra de navegación
    initAuthNav();

    // Si ya hay sesión, no mostrar pantallas de login/registro
    redirigirSiYaAutenticado();
});

/**
 * Valida de manera estricta el formulario de inicio de sesión
 */
function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Quitar errores previos
        clearFormErrors(form);

        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-pass');
        const successMsg = document.getElementById('success-msg');
        
        let hasError = false;

        // Validar Email
        if (!emailInput || !emailInput.value || !validateEmail(emailInput.value)) {
            showInputError(emailInput, 'Por favor, ingrese un correo electrónico válido.');
            hasError = true;
        }

        // Validar Contraseña
        if (!passInput || !passInput.value || passInput.value.length < 8) {
            showInputError(passInput, 'La contraseña debe tener mínimo 8 caracteres.');
            hasError = true;
        }

        if (hasError) return;

        // Mostrar spinner de carga si existe o deshabilitar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Validando credenciales...';

        try {
            const emailNormalizado = emailInput.value.trim().toLowerCase();
            const res = await window.ApiService.login(emailNormalizado, passInput.value);

            if (!res) {
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(successMsg, 'No se pudo conectar con el servidor. Verifique que Apache y MySQL estén activos.', 'error');
                }
                return;
            }

            if (res.success) {
                if (res.user) {
                    guardarSesionUsuario(res.user);
                }
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(successMsg, res.message || '¡Sesión iniciada con éxito!', 'exito');
                }
                setTimeout(() => {
                    window.location.href = resolverRedirectLogin(res.user, res.redirect);
                }, 1500);
            } else {
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(successMsg, res.message || 'Credenciales incorrectas.', 'error');
                }
            }
        } catch (err) {
            console.error('Error enviando Login:', err);
            if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(successMsg, err.message || 'Error inesperado al iniciar sesión. Intente nuevamente.', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

/**
 * Valida de manera estricta el formulario de registro de cuenta
 */
function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        clearFormErrors(form);

        const nameInput = document.getElementById('reg-name');
        const emailInput = document.getElementById('reg-email');
        const phoneInput = document.getElementById('reg-phone');
        const passInput = document.getElementById('reg-pass');
        const termsCheck = document.getElementById('reg-terms');
        const selectDepartamento = document.getElementById('departamento');
        const selectProvincia = document.getElementById('provincia');
        const selectDistrito = document.getElementById('distrito');
        const errorRegMsg = document.getElementById('success-reg-msg');

        let hasError = false;

        // Validar Nombre
        if (!nameInput || !nameInput.value.trim() || nameInput.value.trim().length < 4) {
            showInputError(nameInput, 'Ingrese su nombre y apellido completo (mínimo 4 caracteres).');
            hasError = true;
        }

        // Validar Email
        if (!emailInput || !emailInput.value || !validateEmail(emailInput.value)) {
            showInputError(emailInput, 'Por favor, ingrese un correo de contacto válido.');
            hasError = true;
        }

        // Validar Celular (9 dígitos en Perú, iniciando con 9)
        const phoneClean = phoneInput ? phoneInput.value.replace(/\s+/g, '') : '';
        if (!phoneInput || !/^9\d{8}$/.test(phoneClean)) {
            showInputError(phoneInput, 'Debe ingresar un número de celular de 9 dígitos que comience con 9 (Formato: 9XXXXXXXX).');
            hasError = true;
        }

        // Validar Contraseña
        if (!passInput || !passInput.value || passInput.value.length < 8) {
            showInputError(passInput, 'La contraseña debe contener al menos 8 caracteres (letras y números sugerido).');
            hasError = true;
        }

        // Validar ubicación (ubigeo en cascada)
        if (!selectDepartamento || !selectDepartamento.value) {
            showInputError(selectDepartamento, 'Seleccione su departamento de residencia.');
            hasError = true;
        }

        if (!selectProvincia || !selectProvincia.value) {
            showInputError(selectProvincia, 'Seleccione su provincia.');
            hasError = true;
        }

        if (!selectDistrito || !selectDistrito.value) {
            showInputError(selectDistrito, 'Seleccione su distrito.');
            hasError = true;
        }

        // Validar Términos
        if (!termsCheck || !termsCheck.checked) {
            if (termsCheck) termsCheck.classList.add('input-error');
            hasError = true;
        }

        if (hasError) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Registrando usuario...';

        const userData = {
            rol: 'client',
            nombre: nameInput.value.trim(),
            email: emailInput.value.trim().toLowerCase(),
            celular: phoneClean,
            password: passInput.value,
            departamento: selectDepartamento.value,
            provincia: selectProvincia.value,
            distrito: selectDistrito.value
        };

        try {
            const res = await window.ApiService.registrar(userData);

            if (!res) {
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(errorRegMsg, 'No se pudo conectar con el servidor. Verifique que Apache y MySQL estén activos.', 'error');
                }
                return;
            }

            if (res.success) {
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(errorRegMsg, res.message || '¡Cuenta registrada con éxito!', 'exito');
                }
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1800);
            } else {
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(errorRegMsg, res.message || 'Ya existe un usuario con este correo.', 'error');
                }
            }
        } catch (err) {
            console.error('Error registrando:', err);
            if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(errorRegMsg, err.message || 'Error inesperado al registrar la cuenta. Intente nuevamente.', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

/**
 * Valida el formulario de búsqueda rápida del hero antes de redirigir al catálogo.
 */
function initHeroSearchForm() {
    const formularioBusqueda = document.getElementById('hero-search-form');
    if (!formularioBusqueda) {
        return;
    }

    const contenedorError = document.getElementById('error-search');

    formularioBusqueda.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const selectDepartamento = document.getElementById('departamento');
        const selectProvincia = document.getElementById('provincia');
        const selectDistrito = document.getElementById('distrito');
        const inputOficio = document.getElementById('input-oficio');

        let hayError = false;

        if (window.ApiUI) {
            window.ApiUI.ocultarAlerta(contenedorError);
        }

        if (!selectDepartamento || !selectDepartamento.value) {
            hayError = true;
        }

        if (!selectProvincia || !selectProvincia.value) {
            hayError = true;
        }

        if (!selectDistrito || !selectDistrito.value) {
            hayError = true;
        }

        if (!inputOficio || !inputOficio.value.trim()) {
            hayError = true;
        }

        if (hayError) {
            if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(
                    contenedorError,
                    'Por favor, seleccione departamento, provincia, distrito y el oficio que necesita.',
                    'error'
                );
            }
            return;
        }

        // Construir URL con parámetros GET hacia el catálogo
        const parametros = new URLSearchParams();
        parametros.append('departamento', selectDepartamento.value);
        parametros.append('provincia', selectProvincia.value);
        parametros.append('distrito', selectDistrito.value);
        parametros.append('oficio', inputOficio.value.trim());

        window.location.href = formularioBusqueda.action + '?' + parametros.toString();
    });
}

/**
 * Valida y envía el formulario para publicar un oficio como técnico.
 */
function initOfrecerForm() {
    const form = document.getElementById('ofrecer-form');
    if (!form) {
        return;
    }

    const usuario = obtenerSesionUsuario();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        clearFormErrors(form);

        const selectOficio = document.getElementById('ofrecer-oficio');
        const selectDepartamento = document.getElementById('departamento');
        const selectProvincia = document.getElementById('provincia');
        const selectDistrito = document.getElementById('distrito');
        const textareaDesc = document.getElementById('ofrecer-desc');
        const inputFoto = document.getElementById('ofrecer-foto');
        const alerta = document.getElementById('ofrecer-alert');

        let hayError = false;

        if (!selectOficio || !selectOficio.value) {
            showInputError(selectOficio, 'Seleccione su oficio o especialidad.');
            hayError = true;
        }

        if (!selectDepartamento || !selectDepartamento.value) {
            showInputError(selectDepartamento, 'Seleccione su departamento.');
            hayError = true;
        }

        if (!selectProvincia || !selectProvincia.value) {
            showInputError(selectProvincia, 'Seleccione su provincia.');
            hayError = true;
        }

        if (!selectDistrito || !selectDistrito.value) {
            showInputError(selectDistrito, 'Seleccione su distrito.');
            hayError = true;
        }

        if (!textareaDesc || textareaDesc.value.trim().length < 20) {
            showInputError(textareaDesc, 'La descripción debe tener al menos 20 caracteres.');
            hayError = true;
        }

        if (inputFoto && inputFoto.files && inputFoto.files.length > 0) {
            const archivo = inputFoto.files[0];
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

            if (!tiposPermitidos.includes(archivo.type)) {
                showInputError(inputFoto, 'Formato no permitido. Use JPG, PNG o WEBP.');
                hayError = true;
            } else if (archivo.size > 2 * 1024 * 1024) {
                showInputError(inputFoto, 'La foto no debe superar los 2 MB.');
                hayError = true;
            }
        }

        if (hayError) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const textoOriginal = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Publicando oficio...';

        const formData = new FormData();
        formData.append('id_usuario', usuario.id);
        formData.append('oficio', selectOficio.value);
        formData.append('departamento', selectDepartamento.value);
        formData.append('provincia', selectProvincia.value);
        formData.append('distrito', selectDistrito.value);
        formData.append('descripcion', textareaDesc.value.trim());

        if (inputFoto && inputFoto.files && inputFoto.files.length > 0) {
            formData.append('foto', inputFoto.files[0]);
        }

        try {
            const respuesta = await window.ApiService.ofrecerServicio(formData);

            if (!respuesta) {
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(alerta, 'No se pudo conectar con el servidor. Verifique que Apache y MySQL estén activos.', 'error');
                }
                return;
            }

            if (respuesta.success) {
                const usuarioActualizado = Object.assign({}, usuario, {
                    rol: 'tech',
                    departamento: selectDepartamento.value,
                    provincia: selectProvincia.value,
                    distrito: selectDistrito.value
                });
                guardarSesionUsuario(usuarioActualizado);

                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(alerta, respuesta.message || '¡Oficio publicado con éxito!', 'exito');
                }

                setTimeout(() => {
                    window.location.href = 'catalogo.html';
                }, 1800);
            } else if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(alerta, respuesta.message || 'No se pudo publicar el oficio.', 'error');
            }
        } catch (error) {
            console.error('Error publicando oficio:', error);
            if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(alerta, error.message || 'Error inesperado al publicar el oficio.', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = textoOriginal;
        }
    });
}

/**
 * Lee parámetros GET de la URL actual y los devuelve como objeto.
 */
function leerParametrosURL() {
    const parametrosURL = new URLSearchParams(window.location.search);
    const resultado = {};

    parametrosURL.forEach(function(valor, clave) {
        resultado[clave] = valor;
    });

    return resultado;
}

/**
 * Lógica del buscador y catálogo técnico de Oficios Perú en tiempo real con fetch()
 */
function initCatalogLogic() {
    const isCatalogPage = window.location.pathname.includes('catalogo.html');
    const featuredGrid = document.getElementById('featured-catalog-grid');
    
    // Almacenar el template HTML de la tarjeta de técnicos para consistencia
    const getTechCardHTML = (tech) => {
        const isOnline = parseInt(tech.online) === 1 || tech.online === true;
        const estadoLabel = isOnline ? 'En Línea' : 'Ausente';
        const estadoDotStyle = isOnline ? '' : 'background-color: #9E9E9E; animation: none;';
        const estadoBadgeStyle = isOnline ? '' : 'background-color: rgba(0,0,0,0.85);';
        const rating = parseFloat(tech.valoracion || 5.0).toFixed(1);
        const ratingCount = tech.resenas || 10;

        // Botón que lleva al perfil del técnico (producto.html?id=N).
        // El técnico en línea destaca en color primario; el ausente, en contorno.
        const perfilUrl = window.location.pathname.includes('/frontend/pages/')
            ? 'producto.html'
            : 'frontend/pages/producto.html';
        const claseBoton = isOnline ? 'btn--primary' : 'btn--outline';
        const buttonHTML = `<a class="btn ${claseBoton} card-tech__btn" style="width: 100%; border-radius: var(--radius-sm); font-weight:500;" href="${perfilUrl}?id=${tech.id}">Ver perfil</a>`;

        const perfilDefault = window.location.pathname.includes('/frontend/pages/')
            ? '../assets/img/perfil.jpg'
            : 'frontend/assets/img/perfil.jpg';
        const subioFoto = tech.imagen && tech.imagen.indexOf('/uploads/') !== -1;
        const imageSrc = subioFoto ? tech.imagen : perfilDefault;

        return `
            <article class="card-tech animate-fade-in">
                <div class="card-tech__img-container">
                    <img class="card-tech__img" src="${imageSrc}" alt="${tech.nombre}" loading="lazy">
                    <span class="card-tech__status" style="${estadoBadgeStyle}">
                        <span class="card-tech__status-dot" style="${estadoDotStyle}"></span>${estadoLabel}
                    </span>
                    <span class="card-tech__badge">${tech.especialidad}</span>
                </div>
                <div class="card-tech__body">
                    <div class="card-tech__header">
                        <h3 class="card-tech__name">${tech.nombre}</h3>
                        <div class="card-tech__rating">
                            <i class="fa-solid fa-star"></i>
                            <span>${rating}</span>
                            <span class="card-tech__rating-count">(${ratingCount})</span>
                        </div>
                    </div>
                    <div class="card-tech__location">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${tech.ciudad || 'Lima'}, ${tech.distrito || ''}</span>
                    </div>
                    <p class="card-tech__text">${tech.descripcion || ''}</p>
                    <div class="card-tech__tags">
                        ${(tech.tags || '').split(',').map(tag => `<span class="card-tech__tag">${tag.trim()}</span>`).join('')}
                    </div>
                    ${buttonHTML}
                </div>
            </article>
        `;
    };

    if (isCatalogPage) {
        // Cargar técnicos dinámicamente con los filtros de la URL o formulario
        const filterForm = document.getElementById('filter-form');
        const gridContainer = document.querySelector('.catalog-grid');
        const parametrosEntrada = leerParametrosURL();

        // Si venimos desde el hero con parámetros GET, preseleccionar el filtro de departamento
        if (parametrosEntrada.departamento) {
            const filtroDepartamento = document.getElementById('filter-dep');
            if (filtroDepartamento) {
                const opciones = filtroDepartamento.options;
                for (let i = 0; i < opciones.length; i++) {
                    if (opciones[i].value.toLowerCase() === parametrosEntrada.departamento.toLowerCase()) {
                        filtroDepartamento.value = opciones[i].value;
                        break;
                    }
                }
                // Si no hay opción exacta, agregar una temporal con el valor recibido
                if (!filtroDepartamento.value) {
                    const opcionNueva = document.createElement('option');
                    opcionNueva.value = parametrosEntrada.departamento;
                    opcionNueva.textContent = parametrosEntrada.departamento;
                    opcionNueva.selected = true;
                    filtroDepartamento.appendChild(opcionNueva);
                }
            }
        }

        const loadFilteredData = async () => {
            if (!gridContainer) return;
            
            gridContainer.innerHTML = `
                <div class="w-full text-center py-5 col-span-3" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-accent); margin-bottom: 0.5rem;"></i>
                    <p class="text-muted" style="font-size:0.9rem;">Buscando técnicos calificados en la base de datos...</p>
                </div>
            `;

            const filtros = {
                departamento: document.getElementById('filter-dep') ? document.getElementById('filter-dep').value : '',
                categoria: document.getElementById('filter-cat') ? document.getElementById('filter-cat').value : '',
                rating: document.getElementById('filter-rating') ? document.getElementById('filter-rating').value : ''
            };

            const res = await window.ApiService.obtenerTecnicos(filtros);

            if (res && res.success && res.data && res.data.length > 0) {
                let listaTecnicos = res.data;

                // Filtrado adicional por oficio si llegó desde el hero (búsqueda por texto)
                if (parametrosEntrada.oficio) {
                    const textoOficio = parametrosEntrada.oficio.toLowerCase();
                    listaTecnicos = listaTecnicos.filter(function(tech) {
                        const especialidad = (tech.especialidad || '').toLowerCase();
                        const descripcion = (tech.descripcion || '').toLowerCase();
                        const tags = (tech.tags || '').toLowerCase();
                        return especialidad.indexOf(textoOficio) !== -1
                            || descripcion.indexOf(textoOficio) !== -1
                            || tags.indexOf(textoOficio) !== -1;
                    });
                }

                if (listaTecnicos.length > 0) {
                    gridContainer.innerHTML = listaTecnicos.map(tech => getTechCardHTML(tech)).join('');
                } else {
                    gridContainer.innerHTML = `
                        <div class="text-center py-5 w-full col-span-3" style="grid-column: 1 / -1; padding: 4rem 1rem;">
                            <i class="fa-solid fa-face-frown fa-3x mb-3" style="color:var(--text-secondary);"></i>
                            <h3 class="font-semibold text-xl">Sin resultados para "${parametrosEntrada.oficio || 'su búsqueda'}"</h3>
                            <p class="text-muted mt-1" style="font-size:0.9rem;">Intente cambiar los filtros o buscar otro oficio.</p>
                        </div>
                    `;
                }
            } else {
                gridContainer.innerHTML = `
                    <div class="text-center py-5 w-full col-span-3" style="grid-column: 1 / -1; padding: 4rem 1rem;">
                        <i class="fa-solid fa-face-frown fa-3x mb-3" style="color:var(--text-secondary);"></i>
                        <h3 class="font-semibold text-xl">Sin resultados coincidentes</h3>
                        <p class="text-muted mt-1" style="font-size:0.9rem;">Intente cambiar los filtros para encontrar más profesionales.</p>
                    </div>
                `;
            }
        };

        // Escuchar cambios en los filtros para recarga dinámica automática
        if (filterForm) {
            const selects = filterForm.querySelectorAll('select');
            selects.forEach(select => {
                select.addEventListener('change', loadFilteredData);
            });
            
            // Reemplazar el botón onclick del mockup
            const btnFilter = filterForm.querySelector('button');
            if (btnFilter) {
                btnFilter.removeAttribute('onclick');
                btnFilter.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadFilteredData();
                });
            }
        }

        // Cargar inmediatamente
        loadFilteredData();
        
    } else if (featuredGrid) {
        // En Home - cargar los destacados de la base de datos
        const loadHomeFeatured = async () => {
            const res = await window.ApiService.obtenerTecnicos({ rating: '4.8' });
            if (res && res.success && res.data && res.data.length > 0) {
                const featured = res.data.slice(0, 3);
                featuredGrid.innerHTML = featured.map(tech => getTechCardHTML(tech)).join('');
            }
        };
        loadHomeFeatured();
    }
}

/**
 * Página de perfil del técnico (producto.html?id=N).
 * Lee el id de la URL y trae del API el técnico, sus servicios y sus reseñas.
 * Solo se ejecuta si la página contiene el contenedor #perfil-contenido.
 */
function initProductoPage() {
    const contenido = document.getElementById('perfil-contenido');
    if (!contenido) {
        return;
    }

    const loading = document.getElementById('perfil-loading');
    const errorBox = document.getElementById('perfil-error');
    const errorMsg = document.getElementById('perfil-error-msg');

    const mostrarError = (mensaje) => {
        if (loading) loading.style.display = 'none';
        contenido.style.display = 'none';
        if (errorBox) errorBox.style.display = 'flex';
        if (errorMsg) errorMsg.textContent = mensaje;
    };

    const idTecnico = parseInt(leerParametrosURL().id, 10);

    if (!idTecnico || idTecnico <= 0) {
        mostrarError('No se indicó un técnico válido. Vuelve al catálogo y elige un perfil.');
        return;
    }

    cargarPerfilTecnico(idTecnico, { loading, contenido, mostrarError });
}

/**
 * Trae el técnico principal, pinta su cabecera y dispara la carga de servicios y reseñas.
 */
async function cargarPerfilTecnico(idTecnico, ui) {
    let respuesta;
    try {
        respuesta = await window.ApiService.obtenerTecnico(idTecnico);
    } catch (error) {
        ui.mostrarError('No se pudo conectar con el servidor. Verifique que Apache y MySQL estén activos.');
        return;
    }

    if (!respuesta || !respuesta.success || !respuesta.data) {
        ui.mostrarError((respuesta && respuesta.message) || 'No se encontró el técnico solicitado.');
        return;
    }

    pintarCabeceraTecnico(respuesta.data);
    pintarContactoTecnico(respuesta.data);

    if (ui.loading) ui.loading.style.display = 'none';
    ui.contenido.style.display = 'grid';

    cargarServiciosTecnico(idTecnico);
    cargarResenasTecnico(idTecnico);
    initResenaForm(idTecnico);
}

/**
 * Rellena foto, nombre, especialidad, ubicación, valoración y estado del técnico.
 */
function pintarCabeceraTecnico(tecnico) {
    const subioFoto = tecnico.imagen && tecnico.imagen.indexOf('/uploads/') !== -1;
    const imagen = subioFoto ? tecnico.imagen : '../assets/img/perfil.jpg';
    const rating = parseFloat(tecnico.valoracion || 5.0).toFixed(1);
    const totalResenas = parseInt(tecnico.resenas, 10) || 0;
    const online = parseInt(tecnico.online, 10) === 1;

    const img = document.getElementById('perfil-img');
    if (img) {
        img.src = imagen;
        img.alt = (tecnico.nombre || 'Técnico') + ' — ' + (tecnico.especialidad || '');
    }

    asignarTexto('perfil-nombre', tecnico.nombre || 'Técnico');
    asignarTexto('perfil-meta', (tecnico.especialidad || 'Técnico') + ' · ' + (tecnico.distrito || '') + ', ' + (tecnico.ciudad || ''));
    asignarTexto('perfil-rating', rating);
    asignarTexto('perfil-rating-count', '(' + totalResenas + ' reseñas)');
    asignarTexto('perfil-descripcion', tecnico.descripcion || 'Este técnico aún no agregó una descripción.');

    const status = document.getElementById('perfil-status');
    if (status) {
        status.innerHTML = '<span class="card-tech__status-dot"></span>' + (online ? 'En Línea' : 'Ausente');
    }

    document.title = (tecnico.nombre || 'Perfil del Técnico') + ' - Oficios Perú';
}

/**
 * Configura el botón "Contactar" como un enlace real de WhatsApp al celular del técnico.
 */
function pintarContactoTecnico(tecnico) {
    const boton = document.getElementById('btn-contactar');
    if (!boton) {
        return;
    }

    const celular = (tecnico.celular || '').replace(/\D/g, '');
    if (!celular) {
        boton.href = '#';
        return;
    }

    const mensaje = encodeURIComponent('Hola ' + (tecnico.nombre || '') + ', te contacto desde Oficios Perú para solicitar tus servicios.');
    boton.href = 'https://wa.me/51' + celular + '?text=' + mensaje;
}

/**
 * Trae los servicios del técnico y los pinta como filas de la tabla de tarifas.
 */
async function cargarServiciosTecnico(idTecnico) {
    const tbody = document.getElementById('perfil-servicios');
    if (!tbody) {
        return;
    }

    let respuesta;
    try {
        respuesta = await window.ApiService.obtenerServicios(idTecnico);
    } catch (error) {
        respuesta = null;
    }

    const servicios = respuesta && respuesta.success ? respuesta.data : [];

    if (!servicios || servicios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="py-3 text-muted">Este técnico aún no publicó tarifas de servicios.</td></tr>';
        return;
    }

    tbody.innerHTML = servicios.map(function (servicio) {
        const precio = parseFloat(servicio.precio_base || 0).toFixed(2);
        return '<tr class="border-b border-[var(--border-color)]">'
            + '<td class="py-3 pr-4">' + escaparHTML(servicio.titulo) + '</td>'
            + '<td class="py-3 pr-4">' + escaparHTML(servicio.duracion_estimada || '—') + '</td>'
            + '<td class="py-3">S/ ' + precio + '</td>'
            + '</tr>';
    }).join('');
}

/**
 * Trae las reseñas del técnico y las pinta como tarjetas de testimonio.
 */
async function cargarResenasTecnico(idTecnico) {
    const contenedor = document.getElementById('perfil-resenas');
    if (!contenedor) {
        return;
    }

    let respuesta;
    try {
        respuesta = await window.ApiService.obtenerResenas(idTecnico);
    } catch (error) {
        respuesta = null;
    }

    const resenas = respuesta && respuesta.success ? respuesta.data : [];

    if (!resenas || resenas.length === 0) {
        contenedor.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">Todavía no hay reseñas. ¡Sé el primero en opinar!</p>';
        return;
    }

    contenedor.innerHTML = resenas.map(function (resena) {
        const estrellas = construirEstrellas(parseInt(resena.calificacion, 10) || 0);
        return '<article class="testimonial-card" style="margin-bottom:1rem;">'
            + '<div class="testimonial-card__stars">' + estrellas + '</div>'
            + '<p class="testimonial-card__quote">' + escaparHTML(resena.comentario || '') + '</p>'
            + '<div class="testimonial-card__user">'
            + '<div class="testimonial-card__avatar" aria-hidden="true">' + obtenerIniciales(resena.nombre_cliente) + '</div>'
            + '<div><span class="testimonial-card__name">' + escaparHTML(resena.nombre_cliente || 'Cliente') + '</span></div>'
            + '</div>'
            + '</article>';
    }).join('');
}

/**
 * Conecta el formulario "Deja tu reseña" con el endpoint crear_resena.
 * Requiere una sesión activa para usar su id como id_cliente.
 */
function initResenaForm(idTecnico) {
    const form = document.getElementById('resena-form');
    if (!form) {
        return;
    }

    const alerta = document.getElementById('resena-alert');

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const usuario = obtenerSesionUsuario();
        if (!usuario) {
            if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(alerta, 'Debes iniciar sesión para dejar una reseña. Redirigiendo al login...', 'error');
            }
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        const selectCalificacion = document.getElementById('resena-calificacion');
        const textareaComentario = document.getElementById('resena-comentario');
        const calificacion = selectCalificacion ? parseInt(selectCalificacion.value, 10) : 0;
        const comentario = textareaComentario ? textareaComentario.value.trim() : '';

        if (comentario.length < 10) {
            if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(alerta, 'El comentario debe tener al menos 10 caracteres.', 'error');
            }
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const textoOriginal = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Publicando...';

        try {
            const respuesta = await window.ApiService.crearResena({
                id_tecnico: idTecnico,
                id_cliente: usuario.id,
                calificacion: calificacion,
                comentario: comentario
            });

            if (respuesta && respuesta.success) {
                if (window.ApiUI) {
                    window.ApiUI.mostrarAlerta(alerta, respuesta.message || '¡Reseña publicada con éxito!', 'exito');
                }
                form.reset();
                // La reseña cambió el promedio: recargamos lista y cabecera.
                cargarResenasTecnico(idTecnico);
                refrescarCabeceraTecnico(idTecnico);
            } else if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(alerta, (respuesta && respuesta.message) || 'No se pudo publicar la reseña.', 'error');
            }
        } catch (error) {
            if (window.ApiUI) {
                window.ApiUI.mostrarAlerta(alerta, error.message || 'Error inesperado al publicar la reseña.', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = textoOriginal;
        }
    });
}

/**
 * Vuelve a traer el técnico para refrescar la valoración tras una nueva reseña.
 */
async function refrescarCabeceraTecnico(idTecnico) {
    try {
        const respuesta = await window.ApiService.obtenerTecnico(idTecnico);
        if (respuesta && respuesta.success && respuesta.data) {
            pintarCabeceraTecnico(respuesta.data);
        }
    } catch (error) {
        // La reseña ya quedó guardada; solo no se pudo refrescar el promedio en pantalla.
    }
}

/**
 * Asigna texto plano a un elemento por id (no-op si el elemento no existe).
 */
function asignarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = valor;
    }
}

/**
 * Devuelve el HTML de 5 estrellas, llenas hasta la cantidad indicada.
 */
function construirEstrellas(cantidad) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const clase = i <= cantidad ? 'fa-solid fa-star' : 'fa-regular fa-star';
        html += '<i class="' + clase + '" aria-hidden="true"></i>';
    }
    return html;
}

/**
 * Obtiene las iniciales (hasta 2 letras) de un nombre para el avatar.
 */
function obtenerIniciales(nombre) {
    const limpio = (nombre || '').trim();
    if (!limpio) {
        return 'CL';
    }

    const partes = limpio.split(/\s+/);
    const primera = partes[0].charAt(0);
    const segunda = partes.length > 1 ? partes[1].charAt(0) : '';
    return (primera + segunda).toUpperCase();
}

/**
 * Escapa texto del usuario antes de insertarlo como HTML (anti XSS en el cliente).
 */
function escaparHTML(texto) {
    const contenedor = document.createElement('div');
    contenedor.textContent = texto === null || texto === undefined ? '' : String(texto);
    return contenedor.innerHTML;
}

/**
 * Muestra un mensaje de error de validación debajo del campo afectado.
 */
function showInputError(input, message) {
    if (!input) return;
    input.classList.add('input-error');

    const errSpan = document.createElement('span');
    errSpan.className = 'input-error-msg animate-fade-in';
    errSpan.textContent = message;

    // Insertar dentro del grupo del formulario o, si no existe, junto al input.
    const parent = input.closest('.form-group') || input.parentElement;
    parent.appendChild(errSpan);
}

/**
 * Limpia los mensajes y bordes rojos de error
 */
function clearFormErrors(form) {
    const errorSpans = form.querySelectorAll('.input-error-msg');
    errorSpans.forEach(span => span.remove());

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.remove('input-error');
    });
}

/**
 * Helper: valida formato de correo electrónico
 */
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Guarda la sesión del usuario autenticado (semilla o registrado en la web).
 */
function guardarSesionUsuario(usuario) {
    sessionStorage.setItem('of_user', JSON.stringify(usuario));
}

/**
 * Obtiene el usuario autenticado desde sessionStorage.
 */
function obtenerSesionUsuario() {
    const datos = sessionStorage.getItem('of_user');
    if (!datos) {
        return null;
    }

    try {
        return JSON.parse(datos);
    } catch (errorParseo) {
        sessionStorage.removeItem('of_user');
        return null;
    }
}

/**
 * Determina la ruta de entrada a la plataforma tras un login exitoso.
 * Clientes y técnicos van al catálogo; la ruta es relativa según la página actual.
 */
function resolverRedirectLogin(usuario, redirectServidor) {
    const enPaginasInternas = window.location.pathname.includes('/frontend/pages/');
    return enPaginasInternas ? 'catalogo.html' : 'frontend/pages/catalogo.html';
}

/**
 * Evita que un usuario autenticado vuelva a ver login o registro.
 */
function redirigirSiYaAutenticado() {
    const usuario = obtenerSesionUsuario();
    if (!usuario) {
        return;
    }

    const rutaActual = window.location.pathname;
    const esLogin = rutaActual.includes('login.html');
    const esRegistro = rutaActual.includes('registro.html');

    if (esLogin || esRegistro) {
        window.location.href = resolverRedirectLogin(usuario);
    }
}

/**
 * Actualiza la barra de navegación cuando hay sesión activa.
 */
function initAuthNav() {
    const usuario = obtenerSesionUsuario();
    if (!usuario) {
        return;
    }

    const menu = document.getElementById('nav-menu') || document.querySelector('.navbar__menu');
    if (menu) {
        menu.querySelectorAll('a').forEach(function (enlace) {
            const href = (enlace.getAttribute('href') || '').toLowerCase();
            if (href.includes('beneficios') || href.includes('testimonios')) {
                const item = enlace.closest('li');
                if (item) {
                    item.remove();
                }
            }
        });
    }

    const contenedorAcciones = document.querySelector('.navbar__actions');
    if (!contenedorAcciones) {
        return;
    }

    contenedorAcciones.innerHTML = '';

    const primerNombre = (usuario.nombre || '').trim().split(/\s+/)[0] || 'Usuario';

    const saludo = document.createElement('span');
    saludo.className = 'navbar__link navbar__greeting';
    saludo.style.fontWeight = '600';
    saludo.textContent = 'Hola, ' + primerNombre;
    saludo.title = usuario.nombre;

    const enPaginasInternas = window.location.pathname.includes('/frontend/pages/');
    const rutaCatalogo = enPaginasInternas ? 'catalogo.html' : 'frontend/pages/catalogo.html';
    const rutaOfrecer = enPaginasInternas ? 'ofrecer.html' : 'frontend/pages/ofrecer.html';

    const btnOfrecer = document.createElement('a');
    btnOfrecer.href = rutaOfrecer;
    btnOfrecer.className = 'btn btn--outline';
    btnOfrecer.innerHTML = '<i class="fa-solid fa-bullhorn" aria-hidden="true"></i><span> Ofrecer mi servicio</span>';

    const btnCatalogo = document.createElement('a');
    btnCatalogo.href = rutaCatalogo;
    btnCatalogo.className = 'btn btn--primary';
    btnCatalogo.textContent = 'Buscar Técnicos';

    const btnLogout = document.createElement('button');
    btnLogout.type = 'button';
    btnLogout.className = 'btn btn--text';
    btnLogout.id = 'btn-logout-nav';
    btnLogout.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket navbar__logout-icon" aria-hidden="true"></i><span class="navbar__logout-label">Cerrar sesión</span>';

    contenedorAcciones.appendChild(saludo);
    contenedorAcciones.appendChild(btnOfrecer);
    contenedorAcciones.appendChild(btnCatalogo);
    contenedorAcciones.appendChild(btnLogout);

    btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('of_user');
        const rutaInicio = enPaginasInternas ? '../../index.html' : 'index.html';
        window.location.href = rutaInicio;
    });
}
