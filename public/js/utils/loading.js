// public/js/utils/loading.js
// //* Módulo utilitario para manejar spinners de carga en toda la aplicación

/**
 //* Muestra un spinner de carga con mensaje personalizable
 //* @param {HTMLElement} container - Contenedor donde mostrar el spinner
 //* @param {string} message - Mensaje a mostrar debajo del spinner
 //* @param {string} color - Color del spinner (default: 'success')
 //*/
export function showLoadingSpinner(container, message = 'Cargando...') {
    const target = container || document.getElementById('content-area');
    target.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
            <div class="spinner-border mb-3" role="status" style="width: 3rem; height: 3rem; border-color: #13b497; border-right-color: transparent;"></div>
            <p class="text-body h5">${message}</p>
        </div>
    `;
}

/**
 //* Muestra un spinner de carga para formularios
 //* @param {string} action - Acción que se está realizando (Crear/Editar)
 //* @param {string} resource - Recurso sobre el que se actúa (empleado, equipo, etc.)
 //*/
export function showFormLoading(action = 'Crear', resource = 'recurso') {
    const contentArea = document.getElementById('content-area');
    showLoadingSpinner(contentArea, `Cargando formulario para ${action.toLowerCase()} ${resource}...`);
}

/**
 //* Muestra un spinner de carga para listas
 //* @param {HTMLElement} container - Contenedor donde mostrar el spinner
 //* @param {string} resource - Recurso que se está cargando (empleados, equipos, etc.)
 //*/
export function showListLoading(container, resource = 'datos') {
    showLoadingSpinner(container, `Cargando lista de ${resource}...`);
}

/**
 //* Muestra un spinner de carga para detalles
 //* @param {string} resource - Recurso del que se cargan los detalles
 //* @param {string|number} id - ID del recurso
 //*/
export function showDetailsLoading(resource = 'recurso', id) {
    const contentArea = document.getElementById('content-area');
    showLoadingSpinner(contentArea, `Cargando detalles del ${resource} ID: ${id}...`);
} 