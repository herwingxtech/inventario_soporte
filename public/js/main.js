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
import { showConfirmationModal, showInfoModal } from './ui/modal.js';
//TODO: Crear e importar showCuentaEmailForm y showCuentaEmailDetails
//TODO: Crear e importar showMantenimientoForm y showMantenimientoDetails
//TODO: Crear e importar showNotaForm y showNotaDetails
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
function renderHomeView() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    contentArea.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 class="text-3xl md:text-4xl font-semibold text-gray-900 mb-2 tracking-tight">Bienvenido${userData ? `, ${userData.username}` : ''}!</h1>
            <p class="text-lg text-gray-500 mb-4">${userData ? `Rol: <span class='font-semibold text-blue-600'>${userData.roleName}</span>` : ''}</p>
            <p class="text-base text-gray-600 mb-8">Gestiona los recursos tecnológicos de la empresa desde el menú superior.</p>
            <div class="w-full max-w-2xl mt-8">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center shadow-sm">
                    <span class="text-blue-600 font-medium">Selecciona una opción en el menú para comenzar.</span>
                </div>
            </div>
        </div>
    `;
}

//* Objeto que mapea nombres de vista a las funciones que las cargan/renderizan.
const viewsMap = {
    'login': loadLoginView,
    'home': renderHomeView,
    'equiposList': loadEquiposList,
    'equipoForm': showEquipoForm,
    'equipoDetails': showEquipoDetails,
    'empleadosList': loadEmpleadosList,
    'empleadoForm': showEmpleadoForm,
    'empleadoDetails': showEmpleadoDetails,
    'direccionesIpList': loadDireccionesIpList,
    'direccionIpForm': showDireccionIpForm,
    'direccionIpDetails': showDireccionIpDetails,
    'cuentasEmailList': loadCuentasEmailList,
    'mantenimientosList': loadMantenimientosList,
    'notasList': loadNotasList,
    'asignacionesList': loadAsignacionesList,
    'asignacionForm': showAsignacionForm,       
    'asignacionDetails': showAsignacionDetails, 
    'profile': loadProfileView,
    //TODO: 'cuentaEmailForm': showCuentaEmailForm, 'cuentaEmailDetails': showCuentaEmailDetails,
    //TODO: 'mantenimientoForm': showMantenimientoForm, 'mantenimientoDetails': showMantenimientoDetails,
    //TODO: 'notaForm': showNotaForm, 'notaDetails': showNotaDetails,
    //TODO: 'usuariosList': loadUsuariosList, 'usuarioForm': showUsuarioForm, 'usuarioDetails': showUsuarioDetails
};


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
    const mainContent = document.getElementById('main-content');
    const loginContent = document.getElementById('login-content');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarRole = document.getElementById('sidebar-role');
    const logoutButton = sidebar ? sidebar.querySelector('[data-action="logout"]') : null;
    //! Oculta sidebar, main-content y muestra login-content solo en login
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
        window.location.replace('/');
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
        let url = '/' + viewName;
        if (params) url += '/' + params;
        history.pushState({ viewName, params }, '', url);
        window.currentView = viewName;
    }
    updateSidebarUI();
}
window.navigateTo = navigateTo; //* Hago navigateTo global.

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
            }
            //* Oculta el sidebar en móvil al seleccionar una acción
            if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        }
    });

    //! === Carga de la vista inicial BASADA EN AUTENTICACIÓN ===
    const token = localStorage.getItem('authToken');
    if (token) {
        //* Si hay un token, el usuario está "logueado".
        //* Muestro la vista home por defecto.
        console.log('Exiate un token. Cargando vista home.');
        navigateTo('home', null, false);
    } else {
        //* Si no hay token, muestro la vista de login.
        console.log('Herwing no tiene un token. Cargando vista de login.');
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
            const pathFromPop = window.location.pathname.replace(/^\//, '');
            const partsFromPop = pathFromPop.split('/');
            const viewNameFromUrl = partsFromPop[0] === '' ? 'home' : partsFromPop[0];
            const paramsFromUrl = partsFromPop.length > 1 ? partsFromPop[1] : null;
            console.log(`popstate sin estado válido, cargando desde URL actual: "${viewNameFromUrl}"`);
            navigateTo(viewNameFromUrl, paramsFromUrl, false);
        }
    });

    updateHeaderAuthUI();

    updateSidebarUI();

    // Sidebar toggle para móviles
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    const sidebarCollapseIcon = document.getElementById('sidebar-collapse-icon');
    const mainContent = document.getElementById('main-content');

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
    const confirmed = await showConfirmationModal({
        title: '¿Cerrar sesión?',
        message: '¿Estás seguro que deseas cerrar tu sesión?',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white'
    });
    if (!confirmed) return;
    //! Limpio el token y datos del usuario de localStorage.
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    //! Muestro un mensaje y redirijo a la vista de login.
    await showInfoModal({ title: 'Sesión Cerrada', message: 'Has cerrado sesión exitosamente.'});
    window.location.replace('/');
}