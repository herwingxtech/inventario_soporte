// public/js/main.js
// Este es el archivo JavaScript principal de tu frontend.
// Se encarga de la inicialización general, la configuración de eventos globales (ej. navegación),
// y la orquestación de la carga de diferentes vistas en el área de contenido principal.

console.log('Frontend JavaScript principal cargado. Configurando aplicación...');

// ===============================================================
// IMPORTACIONES DE MÓDULOS DE VISTA
// Importamos las funciones que cargan y renderizan cada vista específica.
// ===============================================================

import { loadEquiposList } from './views/equiposView.js';
import { loadEmpleadosList } from './views/empleadosView.js';
import { loadDireccionesIpList } from './views/direccionesIpView.js'; // Importamos la función para listar Direcciones IP.



// ===============================================================
// ELEMENTOS DEL DOM GLOBALES (igual que antes)
// ===============================================================
const contentArea = document.getElementById('content-area');
const mobileMenu = document.getElementById('mobile-menu');


// ===============================================================
// MAPEO DE VISTAS (actualizado)
// Objeto que mapea nombres de vista a las funciones que las cargan/renderizan.
// ===============================================================

// Función para renderizar el contenido inicial de la vista 'home'.
function renderHomeView() {
    console.log('Renderizando vista Home.');
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
            </div>
             <div class="bg-purple-100 p-4 rounded-lg shadow-md">
                <h3 class="font-semibold text-purple-800 mb-2">Asignaciones y Ubicaciones</h3>
                <p class="text-purple-700 text-sm">Rastrea dónde y a quién están asignados los equipos.</p>
                 <button class="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-600/90" data-view="asignacionesList">Ver Asignaciones</button>
            </div>
            <!-- TODO: Añadir más tarjetas para otras secciones si lo deseas, con data-view -->
        </div>
    `;
}


// Objeto que mapea nombres de vista (del atributo data-view) a las funciones
// que son responsables de cargar y renderizar esa vista.
const viewsMap = {
    'home': renderHomeView,
    'equiposList': loadEquiposList,
    'empleadosList': loadEmpleadosList,
    'direccionesIpList': loadDireccionesIpList, // Añadimos la función para listar Direcciones IP.
    // <------------------->
    // TODO: Añadir mapeos para las otras vistas a medida que las crees:
    // 'asignacionesList': loadAsignacionesList,
    // ... etc.
};


// ===============================================================
// FUNCIÓN DE NAVEGACIÓN CENTRALIZADA (igual que antes)
// ===============================================================

function navigateTo(viewName, params = null) {
    console.log(`Navegando a la vista: "${viewName}" con parámetros:`, params);

    const loadViewFunction = viewsMap[viewName];

    if (loadViewFunction) {
        loadViewFunction(params);
    } else {
        console.error(`Vista desconocida o no implementada: "${viewName}"`);
        contentArea.innerHTML = `<p class="text-red-500 font-bold">Error:</p><p class="text-red-500">La vista solicitada "${viewName}" no está implementada.</p>`;
    }

    if (mobileMenu.classList.contains('max-h-screen')) {
        mobileMenu.classList.remove('max-h-screen');
        mobileMenu.classList.add('max-h-0');
    }
}


// ===============================================================
// INICIALIZACIÓN DE LA APLICACIÓN Y MANEJO DE EVENTOS GLOBALES (igual que antes)
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado. Iniciando configuración de eventos.');

    const viewTriggerElements = document.querySelectorAll('[data-view]');
    viewTriggerElements.forEach(element => {
        element.addEventListener('click', (event) => {
            event.preventDefault();
            const viewName = element.dataset.view;
            const params = null;
            navigateTo(viewName, params);
        });
    });

    renderHomeView();
});

// Script básico para el menú hamburguesa (igual que antes)
document.getElementById('hamburger-button').addEventListener('click', function() {
    mobileMenu.classList.toggle('max-h-0');
    mobileMenu.classList.toggle('max-h-screen');
});