// ! Vista de listado de equipos
// * Si la API cambia, revisa los headers y los nombres de las propiedades. Si la UX se siente lenta, revisa el renderizado de la tabla.
// * Consejo: Si agregas más columnas o cambias la estructura de equipos, actualiza el array 'headers'.
// * ADVERTENCIA: No olvides manejar los errores de red, especialmente si el backend está caído o el equipo tiene asignaciones activas.
// * Si la tabla crece mucho, considera paginación o virtualización para no saturar el DOM.
// * Aquí gestiono la lógica de renderizado, eventos y consumo de API para la tabla de equipos. Los TODO son recordatorios personales para refactorizar o mejorar la UX/UI.

// * Importo las funciones de la API que necesito para obtener y eliminar equipos.
import { getEquipos, deleteEquipo } from '../api.js';
import { showConfirmationModal } from '../ui/modal.js'; // Importo la función del modal.    
import { showInfoModal } from '../ui/modal.js'; // Importo la función del modal.

// ===============================================================
// * ELEMENTOS DEL DOM RELACIONADOS CON ESTA VISTA
// * Referencia al área principal donde se renderiza la tabla y mensajes.
// ===============================================================
const contentArea = document.getElementById('content-area');


// ===============================================================
// * FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// * Funciones para mostrar estado (carga, error) y renderizar la tabla de datos.
// ===============================================================

function showEquiposLoading() {
    // * Muestra mensaje de carga en el área principal de equipos.
    contentArea.innerHTML = '<p>Cargando lista de equipos...</p>';
}

function showEquiposError(message) {
    // ! Error al cargar equipos, se muestra mensaje destacado al usuario.
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar equipos:</p><p class="text-red-500">${message}</p>`;
}

// * Renderiza la lista de equipos en una tabla HTML. Incluye lógica para mostrar N/A y botones de acción.
function renderEquiposTable(equipos) {
    // * Limpia el contenido anterior antes de renderizar la tabla.
    contentArea.innerHTML = '';
    // * Renderiza el título de la vista
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Equipos';
    contentArea.appendChild(title);

    // * Botón para crear nuevo equipo
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nuevo Equipo';
    createButton.addEventListener('click', () => {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('equipoForm'); // Llama a navigateTo para mostrar el formulario
        } else {
            console.error('La función navigateTo no está disponible globalmente. Revisa main.js.');
        }
        console.log('Herwing quiere mostrar el formulario para crear un nuevo equipo.');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    if (!equipos || equipos.length === 0) {
        // ! No hay equipos registrados en la base de datos.
        const noData = document.createElement('p');
        noData.textContent = 'No hay equipos registrados en el inventario.';
        contentArea.appendChild(noData);
        return;
    }


    // * Crea el elemento tabla y le añade clases de estilo.
    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');

    // * Crea la cabecera de la tabla y le añade clases de estilo.
    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');

    // * Define las columnas de la cabecera (Texto visible, Nombre de la propiedad en los datos).
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'Número Serie', prop: 'numero_serie' },
        { text: 'Nombre Equipo', prop: 'nombre_equipo' },
        { text: 'Tipo', prop: 'nombre_tipo_equipo' },
        { text: 'Ubicación Actual', prop: 'nombre_sucursal_actual' },
        { text: 'Estado', prop: 'status_nombre' },
        { text: 'Acciones', prop: null }
    ];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.classList.add('py-3', 'px-6', 'text-left', 'border-b', 'border-gray-200');
        // * Centra el texto en la columna de Acciones.
        if (!header.prop) th.classList.add('text-center');
        th.textContent = header.text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // * Crea el cuerpo de la tabla y le añade clases de estilo.
    const tbody = document.createElement('tbody');
    tbody.classList.add('text-gray-600', 'text-sm', 'font-light');

    // * Itera sobre cada equipo para crear una fila en la tabla.
    equipos.forEach(equipo => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        // * Guarda el ID del equipo en el atributo data-id de la fila para referencia.
        row.dataset.id = equipo.id;

        // * Itera sobre las columnas para crear celdas en la fila.
        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                // * Si la columna es fecha (basado en el nombre de la propiedad), muestra solo la parte de fecha.
                if (header.prop.includes('fecha') && equipo[header.prop]) {
                    // TODO: Implementar un formateo de fechas más amigable si es necesario para el usuario final.
                    td.textContent = equipo[header.prop].split('T')[0];
                } else {
                    // * Muestra el valor de la propiedad o 'N/A' si es nulo/vacío.
                    td.textContent = equipo[header.prop] || 'N/A';
                }
                // * Centra el texto en la columna ID para destacarlo.
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else {
                // * Renderiza los botones de acción (Ver, Editar, Eliminar).
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles del equipo. Implementación pendiente.
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                   console.log('Herwing quiere ver los detalles del equipo con ID:', equipo.id);
                    // * Navego a la vista de detalles del equipo, pasando el ID.
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('equipoDetails', String(equipo.id)); // <-- PASO EL ID COMO STRING
                    } else {
                        console.error('La función navigateTo no está disponible globalmente. Revisa main.js.');
                    }
                });

                // * Botón Editar equipo. Implementación pendiente.
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.addEventListener('click', () => {
                  console.log('Herwing quiere editar el equipo con ID:', equipo.id);
                    // * Navego a la vista del formulario de equipo, pasando el ID del equipo a editar.
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('equipoForm', String(equipo.id)); // <-- PASO EL ID COMO STRING
                    } else {
                        console.error('La función navigateTo no está disponible globalmente. Revisa main.js.');
                    }
                });

                // * Botón Eliminar equipo. Muestra confirmación antes de llamar a la API.
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    console.log('Herwing quiere eliminar el equipo con ID:', equipo.id);

                    // * Muestro el modal de confirmación.
                    // * `showConfirmationModal` retorna una Promise que se resuelve a true o false.
                    const confirmed = await showConfirmationModal({
                        title: 'Confirmar Eliminación',
                        message: `¿Estás realmente seguro de que quieres eliminar el equipo con Número de Serie "${equipo.numero_serie}" (ID: ${equipo.id})? Esta acción no se puede deshacer.`,
                        confirmButtonText: 'Sí, Eliminar',
                        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white' // Clases para el botón de confirmación
                    });

                    if (confirmed) {
                        console.log('Eliminación confirmada por Herwing para equipo ID:', equipo.id);
                        try {
                            await deleteEquipo(equipo.id); // Uso la función de api.js
                            console.log('Equipo eliminado exitosamente:', equipo.id);
                            //TODO: Mostrar un mensaje de éxito con un toast/info modal.
                            showInfoModal({
                                title: 'Éxito',
                                message: 'El equipo ha sido eliminado correctamente.'
                            });
                            loadEquiposList(); // Recargo la lista para reflejar el cambio.
                        } catch (error) {
                            console.error('Error al eliminar equipo:', error);
                            //TODO: Mostrar el error con un info modal.
                            showInfoModal({
                                title: 'Error',
                                message: `Error al eliminar el equipo: ${error.message}`
                            });
                        }
                    } else {
                        console.log('Eliminación cancelada por Herwing para equipo ID:', equipo.id);
                    }
                });

                // * Agrega los botones de acción al contenedor.
                actionsContainer.appendChild(viewButton);
                actionsContainer.appendChild(editButton);
                actionsContainer.appendChild(deleteButton);
                td.appendChild(actionsContainer);
            }

            // * Agrega la celda a la fila.
            row.appendChild(td);
        });

        // * Agrega la fila al cuerpo de la tabla.
        tbody.appendChild(row);
    });

    // * Agrega el cuerpo a la tabla.
    table.appendChild(tbody);

    // * Agrega la tabla al área de contenido principal del DOM.
    contentArea.appendChild(table);

    // * Log de confirmación de renderizado.
    console.log('Tabla de equipos renderizada.');
}

// ===============================================================
// * FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
// * Orquesta la obtención de datos de la API y el renderizado de la lista de equipos.
// ===============================================================

async function loadEquiposList() {
    // * Muestra mensaje de carga y luego intenta obtener los datos y renderizar.
    console.log('Cargando vista de lista de equipos...');
    showEquiposLoading();
    try {
        // * Llama a la función de la API para obtener los datos de los equipos.
        const equipos = await getEquipos();
        // * Si tiene éxito, renderiza la tabla con los datos obtenidos.
        renderEquiposTable(equipos);
    } catch (error) {
        // ! Error al cargar la lista de equipos. Muestra mensaje de error al usuario.
        showEquiposError(error.message);
        // TODO: Implementar un manejo de errores más robusto en el frontend (ej. reintentos, fallback UI).
    }
}


// ===============================================================
// * EXPORTAR FUNCIONES DE LA VISTA
// * Exporto la función principal loadEquiposList para que pueda ser llamada desde el módulo de navegación (main.js).
// ===============================================================
export { loadEquiposList };