// public/js/views/asignacionesView.js
// * Este módulo se encarga de toda la lógica para la vista de listado
// * de los registros de Asignaciones de equipos.

import { getAsignaciones, deleteAsignacion } from '../api.js';
import { showConfirmationModal, showInfoModal } from '../ui/modal.js';

const contentArea = document.getElementById('content-area');
let listDataContainer = null;

// * Renderiza el marco de la vista de lista.
function renderAsignacionesListViewLayout() {
    contentArea.innerHTML = '';

    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Asignaciones de Equipos';
    contentArea.appendChild(title);

    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-purple-500', 'hover:bg-purple-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nueva Asignación';
    createButton.addEventListener('click', () => {
        // * Navego al formulario de creación de Asignación.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignacionForm'); // No se pasa ID para crear.
        }
        console.log('Herwing quiere mostrar el formulario para crear una nueva asignación.');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    listDataContainer = document.createElement('div');
    listDataContainer.id = 'asignaciones-list-data-container';
    contentArea.appendChild(listDataContainer);
}

function showAsignacionesLoading() { /* ... (igual que antes) ... */
    if (listDataContainer) {
        listDataContainer.innerHTML = '<p>Cargando lista de Asignaciones...</p>';
    } else {
        contentArea.innerHTML = '<p>Cargando lista de Asignaciones...</p>';
    }
}
function showAsignacionesError(message) { /* ... (igual que antes) ... */
    if (listDataContainer) {
        listDataContainer.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Asignaciones:</p><p class="text-red-500">${message}</p>`;
    } else {
        contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Asignaciones:</p><p class="text-red-500">${message}</p>`;
    }
}

function renderAsignacionesTable(asignaciones) {
    if (!listDataContainer) return;
    listDataContainer.innerHTML = '';

    if (!asignaciones || asignaciones.length === 0) {
        listDataContainer.innerHTML = '<p>No hay registros de asignación en el sistema.</p>';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');
    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'Equipo (Serie)', prop: 'equipo_numero_serie' },
        { text: 'Asignado A', prop: null },
        { text: 'IP Asignada', prop: 'ip_direccion' },
        { text: 'Fecha Asignación', prop: 'fecha_asignacion' },
        { text: 'Fecha Fin', prop: 'fecha_fin_asignacion' },
        { text: 'Estado Asignación', prop: 'status_nombre' },
        { text: 'Acciones', prop: null }
    ];
    headers.forEach(header => { /* ... (creación de th igual que antes) ... */
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
        row.dataset.id = asignacion.id;

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');
            if (header.prop) {
                if ((header.prop === 'fecha_asignacion' || header.prop === 'fecha_fin_asignacion') && asignacion[header.prop]) {
                    td.textContent = new Date(asignacion[header.prop]).toLocaleString();
                } else {
                    td.textContent = asignacion[header.prop] || 'N/A';
                }
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else if (header.text === 'Asignado A') {
                let asignadoA = [];
                if (asignacion.id_empleado) asignadoA.push(`Emp: ${asignacion.empleado_nombres || ''} ${asignacion.empleado_apellidos || ''}`);
                if (asignacion.id_sucursal_asignado) asignadoA.push(`Suc: ${asignacion.sucursal_asignada_nombre || ''}`);
                if (asignacion.id_area_asignado) asignadoA.push(`Área: ${asignacion.area_asignada_nombre || ''}`);
                td.textContent = asignadoA.length > 0 ? asignadoA.join('; ') : 'N/A';
                td.classList.remove('whitespace-nowrap');
                td.classList.add('whitespace-normal', 'max-w-xs');
            } else {
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles (Actualizado)
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.title = 'Ver Detalles de la Asignación';
                viewButton.addEventListener('click', () => {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('asignacionDetails', String(asignacion.id));
                    }
                });

                // * Botón Editar/Finalizar (Actualizado)
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.title ='Editar Asignación';
                editButton.addEventListener('click', () => {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('asignacionForm', String(asignacion.id));
                    }
                });

                // * Botón Eliminar (usando modales)
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.title = 'Eliminar Asignación';
                deleteButton.addEventListener('click', async () => {
                    const confirmed = await showConfirmationModal({
                        title: 'Confirmar Eliminación',
                        message: `¿Estás seguro de eliminar el registro de asignación (ID: ${asignacion.id}) para el equipo "${asignacion.equipo_numero_serie}"?`,
                    });
                    if (confirmed) {
                        try {
                            await deleteAsignacion(asignacion.id);
                            await showInfoModal({ title: 'Éxito', message: 'Asignación eliminada correctamente.' });
                            loadAsignacionesList();
                        } catch (error) {
                            await showInfoModal({ title: 'Error', message: `Error al eliminar la asignación: ${error.message}` });
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
    listDataContainer.appendChild(table);
    console.log('Herwing renderizó la Tabla de Asignaciones.');
}

// * Función principal de carga de la vista de lista.
async function loadAsignacionesList() {
    console.log('Herwing está cargando la vista de lista de Asignaciones...');
    renderAsignacionesListViewLayout();
    showAsignacionesLoading();
    try {
        //? Podríamos filtrar por activas por defecto: const asignaciones = await getAsignaciones({ activa: 'true' });
        const asignaciones = await getAsignaciones();
        renderAsignacionesTable(asignaciones);
    } catch (error) {
        showAsignacionesError(error.message);
    }
}

export { loadAsignacionesList };