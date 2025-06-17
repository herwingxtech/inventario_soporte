// public/js/main.js
// ! Archivo principal JS del frontend
// * Este archivo inicializa la SPA, configura eventos globales (incluyendo la navegación
// * y el comportamiento del header), y orquesta la carga de vistas.
// * Uso importaciones modulares para mantener el código organizado y limpio.

console.log('Frontend JavaScript principal cargado. Configurando aplicación...'); // * Log para saber que el script principal cargó

// ===============================================================
// * IMPORTACIONES DE MÓDULOS DE VISTA
// * Importo funciones para cargar/renderizar cada vista específica.
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
//TODO: Crear e importar showCuentaEmailForm y showCuentaEmailDetails
import { loadMantenimientosList } from './views/mantenimientosView.js';
//TODO: Crear e importar showMantenimientoForm y showMantenimientoDetails
import { loadNotasList } from './views/notasView.js';
//TODO: Crear e importar showNotaForm y showNotaDetails
import { loadAsignacionesList } from './views/asignacionesView.js';
import { showAsignacionForm } from './views/asignacionesFormView.js';   
import { showAsignacionDetails } from './views/asignacionesDetailsView.js';
//? ¿Necesitaré una función para cerrar modales aquí? Si los modales son globales.
// import { closeCurrentModal } from './ui/modal.js'; // Asumo que esto existe o lo crearás.


/*
* ===============================================================
* ELEMENTOS DEL DOM GLOBALES
* * Referencio los elementos principales del layout para manipularlos desde cualquier vista.
* ===============================================================
*/
const contentArea = document.getElementById('content-area');
const mobileMenu = document.getElementById('mobile-menu');
const mainHeader = document.getElementById('main-header'); // * Referencia al header principal
const homeHeader = document.getElementById('home-header');
const appContainer = document.body; // * Contenedor para delegación de eventos


// * Función para renderizar el contenido inicial de la vista 'home'.
// * Esta vista se muestra SIN el header principal.
function renderHomeView() {
    console.log('Renderizando vista Home por Herwing.');
    contentArea.innerHTML = `
        <div class="text-center pt-8 md:pt-16"> <!-- Añadido padding superior para centrar más sin header -->
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-6">Inventario IT</h1>
            <p class="text-xl text-gray-700 mb-10">Da clic en alguna opción para ver los activos.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
            <!-- Tarjetas de Navegación -->
            <div class="bg-blue-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-view="equiposList">
                <h3 class="font-semibold text-xl text-blue-800 mb-2">Equipos</h3>
                <p class="text-blue-700 text-sm">Ver y gestionar el inventario de equipos.</p>
            </div>
            <div class="bg-green-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-view="empleadosList">
                <h3 class="font-semibold text-xl text-green-800 mb-2">Empleados</h3>
                <p class="text-green-700 text-sm">Administrar la información del personal.</p>
            </div>
            <div class="bg-yellow-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-view="direccionesIpList">
                <h3 class="font-semibold text-xl text-yellow-800 mb-2">Direcciones IP</h3>
                <p class="text-yellow-700 text-sm">Gestionar el inventario de IPs.</p>
            </div>
            <div class="bg-purple-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-view="asignacionesList">
                <h3 class="font-semibold text-xl text-purple-800 mb-2">Asignaciones</h3>
                <p class="text-purple-700 text-sm">Rastrear asignaciones de equipos.</p>
            </div>
            <div class="bg-indigo-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-view="cuentasEmailList">
                <h3 class="font-semibold text-xl text-indigo-800 mb-2">Cuentas Email</h3>
                <p class="text-indigo-700 text-sm">Administrar cuentas de correo.</p>
            </div>
            <div class="bg-orange-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-view="mantenimientosList">
                <h3 class="font-semibold text-xl text-orange-800 mb-2">Mantenimientos</h3>
                <p class="text-orange-700 text-sm">Ver historial de mantenimientos.</p>
            </div>
            <div class="bg-cyan-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-view="notasList">
                <h3 class="font-semibold text-xl text-cyan-800 mb-2">Notas</h3>
                <p class="text-cyan-700 text-sm">Consultar notas y apuntes.</p>
            </div>
            <!--//TODO: Añadir tarjeta para Usuarios del Sistema si se va a gestionar desde aquí. -->
        </div>
    `;
}

// * Objeto que mapea nombres de vista a las funciones que las cargan/renderizan.
const viewsMap = {
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
    //TODO: 'cuentaEmailForm': showCuentaEmailForm, 'cuentaEmailDetails': showCuentaEmailDetails,
    'mantenimientosList': loadMantenimientosList,
    //TODO: 'mantenimientoForm': showMantenimientoForm, 'mantenimientoDetails': showMantenimientoDetails,
    'notasList': loadNotasList,
    //TODO: 'notaForm': showNotaForm, 'notaDetails': showNotaDetails,
    'asignacionesList': loadAsignacionesList,
    'asignacionForm': showAsignacionForm,       
    'asignacionDetails': showAsignacionDetails, 
    //TODO: 'usuariosList': loadUsuariosList, 'usuarioForm': showUsuarioForm, 'usuarioDetails': showUsuarioDetails
};


// ===============================================================
// * FUNCIÓN DE NAVEGACIÓN CENTRALIZADA
// * Esta función se encarga de cambiar de vista, actualizar la URL,
// * y manejar la visibilidad del header.
// ===============================================================

function navigateTo(viewName, params = null, pushState = true) {
    console.log(`Herwing está navegando a la vista: "${viewName}" con parámetros:`, params);
    //? Cierro modales globales si existieran, antes de cambiar de vista.
    // if (typeof closeCurrentModal === 'function') {
    //     closeCurrentModal();
    // }

    const loadViewFunction = viewsMap[viewName];

    // * Lógica para mostrar/ocultar el header
    if (mainHeader) { // Verifico que el elemento exista
        if (viewName === 'home') {
            homeHeader.classList.remove('header-hidden');
            mainHeader.classList.add('header-hidden'); // O uso Tailwind: mainHeader.classList.add('hidden');
            console.log('Header oculto para la vista home.');
        } else {
            homeHeader.classList.add('header-hidden');
            mainHeader.classList.remove('header-hidden'); // O uso Tailwind: mainHeader.classList.remove('hidden');
            console.log('Header visible para la vista:', viewName);
        }
    } else {
        console.warn('Elemento header (id="main-header") no encontrado en el DOM.');
    }


    if (loadViewFunction) {
        loadViewFunction(params); // Llamo a la función del módulo de vista.
        // Actualiza la URL usando pushState si corresponde (no al cargar inicialmente por URL o popstate)
        if (pushState) {
            let urlPath = viewName === 'home' ? '/' : `/${viewName}`;
            const paramValue = (typeof params === 'object' && params !== null && params.id !== undefined) ? params.id : (typeof params === 'string' ? params : null);

            if (paramValue) { // Si hay un parámetro (ej. ID), lo añado a la URL.
                urlPath += `/${paramValue}`;
            }
            window.history.pushState({ viewName, params }, '', urlPath); // Guardo el estado.
            console.log(`URL actualizada a: ${window.location.pathname} por pushState.`);
        }
    } else {
        // ! Error: Vista desconocida o no implementada
        console.error(`Vista desconocida o no implementada: "${viewName}"`);
        contentArea.innerHTML = `<p class="text-red-500 font-bold">Error:</p><p class="text-red-500">La vista solicitada "${viewName}" no está implementada.</p>`;
    }

    // * Cierro el menú móvil si está abierto al navegar (mejora UX).
    if (mobileMenu.classList.contains('max-h-screen')) {
        mobileMenu.classList.remove('max-h-screen');
        mobileMenu.classList.add('max-h-0');
    }
}
window.navigateTo = navigateTo; // * Hago navigateTo global (simplificación).

// * Hago globales las funciones de carga de listas para que los formularios puedan llamarlas.
// * Mejor alternativa: sistema de eventos o pasar callbacks.
window.loadEquiposListGlobal = loadEquiposList;
window.loadEmpleadosListGlobal = loadEmpleadosList;
window.loadDireccionesIpListGlobal = loadDireccionesIpList;
window.loadCuentasEmailListGlobal = loadCuentasEmailList;
window.loadMantenimientosListGlobal = loadMantenimientosList;
window.loadNotasListGlobal = loadNotasList;
window.loadAsignacionesListGlobal = loadAsignacionesList;
//TODO: Hacer globales las funciones de carga de listas faltantes (Usuarios).


// ===============================================================
// * INICIALIZACIÓN DE LA APLICACIÓN Y MANEJO DE EVENTOS GLOBALES
// * Aquí engancho los eventos de navegación y defino la carga inicial.
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado. Herwing inicia configuración de eventos.');

    // === Configurar Event Listeners para Navegación usando DELEGACIÓN DE EVENTOS ===
    // * Añado UN SOLO listener al body (o un contenedor principal de la app).
    // * Esto captura clics en cualquier elemento con `data-view`, incluso si se añaden dinámicamente.
    appContainer.addEventListener('click', (event) => {
        const viewTriggerElement = event.target.closest('[data-view]');

        if (viewTriggerElement) {
            event.preventDefault(); // Evito la navegación por defecto.
            const viewName = viewTriggerElement.dataset.view;
            // * Si el elemento tiene data-id, lo paso como parámetro (útil para detalles/edición).
            const idParam = viewTriggerElement.dataset.id || null;
            navigateTo(viewName, idParam, true); // El 'true' es para añadir al historial.
        }

        //? ¿Manejar otros data-action aquí, como 'logout'?
        // const actionTriggerElement = event.target.closest('[data-action="logout"]');
        // if (actionTriggerElement) {
        //     event.preventDefault();
        //     // Lógica de logout
        //     console.log('Herwing hizo clic en Logout.');
        // }
    });


    // === Carga de la vista inicial al cargar la página (basado en la URL actual) ===
    // * Esta lógica determina qué vista mostrar cuando el usuario llega a la aplicación.
    const path = window.location.pathname.replace(/^\//, ''); // Elimino la barra inicial.
    const parts = path.split('/'); // Divido la ruta. Ej: "equipoDetails/123" -> ["equipoDetails", "123"]
    const initialView = parts[0] === '' ? 'home' : parts[0]; // Si es vacía, es 'home'.
    const initialParams = parts.length > 1 ? parts[1] : null; // El segundo segmento es el ID.

    console.log(`Cargando vista inicial desde URL: "${initialView}" con parámetros:`, initialParams);
    navigateTo(initialView, initialParams, false); // 'false' para NO añadir al historial (ya estamos en esa URL).


    // === Manejo de los botones Atrás/Adelante del navegador (evento popstate) ===
    window.addEventListener('popstate', (event) => {
        const state = event.state; // * event.state contiene el objeto que guardé con pushState.
        console.log('Evento popstate disparado. Estado recuperado:', state);

        if (state && state.viewName) {
            // Si hay un estado guardado, navego a esa vista SIN añadir nueva entrada al historial.
            navigateTo(state.viewName, state.params, false);
        } else {
            // * Si no hay estado (ej. el usuario llegó a la página por primera vez y luego usó "atrás"
            // * hasta antes del primer pushState, o si el estado no es el esperado),
            // * cargo la vista según la URL actual.
            const pathFromPop = window.location.pathname.replace(/^\//, '');
            const partsFromPop = pathFromPop.split('/');
            const viewNameFromUrl = partsFromPop[0] === '' ? 'home' : partsFromPop[0];
            const paramsFromUrl = partsFromPop.length > 1 ? partsFromPop[1] : null;
            console.log(`popstate sin estado válido, cargando desde URL actual: "${viewNameFromUrl}"`);
            navigateTo(viewNameFromUrl, paramsFromUrl, false);
        }
    });

});

// * Script básico para el menú hamburguesa (igual que antes).
document.getElementById('hamburger-button').addEventListener('click', function() {
    mobileMenu.classList.toggle('max-h-0');
    mobileMenu.classList.toggle('max-h-screen');
});