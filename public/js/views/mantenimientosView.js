// public/js/views/mantenimientosView.js
// * Este módulo se encarga de toda la lógica para la vista de listado
// * de los registros de Mantenimiento de equipos.

//? ¿Necesitaré importar 'deleteMantenimiento' aquí o en una vista de detalle/modal?
import { getMantenimientos, deleteMantenimiento } from '../api.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// * Muestra un mensaje de carga mientras se obtienen los datos de los mantenimientos.
function showMantenimientosLoading() {
    contentArea.innerHTML = '<p>Cargando lista de Mantenimientos...</p>';
}

// * Muestra un mensaje de error si falla la carga de datos.
function showMantenimientosError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Mantenimientos:</p><p class="text-red-500">${message}</p>`;
}

// * Renderiza la tabla de mantenimientos con los datos obtenidos.
function renderMantenimientosTable(mantenimientos) {
    contentArea.innerHTML = ''; // Limpio cualquier contenido previo.

    if (!mantenimientos || mantenimientos.length === 0) {
        contentArea.innerHTML = '<p>No hay registros de mantenimiento en el sistema.</p>';
        return; // No hay nada más que hacer si no hay datos.
    }

    // * Creo el título para esta vista.
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Mantenimientos de Equipos';
    contentArea.appendChild(title);

    // * Botón para "Registrar Nuevo Mantenimiento".
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    // Uso un color diferente para este botón, por ejemplo, naranja.
    createButton.classList.add('bg-orange-500', 'hover:bg-orange-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nuevo Mantenimiento';
    createButton.addEventListener('click', () => {
        //TODO: Implementar la navegación al formulario de creación de mantenimientos.
        // Ejemplo: navigateTo('mantenimientoForm');
        console.log('Herwing quiere mostrar el formulario para registrar un nuevo mantenimiento.');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    // * Creación de la tabla y sus elementos.
    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');

    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');

    // * Defino las columnas que tendrá la tabla.
    // * 'prop' debe coincidir con el nombre de la propiedad en los objetos de datos de la API.
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'Equipo (Serie)', prop: 'equipo_numero_serie' }, // Del JOIN
        { text: 'Equipo (Nombre)', prop: 'equipo_nombre' },    // Del JOIN
        { text: 'Fecha Inicio', prop: 'fecha_inicio' },
        { text: 'Fecha Fin', prop: 'fecha_fin' },
        { text: 'Diagnóstico', prop: 'diagnostico' },
        { text: 'Estado', prop: 'status_nombre' }, // Del JOIN
        { text: 'Acciones', prop: null }
    ];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.classList.add('py-3', 'px-6', 'text-left', 'border-b', 'border-gray-200');
        if (!header.prop && header.text === 'Acciones') th.classList.add('text-center');
        th.textContent = header.text;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.classList.add('text-gray-600', 'text-sm', 'font-light');

    mantenimientos.forEach(mantenimiento => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = mantenimiento.id; // Guardo el ID en el atributo data-id de la fila.

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                // Formateo básico para fechas (solo la parte de la fecha si es un timestamp completo).
                if ((header.prop === 'fecha_inicio' || header.prop === 'fecha_fin') && mantenimiento[header.prop]) {
                    td.textContent = mantenimiento[header.prop].split('T')[0]; // Muestra YYYY-MM-DD
                } else {
                    td.textContent = mantenimiento[header.prop] || 'N/A'; // Muestro N/A si el valor es nulo o vacío.
                }
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else {
                // * Columna de Acciones.
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles (si decido implementar una vista de detalle).
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación a la vista de detalles del mantenimiento.
                    // Ejemplo: navigateTo('mantenimientoDetails', { id: mantenimiento.id });
                    console.log('Herwing quiere ver los detalles del mantenimiento con ID:', mantenimiento.id);
                });

                // * Botón Editar.
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación al formulario de edición del mantenimiento.
                    // Ejemplo: navigateTo('mantenimientoForm', { id: mantenimiento.id });
                    console.log('Herwing quiere editar el mantenimiento con ID:', mantenimiento.id);
                });

                // * Botón Eliminar.
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    //TODO: Implementar un modal de confirmación más elegante.
                    if (confirm(`¿Estás seguro de eliminar el registro de mantenimiento (ID: ${mantenimiento.id}) para el equipo "${mantenimiento.equipo_numero_serie}"?`)) {
                        console.log('Confirmada eliminación para mantenimiento con ID:', mantenimiento.id);
                        try {
                            await deleteMantenimiento(mantenimiento.id); // Uso la función de api.js
                            console.log('Registro de mantenimiento eliminado exitosamente:', mantenimiento.id);
                            loadMantenimientosList(); // Recargo la lista para reflejar el cambio.
                        } catch (error) {
                            console.error('Error al eliminar registro de mantenimiento:', error);
                            alert('Error al eliminar el registro de mantenimiento: ' + error.message);
                        }
                    }
                });

                actionsContainer.appendChild(viewButton);
                actionsContainer.appendChild(editButton);
                actionsContainer.appendChild(deleteButton);
                td.appendChild(actionsContainer);
            }

            row.appendChild(td);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    contentArea.appendChild(table); // Agrego la tabla completa al área de contenido.

    console.log('Tabla de Mantenimientos renderizada.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
// Esta es la función que será llamada desde main.js para mostrar esta vista.
// ===============================================================
async function loadMantenimientosList() {
    console.log('Cargando vista de lista de Mantenimientos...');
    showMantenimientosLoading(); // Muestro el mensaje de carga.
    try {
        const mantenimientos = await getMantenimientos(); // Llamo a la API.
        renderMantenimientosTable(mantenimientos); // Renderizo la tabla con los datos.
    } catch (error) {
        showMantenimientosError(error.message); // Muestro un error si algo falla.
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// Exporto la función principal para que main.js pueda usarla.
// ===============================================================
export { loadMantenimientosList };