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
// TODO: Importar funciones para cargar otras vistas a medida que las crees.
// import { loadEmpleadosList } from './views/empleadosView.js';
// import { loadDireccionesIpList } from './views/direccionesIpView.js';
// import { loadCuentasEmailList } from './views/cuentasEmailView.js';
// import { loadMantenimientosList } from './views/mantenimientosView.js';
// import { loadNotasList } from './views/notasView.js';
// import { loadAsignacionesList } from './views/asignacionesView.js';
// TODO: Importar funciones para vistas de detalle/formulario (ej. showEquipoDetails, showEquipoForm)

// ===============================================================
// ELEMENTOS DEL DOM GLOBALES
// Obtenemos referencias a elementos que usaremos en varias partes.
// ===============================================================
const contentArea = document.getElementById('content-area'); // El contenedor principal donde se cargan las vistas.
const mobileMenu = document.getElementById('mobile-menu'); // Referencia al menú desplegable móvil.


// ===============================================================
// MAPEO DE VISTAS
// Objeto que mapea nombres de vista a las funciones que las cargan/renderizan.
// ===============================================================

// Función para renderizar el contenido inicial de la vista 'home'.
function renderHomeView() {
    console.log('Renderizando vista Home.');
    contentArea.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Bienvenido a tu Inventario IT</h2>
        <p class="text-gray-700 mb-6">Selecciona una opción del menú para empezar a gestionar tus activos.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Tarjetas con enlaces o botones que activan la navegación a vistas específicas -->
            <!-- Usamos data-view en los botones para que el listener global los capture -->
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
    `; // Usamos template literals para el HTML de la vista home.
}


// Objeto que mapea nombres de vista (del atributo data-view) a las funciones
// que son responsables de cargar y renderizar esa vista.
const viewsMap = {
    'home': renderHomeView, // La función que renderiza la vista inicial
    'equiposList': loadEquiposList, // La función del módulo equiposView.js para listar equipos.
    // TODO: Añadir mapeos para las otras vistas a medida que las crees:
    // 'empleadosList': loadEmpleadosList,
    // 'direccionesIpList': loadDireccionesIpList,
    // 'cuentasEmailList': loadCuentasEmailList,
    // 'mantenimientosList': loadMantenimientosList,
    // 'notasList': loadNotasList,
    // 'asignacionesList': loadAsignacionesList,
    // 'equipoDetails': showEquipoDetails, // Ejemplo de vista de detalle, recibiría { id: ... }
    // 'equipoForm': showEquipoForm, // Ejemplo de vista de formulario, recibiría { id: ... } o null
    // 'profile': showProfileView, // Ejemplo de vista de perfil de usuario
};


// ===============================================================
// FUNCIÓN DE NAVEGACIÓN CENTRALIZADA
// Esta función es llamada para cambiar la vista que se muestra en contentArea.
// ===============================================================

// viewName: string que identifica la vista a cargar (ej. 'equiposList', 'home').
// params: opcional, objeto con parámetros necesarios para la vista (ej. { id: 5 } para detalles).
function navigateTo(viewName, params = null) {
    console.log(`Navegando a la vista: "${viewName}" con parámetros:`, params);

    // Busca la función de carga de la vista en el mapa.
    const loadViewFunction = viewsMap[viewName];

    if (loadViewFunction) {
        // Si la función existe, la llama.
        // La función de la vista es responsable de limpiar contentArea y renderizar su contenido.
        loadViewFunction(params); // Pasa los parámetros a la función de la vista.
    } else {
        // Si el nombre de vista no está en el mapa, muestra un error.
        console.error(`Vista desconocida o no implementada: "${viewName}"`);
        contentArea.innerHTML = `<p class="text-red-500 font-bold">Error:</p><p class="text-red-500">La vista solicitada "${viewName}" no está implementada.</p>`;
    }

    // Cierra el menú móvil si está abierto después de la navegación (mejora de UX).
    if (mobileMenu.classList.contains('max-h-screen')) {
        mobileMenu.classList.remove('max-h-screen');
        mobileMenu.classList.add('max-h-0');
    }

    // TODO: Implementar la actualización de la URL del navegador (History API)
    // para permitir el uso de los botones de atrás/adelante.
    // Ejemplo: history.pushState({ view: viewName, params: params }, '', `#${viewName}`); // Usando el hash.
    // O con rutas limpias (requiere configuración adicional en Express para SPAs):
    // history.pushState({ view: viewName, params: params }, '', `/${viewName}`);
}


// ===============================================================
// INICIALIZACIÓN DE LA APLICACIÓN Y MANEJO DE EVENTOS GLOBALES
// Se ejecuta una vez que el DOM está listo.
// ===============================================================

// Espera a que el DOM (estructura HTML) esté completamente cargado.
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado. Iniciando configuración de eventos.');

    // === Configurar Event Listeners para Navegación ===
    // Selecciona todos los elementos que tienen el atributo `data-view`.
    // Estos son los elementos clickeables que activarán un cambio de vista.
    const viewTriggerElements = document.querySelectorAll('[data-view]');

    viewTriggerElements.forEach(element => {
        // Añade un listener para el evento 'click' a cada elemento.
        element.addEventListener('click', (event) => {
            // Previene el comportamiento por defecto del elemento (ej. no seguir el href de un enlace).
            event.preventDefault();

            // Obtiene el nombre de la vista del atributo `data-view`.
            const viewName = element.dataset.view;

            // TODO: Obtener parámetros si el elemento los tuviera (ej. data-params='{"id": 123}').
            // const params = element.dataset.params ? JSON.parse(element.dataset.params) : null;
            const params = null; // Por ahora, las vistas de lista no necesitan parámetros iniciales.

            // Llama a la función de navegación centralizada.
            navigateTo(viewName, params);
        });
    });

    // TODO: Configurar listener para botones de acción generales (ej. Logout) si usan data-action
    // const actionTriggerElements = document.querySelectorAll('[data-action]');
    // actionTriggerElements.forEach(element => {
    //    element.addEventListener('click', handleGlobalActions); // Crear función handleGlobalActions
    // });


    // === Carga de la vista inicial al cargar la página ===
    // Decidimos qué vista mostrar por defecto cuando el usuario llega a index.html.
    // Podemos:
    // 1. Cargar una vista específica por defecto (ej. 'home' o 'equiposList').
    // 2. Leer la URL (ej. el hash #equiposList) para cargar una vista específica si hay un enlace directo.
    // Por ahora, cargamos la vista 'home' por defecto.

    // Si quieres cargar una vista específica al inicio, descomenta y ajusta:
    // navigateTo('equiposList');

    // Si quieres cargar la vista 'home' (contenida en el HTML inicial y renderizada por JS):
     renderHomeView(); // <-- Renderiza la vista Home definida en JS.
     // Nota: El HTML inicial ya tiene el contenido de home, pero renderizarlo con JS aquí
     // asegura que se apliquen las clases de Tailwind de las tarjetas si decides añadirlas dinámicamente después,
     // y establece el patrón de que todas las vistas se cargan a través de JS.

    // Si decides usar ruteo basado en URL/hash, puedes hacer algo como:
    // const initialView = window.location.hash ? window.location.hash.substring(1) : 'home';
    // navigateTo(initialView);


    // TODO: Implementar ruteo basado en el historial (History API) para manejar botones atrás/adelante
    // window.addEventListener('popstate', (event) => {
    //    const state = event.state; // Obtiene el estado guardado con pushState
    //    if (state && state.view) {
    //        navigateTo(state.view, state.params); // Navega a la vista guardada en el historial
    //    } else {
    //        // Si no hay estado o hash, navega a la vista por defecto (ej. home)
    //        navigateTo('home');
    //    }
    // });


});

// Script básico para el menú hamburguesa (puede quedarse aquí o en index.html).
// Lo ponemos aquí si queremos que tenga acceso a 'mobileMenu' y 'navigateTo' si fuera necesario,
// pero solo la lógica básica de toggle puede quedarse en index.html.
// Aquí lo dejamos para centralizar JS.
document.getElementById('hamburger-button').addEventListener('click', function() {
    // Toggle between max-h-0 (hidden) and max-h-screen (visible) classes.
    mobileMenu.classList.toggle('max-h-0');
    mobileMenu.classList.toggle('max-h-screen');
    // Opcional: Si el menú se abre, quizás no queremos que se cierre automáticamente al hacer clic en los enlaces dentro
    // del menú mismo (los listeners de navegación ya lo cierran al llamar a navigateTo).
});