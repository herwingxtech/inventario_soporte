// public/js/utils/error.js
//// * Módulo utilitario para manejar errores de manera consistente en toda la aplicación

/**
// * Muestra un error con diseño atractivo y opciones de acción
// * @param {HTMLElement} container - Contenedor donde mostrar el error
// * @param {string} title - Título del error
// * @param {string} message - Mensaje detallado del error
// * @param {Object} options - Opciones adicionales
// * @param {string} options.action - Acción que falló (ej: 'cargar', 'guardar', 'eliminar')
// * @param {string} options.resource - Recurso afectado (ej: 'asignaciones', 'empleados')
// * @param {string} options.backRoute - Ruta para el botón "Volver"
// * @param {Function} options.onRetry - Función para reintentar la acción
// */
export function showError(container, title, message, options = {}) {
    const target = container || document.getElementById('content-area');
    const { action = 'procesar', resource = 'datos', backRoute, onRetry } = options;
    
    target.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12">
            <!-- Icono de error -->
            <div class="mb-6">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                    <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
            </div>
            
            <!-- Título del error -->
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
            
            <!-- Mensaje del error -->
            <p class="text-gray-600 text-center max-w-md mb-6">${message}</p>
            
            <!-- Botones de acción -->
            <div class="flex flex-col sm:flex-row gap-3">
                ${onRetry ? `
                    <button onclick="window.retryAction()" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        <svg class="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Reintentar
                    </button>
                ` : ''}
                
                ${backRoute ? `
                    <button onclick="window.navigateTo('${backRoute}')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                        <svg class="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Volver
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Hacer la función de retry disponible globalmente si existe
    if (onRetry) {
        window.retryAction = onRetry;
    }
}

/**
// * Muestra un error para listas de datos
// * @param {HTMLElement} container - Contenedor donde mostrar el error
// * @param {string} resource - Recurso que falló al cargar
// * @param {string} message - Mensaje detallado del error
// * @param {string} backRoute - Ruta para volver
// * @param {Function} onRetry - Función para reintentar
// */
export function showListError(container, resource, message, backRoute = null, onRetry = null) {
    showError(container, `Error al cargar ${resource}`, message, {
        action: 'cargar',
        resource: resource,
        backRoute: backRoute,
        onRetry: onRetry
    });
}

/**
// * Muestra un error para formularios
// * @param {string} action - Acción que falló (Crear/Editar)
// * @param {string} resource - Recurso que se estaba procesando
// * @param {string} message - Mensaje detallado del error
// * @param {Function} onRetry - Función para reintentar
// */
export function showFormError(action, resource, message, onRetry = null) {
    showError(null, `Error al ${action.toLowerCase()} ${resource}`, message, {
        action: action.toLowerCase(),
        resource: resource,
        onRetry: onRetry
    });
}

/**
// * Muestra un error para detalles
// * @param {string} resource - Recurso del que se cargaban los detalles
// * @param {string|number} id - ID del recurso
// * @param {string} message - Mensaje detallado del error
// * @param {string} backRoute - Ruta para volver
// * @param {Function} onRetry - Función para reintentar
// */
export function showDetailsError(resource, id, message, backRoute = null, onRetry = null) {
    showError(null, `Error al cargar detalles del ${resource}`, message, {
        action: 'cargar',
        resource: resource,
        backRoute: backRoute,
        onRetry: onRetry
    });
}

/**
// * Muestra un error simple sin botones de acción
// * @param {HTMLElement} container - Contenedor donde mostrar el error
// * @param {string} message - Mensaje del error
// */
export function showSimpleError(container, message) {
    const target = container || document.getElementById('content-area');
    target.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
} 