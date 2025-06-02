// public/js/main.js
// ! Archivo principal JS del frontend
// * Este archivo inicializa la SPA, configura eventos globales y orquesta la carga de vistas. Uso importaciones modulares para mantener el código organizado y limpio.

console.log('Frontend JavaScript principal cargado. Configurando aplicación...'); // * Log para saber que el script principal cargó

// ===============================================================
// * IMPORTACIONES DE MÓDULOS DE VISTA
// * Importo funciones para cargar/renderizar cada vista específica. Así mantengo el código desacoplado y fácil de mantener.
// ===============================================================

import { loadEquiposList } from './views/equiposView.js';
import { loadEmpleadosList } from './views/empleadosView.js';
import { loadDireccionesIpList } from './views/direccionesIpView.js';
import { loadCuentasEmailList } from './views/cuentasEmailView.js'; 
import { loadMantenimientosList } from './views/mantenimientosView.js';



/* 
* ===============================================================
* ELEMENTOS DEL DOM GLOBALES 
* * Referencio los elementos principales del layout para manipularlos desde cualquier vista.
* ===============================================================
*/
const contentArea = document.getElementById('content-area');
const mobileMenu = document.getElementById('mobile-menu');

// * Función para renderizar el contenido inicial de la vista 'home'.
function renderHomeView() {
    console.log('Renderizando vista Home.'); // * Log para saber cuándo se renderiza la vista home
    contentArea.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Bienvenido a tu Inventario</h2>
        <p class="text-gray-700 mb-6">Selecciona una opción del menú para empezar a gestionar tus activos.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-blue-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-blue-800 mb-2">Gestión de Equipos</h3>
                <p class="text-blue-700 text-sm">Inventario de computadoras, monitores, impresoras, etc.</p>
                 <button class="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600/90" data-view="equiposList">Ver Equipos</button>
            </div>
             <div class="bg-green-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-green-800 mb-2">Gestión de Empleados</h3>
                <p class="text-green-700 text-sm">Información del personal asociado a los activos.</p>
                 <button class="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-600/90" data-view="empleadosList">Ver Empleados</button>
            </div>
             <div class="bg-purple-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-purple-800 mb-2">Gestión de Direcciones IP</h3>
                <p class="text-purple-700 text-sm">Rastrea a quién están asignadas las direcciones IP.</p>
                 <button class="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-600/90" data-view="direccionesIpList">Ver Direcciones IP</button>
            </div>
        </div>
    `;
}

// * Objeto que mapea nombres de vista (del atributo data-view) a las funciones que las cargan/renderizan.
const viewsMap = {
    'home': renderHomeView,
    'equiposList': loadEquiposList,
    'empleadosList': loadEmpleadosList,
    'direccionesIpList': loadDireccionesIpList,
    'cuentasEmailList': loadCuentasEmailList,
    'mantenimientosList': loadMantenimientosList
};


// ===============================================================
// * FUNCIÓN DE NAVEGACIÓN CENTRALIZADA
// * Esta función se encarga de cambiar de vista y cerrar el menú móvil si está abierto.
// ===============================================================

function navigateTo(viewName, params = null) {
    console.log(`Navegando a la vista: "${viewName}" con parámetros:`, params); // * Log para rastrear la navegación

    const loadViewFunction = viewsMap[viewName];

    if (loadViewFunction) {
        loadViewFunction(params);
    } else {
        // ! Error: Vista desconocida o no implementada
        console.error(`Vista desconocida o no implementada: "${viewName}"`);
        contentArea.innerHTML = `<p class="text-red-500 font-bold">Error:</p><p class="text-red-500">La vista solicitada "${viewName}" no está implementada.</p>`;
    }

    if (mobileMenu.classList.contains('max-h-screen')) {
        // * Cierra el menú móvil si está abierto al navegar
        mobileMenu.classList.remove('max-h-screen');
        mobileMenu.classList.add('max-h-0');
    }
}


// ===============================================================
// * INICIALIZACIÓN DE LA APLICACIÓN Y MANEJO DE EVENTOS GLOBALES
// * Aquí engancho los eventos de navegación a los elementos con data-view y renderizo la vista inicial.
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado. Iniciando configuración de eventos.'); // * Log para saber cuándo el DOM está listo

    const viewTriggerElements = document.querySelectorAll('[data-view]');
    viewTriggerElements.forEach(element => {
        element.addEventListener('click', (event) => {
            event.preventDefault(); // * Evita el comportamiento por defecto del enlace
            const viewName = element.dataset.view;
            const params = null;
            navigateTo(viewName, params);
        });
    });

    renderHomeView(); // * Carga la vista Home al iniciar la aplicación
});

// * Script básico para el menú hamburguesa (permite abrir/cerrar el menú en móvil)
document.getElementById('hamburger-button').addEventListener('click', function() {
    mobileMenu.classList.toggle('max-h-0');
    mobileMenu.classList.toggle('max-h-screen');
});