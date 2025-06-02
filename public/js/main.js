// public/js/main.js
// ! Archivo principal JS del frontend
// * Este archivo inicializa la SPA, configura eventos globales y orquesta la carga de vistas. Uso importaciones modulares para mantener el código organizado y limpio.

console.log('Frontend JavaScript principal cargado. Configurando aplicación...'); // * Log para saber que el script principal cargó

// ===============================================================
// * IMPORTACIONES DE MÓDULOS DE VISTA
// * Importo funciones para cargar/renderizar cada vista específica. Así mantengo el código desacoplado y fácil de mantener.
// ===============================================================

import { loadEquiposList } from './views/equiposView.js';
import { showEquipoForm } from './views/equipoFormView.js';
import { showEquipoDetails } from './views/equipoDetailsView.js';
import { loadEmpleadosList } from './views/empleadosView.js';
import { loadDireccionesIpList } from './views/direccionesIpView.js';
import { loadCuentasEmailList } from './views/cuentasEmailView.js'; 
import { loadMantenimientosList } from './views/mantenimientosView.js';
import { loadNotasList } from './views/notasView.js';
import { loadAsignacionesList } from './views/asignacionesView.js';



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
  console.log('Renderizando vista Home por Herwing.');
    contentArea.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Bienvenido a tu Inventario IT</h2>
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
                 <!-- //TODO: Botón "Nuevo Empleado" con data-view="empleadoForm" -->
            </div>
             <div class="bg-purple-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-purple-800 mb-2">Asignaciones y Ubicaciones</h3>
                <p class="text-purple-700 text-sm">Rastrea dónde y a quién están asignados los equipos.</p>
                 <button class="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-600/90" data-view="asignacionesList">Ver Asignaciones</button>
                 <!-- //TODO: Botón "Nueva Asignación" con data-view="asignacionForm" -->
            </div>
            <div class="bg-yellow-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-yellow-800 mb-2">Direcciones IP</h3>
                <p class="text-yellow-700 text-sm">Gestión de direcciones IP de la red.</p>
                 <button class="mt-3 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-600/90" data-view="direccionesIpList">Ver IPs</button>
                 <!-- //TODO: Botón "Nueva IP" con data-view="direccionIpForm" -->
            </div>
            <div class="bg-indigo-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-indigo-800 mb-2">Cuentas de Email</h3>
                <p class="text-indigo-700 text-sm">Inventario de cuentas de correo corporativas.</p>
                 <button class="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-600/90" data-view="cuentasEmailList">Ver Emails</button>
                 <!-- //TODO: Botón "Nueva Cuenta Email" con data-view="cuentaEmailForm" -->
            </div>
            <div class="bg-orange-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-orange-800 mb-2">Mantenimientos</h3>
                <p class="text-orange-700 text-sm">Historial de servicio de los equipos.</p>
                 <button class="mt-3 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-600/90" data-view="mantenimientosList">Ver Mantenimientos</button>
                 <!-- //TODO: Botón "Nuevo Mantenimiento" con data-view="mantenimientoForm" -->
            </div>
            <div class="bg-cyan-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-cyan-800 mb-2">Notas</h3>
                <p class="text-cyan-700 text-sm">Notas y apuntes generales del sistema.</p>
                 <button class="mt-3 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-600/90" data-view="notasList">Ver Notas</button>
                 <!-- //TODO: Botón "Nueva Nota" con data-view="notaForm" -->
            </div>
        </div>
    `;
}

// * Objeto que mapea nombres de vista (del atributo data-view) a las funciones que las cargan/renderizan.
const viewsMap = {
    'home': renderHomeView,
    'equiposList': loadEquiposList,
    'equipoForm': showEquipoForm,
    'equipoDetails': showEquipoDetails,
    'empleadosList': loadEmpleadosList,
    'direccionesIpList': loadDireccionesIpList,
    'cuentasEmailList': loadCuentasEmailList,
    'mantenimientosList': loadMantenimientosList,
    'notasList': loadNotasList,
    'asignacionesList': loadAsignacionesList

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

// Hacer navigateTo global para que otros módulos puedan usarla
window.navigateTo = navigateTo;


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