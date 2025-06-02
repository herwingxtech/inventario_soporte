// public/js/views/asignacionesView.js
// * Este módulo se encarga de toda la lógica para la vista de listado
// * de los registros de Asignaciones de equipos.

//? ¿Qué funciones de 'api.js' necesitaré importar aquí?
//? Por ahora 'getAsignaciones' y 'deleteAsignacion'.
import { getAsignaciones, deleteAsignacion } from '../api.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// * Muestra un mensaje de carga mientras se obtienen los datos de las asignaciones.
function showAsignacionesLoading() {
    contentArea.innerHTML = '<p>Cargando lista de Asignaciones...</p>';
}

// * Muestra un mensaje de error si falla la carga de datos.
function showAsignacionesError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Asignaciones:</p><p class="text-red-500">${message}</p>`;
}

// * Renderiza la tabla de asignaciones con los datos obtenidos.
function renderAsignacionesTable(asignaciones) {
    contentArea.innerHTML = ''; // Limpio cualquier contenido previo.

    if (!asignaciones || asignaciones.length === 0) {
        contentArea.innerHTML = '<p>No hay registros de asignación en el sistema.</p>';
        return; // No hay nada más que hacer si no hay datos.
    }

    // * Creo el título para esta vista.
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Asignaciones de Equipos';
    contentArea.appendChild(title);

    // * Botón para "Crear Nueva Asignación".
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    // Usando un color púrpura para este botón, como en la tarjeta del home.
    createButton.classList.add('bg-purple-500', 'hover:bg-purple-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nueva Asignación';
    createButton.addEventListener('click', () => {
        //TODO: Implementar la navegación al formulario de creación de asignaciones.
        // Ejemplo: navigateTo('asignacionForm');
        console.log('Herwing quiere mostrar el formulario para crear una nueva asignación.');
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
        { text: 'Asignado A', prop: null }, // Combinaremos a quién/dónde está asignado
        { text: 'IP Asignada', prop: 'ip_direccion' }, // Del JOIN
        { text: 'Fecha Asignación', prop: 'fecha_asignacion' },
        { text: 'Fecha Fin', prop: 'fecha_fin_asignacion' },
        { text: 'Estado Asignación', prop: 'status_nombre' }, // Del JOIN
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

    asignaciones.forEach(asignacion => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = asignacion.id; // Guardo el ID en el atributo data-id de la fila.

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                // Formateo básico para fechas (fecha y hora).
                if ((header.prop === 'fecha_asignacion' || header.prop === 'fecha_fin_asignacion') && asignacion[header.prop]) {
                    td.textContent = new Date(asignacion[header.prop]).toLocaleString(); // Muestra fecha y hora local.
                } else {
                    td.textContent = asignacion[header.prop] || 'N/A'; // Muestro N/A si el valor es nulo o vacío.
                }
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');

            } else if (header.text === 'Asignado A') {
                // * Muestro a quién/dónde está asociada la asignación.
                let asignadoA = [];
                if (asignacion.id_empleado) {
                    asignadoA.push(`Empleado: ${asignacion.empleado_nombres || ''} ${asignacion.empleado_apellidos || ''} (ID: ${asignacion.id_empleado})`);
                }
                if (asignacion.id_sucursal_asignado) {
                    asignadoA.push(`Sucursal: ${asignacion.sucursal_asignada_nombre || ''} (ID: ${asignacion.id_sucursal_asignado})`);
                }
                if (asignacion.id_area_asignado) {
                    asignadoA.push(`Área: ${asignacion.area_asignada_nombre || ''} (ID: ${asignacion.id_area_asignado})`);
                }
                // Si no hay ninguno (ej. asignación histórica sin detalles), mostrar N/A.
                td.textContent = asignadoA.length > 0 ? asignadoA.join('; ') : 'N/A';
                td.classList.remove('whitespace-nowrap'); // Permitir que este campo se ajuste si es largo
                td.classList.add('whitespace-normal', 'max-w-xs'); // Limitar ancho y permitir ajuste
            } else {
                // * Columna de Acciones.
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles.
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación a la vista de detalles de la asignación.
                    // Ejemplo: navigateTo('asignacionDetails', { id: asignacion.id });
                    console.log('Herwing quiere ver los detalles de la asignación con ID:', asignacion.id);
                });

                // * Botón Editar (o Finalizar si es activa).
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                // Si la asignación es activa (no tiene fecha_fin_asignacion), el botón podría ser "Finalizar".
                // Si es histórica, podría ser "Editar" (aunque editar históricos suele ser menos común).
                const isActiva = !asignacion.fecha_fin_asignacion;
                editButton.innerHTML = isActiva
                    ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' // Icono de check/finalizar
                    : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>'; // Icono de editar
                editButton.title = isActiva ? 'Finalizar Asignación' : 'Editar Asignación';
                editButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación al formulario de edición/finalización.
                    // Ejemplo: navigateTo('asignacionForm', { id: asignacion.id, finalizar: isActiva });
                    console.log('Herwing quiere editar/finalizar la asignación con ID:', asignacion.id);
                });

                // * Botón Eliminar (usualmente no se eliminan asignaciones históricas, pero por completitud).
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    //TODO: Implementar un modal de confirmación más elegante.
                    if (confirm(`¿Estás seguro de eliminar el registro de asignación (ID: ${asignacion.id})?`)) {
                        console.log('Confirmada eliminación para asignación con ID:', asignacion.id);
                        try {
                            await deleteAsignacion(asignacion.id); // Uso la función de api.js
                            console.log('Registro de asignación eliminado exitosamente:', asignacion.id);
                            loadAsignacionesList(); // Recargo la lista para reflejar el cambio.
                        } catch (error) {
                            console.error('Error al eliminar registro de asignación:', error);
                            alert('Error al eliminar el registro de asignación: ' + error.message);
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

    console.log('Tabla de Asignaciones renderizada.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
// Esta es la función que será llamada desde main.js para mostrar esta vista.
// ===============================================================
async function loadAsignacionesList() {
    console.log('Cargando vista de lista de Asignaciones...');
    showAsignacionesLoading(); // Muestro el mensaje de carga.
    try {
        // Por defecto, podríamos querer mostrar solo las asignaciones activas.
        // Para ello, usaríamos el filtro en getAsignaciones.
        // const asignaciones = await getAsignaciones({ activa: 'true' });
        // O mostrar todas por defecto:
        const asignaciones = await getAsignaciones(); // Llamo a la API.
        renderAsignacionesTable(asignaciones); // Renderizo la tabla con los datos.
    } catch (error) {
        showAsignacionesError(error.message); // Muestro un error si algo falla.
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// Exporto la función principal para que main.js pueda usarla.
// ===============================================================
export { loadAsignacionesList };