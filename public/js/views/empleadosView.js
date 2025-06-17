// public/js/views/empleadosView.js
// * Lógica específica para la vista de listado de Empleados.

import { getEmpleados, deleteEmpleado } from '../api.js';
import { showConfirmationModal } from '../ui/modal.js'; // Importo la función del modal.    
import { showInfoModal } from '../ui/modal.js'; // Importo la función del modal.

const contentArea = document.getElementById('content-area');

function showEmpleadosLoading() {
    contentArea.innerHTML = '<p>Cargando lista de empleados...</p>';
}

function showEmpleadosError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar empleados:</p><p class="text-red-500">${message}</p>`;
}

function renderEmpleadosTable(empleados) {
    contentArea.innerHTML = '';

    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Empleados';
    contentArea.appendChild(title);

    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nuevo Empleado';
    createButton.addEventListener('click', () => {
        // * Navego al formulario de creación de empleado.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleadoForm'); // No se pasa ID para crear.
        } else {
            console.error('La función navigateTo no está disponible globalmente.');
        }
        console.log('Herwing quiere mostrar el formulario para crear un nuevo empleado.');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    if (!empleados || empleados.length === 0) {
        const noData = document.createElement('p');
        noData.textContent = 'No hay empleados registrados en el sistema.';
        contentArea.appendChild(noData);
        return;
    }

    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');
    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');
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
    headers.forEach(header => { /* ... (código de creación de th igual que antes) ... */
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
                td.textContent = `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim() || 'N/A';
            } else {
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles (Actualizado)
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.title = 'Ver Detalles del Empleado';
                viewButton.addEventListener('click', () => {
                    console.log('Herwing quiere ver los detalles del empleado con ID:', empleado.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('empleadoDetails', String(empleado.id)); // * Navega a la vista de detalles
                    }
                });

                // * Botón Editar (Actualizado)
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.title = 'Editar Empleado';
                editButton.addEventListener('click', () => {
                    console.log('Herwing quiere editar el empleado con ID:', empleado.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('empleadoForm', String(empleado.id)); // * Navega al formulario de edición
                    }
                });

                // * Botón Eliminar (igual que antes)
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    const confirmed = await showConfirmationModal({
                        title: 'Confirmar Eliminación',
                        message: `¿Estás realmente seguro de que quieres eliminar al empleado ${empleado.nombres} ${empleado.apellidos} (ID: ${empleado.id})? Esta acción no se puede deshacer.`,
                        confirmButtonText: 'Sí, Eliminar',
                        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white' // Clases para el botón de confirmación
                    });

                    if (confirmed) {
                        console.log('Eliminación confirmada por Herwing para empleado ID:', empleado.id);
                        try {
                            await deleteEmpleado(empleado.id); // Uso la función de api.js
                            console.log('Empleado eliminado exitosamente:', empleado.id);
                            //TODO: Mostrar un mensaje de éxito con un toast/info modal.
                            showInfoModal({
                                title: 'Éxito',
                                message: 'El empleado ha sido eliminado correctamente.'
                            });
                            loadEmpleadosList(); // Recargo la lista para reflejar el cambio.
                        } catch (error) {
                            console.error('Error al eliminar empleado:', error);
                            //TODO: Mostrar el error con un info modal.
                            showInfoModal({
                                title: 'Error',
                                message: `Error al eliminar el empleado: ${error.message}`
                            });
                        }
                    } else {
                        console.log('Eliminación cancelada por Herwing para el empleado con ID:', empleado.id);
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
    console.log('Tabla de empleados renderizada.');
}

async function loadEmpleadosList() {
    console.log('Cargando vista de lista de empleados...');
    showEmpleadosLoading();
    try {
        const empleados = await getEmpleados();
        renderEmpleadosTable(empleados);
    } catch (error) {
        showEmpleadosError(error.message);
    }
}

export { loadEmpleadosList };