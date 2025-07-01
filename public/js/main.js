//public/js/main.js
// ! Archivo principal JS del frontend
//* Este archivo inicializa la SPA, configura eventos globales (incluyendo la navegación
//* y el comportamiento del header), y orquesta la carga de vistas.
//* Uso importaciones modulares para mantener el código organizado y limpio.

console.log('Frontend JavaScript principal cargado. Configurando aplicación...'); //* Log para saber que el script principal cargó

// ===============================================================
//* IMPORTACIONES DE MÓDULOS DE VISTA
//* Importo funciones para cargar/renderizar cada vista específica.
// ===============================================================

import { loadEquiposList } from './views/equiposView.js';
import { showEquipoForm } from './views/equipoFormView.js';
import { showEquipoDetails } from './views/equipoDetailsView.js';
import { loadEmpleadosList } from './views/empleadosView.js';
import { showEmpleadoForm } from './views/empleadosFormView.js';
import { showEmpleadoDetails } from './views/empleadosDetailsView.js';
import { loadDireccionesIpList } from './views/direccionesIpView.js';
import { showDireccionIpForm } from './views/direccionesIpFormView.js';
import { showDireccionIpDetails } from './views/direccionesIpDetailsView.js';
import { loadCuentasEmailList } from './views/cuentasEmailView.js';
import { loadMantenimientosList } from './views/mantenimientosView.js';
import { loadNotasList } from './views/notasView.js';
import { loadAsignacionesList } from './views/asignacionesView.js';
import { showAsignacionForm } from './views/asignacionesFormView.js';
import { showAsignacionDetails } from './views/asignacionesDetailsView.js';
import { loadLoginView } from './views/loginView.js';
import { loadProfileView } from './views/profileView.js';
import { showCuentaEmailForm } from './views/cuentaEmailFormView.js';
import { showMantenimientoForm } from './views/mantenimientoFormView.js';
import { showNotaForm } from './views/notaFormView.js';
import { showCuentaEmailDetails } from './views/cuentasEmailDetailsView.js';
import { showMantenimientoDetails } from './views/mantenimientosDetailsView.js';
import { showNotaDetails } from './views/notaDetailsView.js';
import { loadDashboard } from './views/dashboardView.js';
//TODO: Crear e importar showCuentaEmailDetails
//TODO: Crear e importar showMantenimientoDetails
//TODO: Crear e importar showNotaDetails
//? ¿Necesitaré una función para cerrar modales aquí? Si los modales son globales.
//? import { closeCurrentModal } from './ui/modal.js'; // Asumo que esto existe o lo crearás.


/*
* ===============================================================
* ELEMENTOS DEL DOM GLOBALES
* * Referencio los elementos principales del layout para manipularlos desde cualquier vista.
* ===============================================================
*/
const contentArea = document.getElementById('content-area');
const mobileMenu = document.getElementById('mobile-menu');
const mainHeader = document.getElementById('main-header');
const homeHeader = document.getElementById('home-header');
const appContainer = document.body;

//* Función para renderizar el contenido inicial de la vista 'home'.
//* Esta vista se muestra SIN el header principal.
async function renderHomeView() {
    await loadDashboard();
}

//* Objeto que mapea nombres de vista a las funciones que las cargan/renderizan.
const viewsMap = {
    'login': loadLoginView,
    'home': renderHomeView,
    'equipos-list': loadEquiposList,
    'equipo-form': showEquipoForm,
    'equipo-details': showEquipoDetails,
    'empleados-list': loadEmpleadosList,
    'empleado-form': showEmpleadoForm,
    'empleado-details': showEmpleadoDetails,
    'direcciones-ip-list': loadDireccionesIpList,
    'direccion-ip-form': showDireccionIpForm,
    'direccion-ip-details': showDireccionIpDetails,
    'cuentas-email-list': loadCuentasEmailList,
    'mantenimientos-list': loadMantenimientosList,
    'notas-list': loadNotasList,
    'asignaciones-list': loadAsignacionesList,
    'asignacion-form': showAsignacionForm,
    'asignacion-details': showAsignacionDetails,
    'profile': loadProfileView,
    'cuenta-email-form': showCuentaEmailForm,
    'cuenta-email-details': showCuentaEmailDetails,
    'mantenimiento-form': showMantenimientoForm,
    'mantenimiento-details': showMantenimientoDetails,
    'nota-form': showNotaForm,
    'nota-details': showNotaDetails,
    //TODO: 'usuarios-list': loadUsuariosList, 'usuario-form': showUsuarioForm, 'usuario-details': showUsuarioDetails
};

// Hacer viewsMap global para que el dashboard pueda acceder a él
window.viewsMap = viewsMap;

// ===============================================================
//* FUNCIÓN DE NAVEGACIÓN CENTRALIZADA
//* Esta función se encarga de cambiar de vista, actualizar la URL,
//* y manejar la visibilidad del header.
// ===============================================================

function updateHeaderAuthUI() {
    const mainHeader = document.getElementById('main-header');
    // El header siempre se muestra, solo con el logo
    if (mainHeader) mainHeader.classList.remove('js-hide');
    // Oculta el botón de menú de usuario si existe
    const userMenuButton = document.getElementById('user-menu-button');
    if (userMenuButton) userMenuButton.classList.add('js-hide');
}

function updateSidebarUI() {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-wrapper');
    const loginContent = document.getElementById('login-content');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarRole = document.getElementById('sidebar-role');
    const logoutButton = sidebar ? sidebar.querySelector('[data-action="logout"]') : null;
    //! Oculta sidebar, main-wrapper y muestra login-content solo en login
    if (!token || !userData || window.currentView === 'login') {
        if (sidebar) sidebar.classList.add('js-hide');
        if (mainContent) mainContent.classList.add('js-hide');
        if (loginContent) loginContent.classList.remove('js-hide');
        return;
    }
    if (sidebar) sidebar.classList.remove('js-hide');
    if (mainContent) mainContent.classList.remove('js-hide');
    if (loginContent) loginContent.classList.add('js-hide');
    //* Actualiza avatar, nombre y rol
    const avatarLetter = userData.username ? userData.username.charAt(0).toUpperCase() : 'U';
    if (sidebarAvatar) sidebarAvatar.textContent = avatarLetter;
    if (sidebarUsername) sidebarUsername.textContent = userData.username;
    if (sidebarRole) sidebarRole.textContent = userData.roleName;
    if (logoutButton) logoutButton.style.display = '';
}

function navigateTo(viewName, params = null, pushState = true) {
    const token = localStorage.getItem('authToken');
    if (!token && viewName !== 'login') {
        sessionStorage.setItem('loginRedirect', '1');
        window.location.replace('/soporte/');
        return;
    }
    
    const loadViewFunction = viewsMap[viewName];
    if (loadViewFunction) {
        loadViewFunction(params);
    } else {
        contentArea.innerHTML = `<p class="text-red-500 font-bold">Error:</p><p class="text-red-500">La vista solicitada "${viewName}" no está implementada.</p>`;
    }
    
    // Actualiza la URL usando pushState si corresponde
    if (pushState) {
        let url = '/soporte/' + viewName;
        if (params) url += '/' + params;
        
        // Verificar si ya estamos en la misma vista para evitar entradas duplicadas
        const currentPath = window.location.pathname;
        if (currentPath !== url) {
            // Si estamos navegando desde el home y no hay una entrada previa en el historial,
            // agregar una entrada del home primero
            if ((currentPath === '/soporte/home' || currentPath === '/soporte/') && history.length === 1) {
                history.pushState({ viewName: 'home', params: null }, '', '/soporte/home');
            }
            
            history.pushState({ viewName, params }, '', url);
        }
        window.currentView = viewName;
    }
    
    updateSidebarUI();
}
window.navigateTo = navigateTo; //* Hago navigateTo global.
window.updateSidebarUI = updateSidebarUI; //* Hago updateSidebarUI global.

//* Hago globales las funciones de carga de listas para que los formularios puedan llamarlas.
window.loadEquiposListGlobal = loadEquiposList;
window.loadEmpleadosListGlobal = loadEmpleadosList;
window.loadDireccionesIpListGlobal = loadDireccionesIpList;
window.loadCuentasEmailListGlobal = loadCuentasEmailList;
window.loadMantenimientosListGlobal = loadMantenimientosList;
window.loadNotasListGlobal = loadNotasList;
window.loadAsignacionesListGlobal = loadAsignacionesList;
//TODO: Hacer globales las funciones de carga de listas faltantes.


// ===============================================================
//* INICIALIZACIÓN DE LA APLICACIÓN Y MANEJO DE EVENTOS GLOBALES
//* Aquí engancho los eventos de navegación y defino la carga inicial.
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado. Inicia configuración de eventos.');

    //* === Configurar Event Listeners para Navegación usando DELEGACIÓN DE EVENTOS ===
    appContainer.addEventListener('click', (event) => {
        //* Busco un elemento `data-view` o `data-action` en el path del evento.
        const viewTrigger = event.target.closest('[data-view]');
        const actionTrigger = event.target.closest('[data-action]');
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');

        if (viewTrigger) {
            event.preventDefault();
            const viewName = viewTrigger.dataset.view;
            const id = viewTrigger.dataset.id;
            const params = id ? String(id) : null;
            navigateTo(viewName, params);
            //* Oculta el sidebar en móvil al seleccionar una opción
            if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        }

        if (actionTrigger) {
            event.preventDefault();
            const actionName = actionTrigger.dataset.action;
            if (actionName === 'logout') {
                handleLogout();
            } else if (actionName === 'profile') {
                navigateTo('profile');
            }
            //* Oculta el sidebar en móvil al seleccionar una acción
            if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        }
    });

    //! === Carga de la vista inicial BASADA EN AUTENTICACIÓN Y URL ===
    const token = localStorage.getItem('authToken');
    const path = window.location.pathname.replace(/^\/soporte\/?/, '');
    const parts = path.split('/');
    const viewName = parts[0] === '' ? (token ? 'home' : 'login') : parts[0];
    const params = parts.length > 1 ? parts[1] : null;

    // Agregar una entrada inicial al historial si es la primera carga
    if (token && (path === '' || path === 'home')) {
        history.replaceState({ viewName: 'home', params: null }, '', '/soporte/home');
    }

    if (token) {
        // Si hay token, navego a la vista de la URL o home si es raíz
        navigateTo(viewName, params, false);
    } else {
        // Si no hay token, siempre muestro login
        navigateTo('login', null, false);
    }

    //* === Manejo de los botones Atrás/Adelante del navegador (evento popstate) ===
    window.addEventListener('popstate', (event) => {
        const state = event.state; //* event.state contiene el objeto que guardé con pushState.
        console.log('Evento popstate disparado. Estado recuperado:', state);

        if (state && state.viewName) {
            //* Si hay un estado guardado, navego a esa vista SIN añadir nueva entrada al historial.
            navigateTo(state.viewName, state.params, false);
        } else {
            //* Si no hay estado (ej. el usuario llegó a la página por primera vez y luego usó "atrás"
            //* hasta antes del primer pushState, o si el estado no es el esperado),
            //* cargo la vista según la URL actual.
            const pathFromPop = window.location.pathname.replace(/^\/soporte\/?/, '');
            const partsFromPop = pathFromPop.split('/');
            const viewNameFromUrl = partsFromPop[0] === '' ? 'home' : partsFromPop[0];
            const paramsFromUrl = partsFromPop.length > 1 ? partsFromPop[1] : null;
            console.log(`popstate sin estado válido, cargando desde URL actual: "${viewNameFromUrl}"`);
            
            // Verificar si la vista es válida antes de navegar
            if (viewsMap[viewNameFromUrl]) {
                navigateTo(viewNameFromUrl, paramsFromUrl, false);
            } else {
                // Si la vista no es válida, redirigir al home
                console.log('Vista no válida, redirigiendo al home');
                navigateTo('home', null, false);
            }
        }
    });

    updateHeaderAuthUI();

    updateSidebarUI();

    // Sidebar toggle para móviles
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    const sidebarCollapseIcon = document.getElementById('sidebar-collapse-icon');
    const mainContent = document.getElementById('main-wrapper');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('-translate-x-full');
        });
        //* Cerrar sidebar al hacer click fuera en móviles
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768 && !sidebar.classList.contains('js-hide')) {
                if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
                    sidebar.classList.add('-translate-x-full');
                }
            }
        });
    }

    //* Sidebar collapse/expand en escritorio
    if (sidebarCollapseBtn && sidebar) {
        sidebarCollapseBtn.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
            // Cambia el icono
            if (isCollapsed) {
                sidebarCollapseIcon.textContent = 'chevron_right';
                sidebar.setAttribute('data-collapsed', 'true');
            } else {
                sidebarCollapseIcon.textContent = 'chevron_left';
                sidebar.setAttribute('data-collapsed', 'false');
            }
        });
    }

    //* Asegura que el sidebar esté expandido en móvil
    window.addEventListener('resize', () => {
        if (window.innerWidth < 768 && sidebar.classList.contains('sidebar-collapsed')) {
            sidebar.classList.remove('sidebar-collapsed');
            mainContent.classList.remove('main-expanded');
            sidebar.setAttribute('data-collapsed', 'false');
            if (sidebarCollapseIcon) sidebarCollapseIcon.textContent = 'chevron_left';
        }
    });
});

//* Función para manejar el logout.
async function handleLogout() {
    const confirmed = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro que deseas cerrar tu sesión?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
    });
    if (!confirmed.isConfirmed) return;
    //! Limpio el token y datos del usuario de localStorage.
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    //! Muestro un mensaje y redirijo a la vista de login.
    await Swal.fire({
        icon: 'info',
        title: 'Sesión Cerrada',
        text: 'Has cerrado sesión exitosamente.'
    });
    window.location.replace('/soporte/');
}