// ! Vista de listado de empleados
// * Si la API cambia, revisa los headers y los nombres de las propiedades. Si la UX se siente lenta, revisa el renderizado de la tabla.
// * Consejo: Si agregas más columnas o cambias la estructura de empleados, actualiza el array 'headers'.
// * ADVERTENCIA: No olvides manejar los errores de red, especialmente si el backend está caído.

// Importamos las funciones de la API que necesitamos.
import { getEmpleados, deleteEmpleado } from '../api.js'; // Asumimos que ya tenemos getEmpleados y deleteEmpleado en api.js

// ===============================================================
// * ELEMENTOS DEL DOM RELACIONADOS CON ESTA VISTA
// * Referencio el área principal donde se renderiza la tabla y mensajes.
// * Siempre usa IDs únicos para evitar conflictos si hay más de una tabla en la misma página.
// ===============================================================
const contentArea = document.getElementById('content-area'); // El contenedor principal.

// ===============================================================
// * FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// * Cada función se encarga de mostrar mensajes, errores o la tabla de empleados.
// * Si la tabla crece mucho, considera paginación o virtualización para no saturar el DOM.
// ===============================================================

// * Función para mostrar un mensaje de carga específico para esta vista.
function showEmpleadosLoading() {
    // * Muestra mensaje de carga en el área principal de empleados
    contentArea.innerHTML = '<p>Cargando lista de empleados...</p>';
}

// * Función para mostrar un mensaje de error específico para esta vista.
function showEmpleadosError(message) {
    // ! Error al cargar empleados, se muestra mensaje destacado
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar empleados:</p><p class="text-red-500">${message}</p>`;
}

// * Función para renderizar una lista de empleados en una tabla HTML en el contentArea.
function renderEmpleadosTable(empleados) {
    // * Limpia el contenido anterior antes de renderizar la tabla
    contentArea.innerHTML = '';

    if (!empleados || empleados.length === 0) {
        // ! No hay empleados registrados
        contentArea.innerHTML = '<p>No hay empleados registrados en el sistema.</p>';
        return;
    }

    // * Renderiza el título de la vista
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Empleados';
    contentArea.appendChild(title);

    // * Botón para crear nuevo empleado
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nuevo Empleado';
    createButton.addEventListener('click', () => {
        // TODO: Implementar formulario de creación de empleado
        console.log('Mostrar formulario para crear nuevo empleado');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    // * Renderiza la tabla de empleados
    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');

    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');

    // * Define las columnas de la cabecera
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'No. Empleado', prop: 'numero_empleado' },
        { text: 'Nombre Completo', prop: null },
        { text: 'Email Personal', prop: 'email_personal' },
        { text: 'Puesto', prop: 'puesto' },
        { text: 'Sucursal', prop: 'nombre_sucursal' },
        { text: 'Área', prop: 'nombre_area' },
        { text: 'Estado', prop: 'status_nombre' },
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

    empleados.forEach(empleado => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = empleado.id;

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                td.textContent = empleado[header.prop] || 'N/A';
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else if (header.text === 'Nombre Completo') {
                // * Combina nombres y apellidos
                td.textContent = `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim() || 'N/A';
            } else {
                // * Renderiza los botones de acción
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                    // TODO: Implementar vista de detalles de empleado
                    console.log('Ver detalles de empleado con ID:', empleado.id);
                });

                // * Botón Editar
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.addEventListener('click', () => {
                    // TODO: Implementar formulario de edición de empleado
                    console.log('Editar empleado con ID:', empleado.id);
                });

                // * Botón Eliminar
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    // ! Confirmación antes de eliminar
                    if (confirm(`¿Estás seguro de eliminar al empleado "${empleado.nombres} ${empleado.apellidos}" (ID: ${empleado.id})?`)) {
                        try {
                            await deleteEmpleado(empleado.id);
                            // * Recarga la lista tras eliminar
                            loadEmpleadosList();
                        } catch (error) {
                            // ! Error al eliminar empleado
                            alert('Error al eliminar el empleado: ' + error.message);
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
    contentArea.appendChild(table);
    // * Tabla renderizada correctamente
    console.log('Tabla de empleados renderizada.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
// * Aquí es donde orquesto la carga y renderizado. Si la API es lenta, muestra un loader más vistoso.
// ===============================================================
async function loadEmpleadosList() {
    console.log('Cargando vista de lista de empleados...');
    showEmpleadosLoading(); // Muestra carga.
    try {
        const empleados = await getEmpleados(); // Llama a la función de la API.
        renderEmpleadosTable(empleados); // Renderiza la tabla.
    } catch (error) {
        showEmpleadosError(error.message); // Muestra error si falla la carga.
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// * Si en el futuro necesitas más vistas (detalle, edición), expórtalas aquí.
// ===============================================================
export { loadEmpleadosList };