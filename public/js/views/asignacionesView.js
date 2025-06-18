// public/js/views/asignacionesView.js
// * Este módulo se encarga de la vista de listado de Asignaciones, usando Grid.js.

import { getAsignaciones, deleteAsignacion } from '../api.js';
import { showConfirmationModal, showInfoModal } from '../ui/modal.js';

const contentArea = document.getElementById('content-area');
let asignacionesGridInstance = null;
let gridContainerGlobal = null;

function renderAsignacionesListViewLayout() {
    contentArea.innerHTML = '';
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Asignaciones de Equipos';
    contentArea.appendChild(title);

    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-purple-500', 'hover:bg-purple-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nueva Asignación';
    createButton.dataset.view = 'asignacionForm';
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    const gridContainer = document.createElement('div');
    gridContainer.id = 'asignaciones-grid-container';
    contentArea.appendChild(gridContainer);
    gridContainerGlobal = gridContainer;
    return gridContainer;
}

function showAsignacionesLoading(container) {
    const target = container || gridContainerGlobal || contentArea;
    target.innerHTML = '<p>Cargando lista de Asignaciones...</p>';
}

function showAsignacionesError(message, container) {
    const target = container || gridContainerGlobal || contentArea;
    target.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Asignaciones:</p><p class="text-red-500">${message}</p>`;
}

function formatAsignacionesActionsCell(cell, row) {
    const asignacionId = row.cells[0].data; // ID de la asignación
    const equipoSerie = row.cells[1].data; // Serie del equipo

    return gridjs.html(`
        <div class="flex items-center justify-center space-x-2">
            <button title="Ver Detalles de la Asignación"
                    class="btn-action-view w-6 h-6 transform hover:text-blue-500 hover:scale-110"
                    data-action="view" data-id="${asignacionId}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057 2.458 12z"></path></svg>
            </button>
            <button title="Editar/Finalizar Asignación"
                    class="btn-action-edit w-6 h-6 transform hover:text-yellow-500 hover:scale-110"
                    data-action="edit" data-id="${asignacionId}">
                ${!row.cells[5].data /* fecha_fin_asignacion */
                    ? '<svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' // Icono finalizar
                    : '<svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>' // Icono editar
                }
            </button>
            <button title="Eliminar Asignación"
                    class="btn-action-delete w-6 h-6 transform hover:text-red-500 hover:scale-110"
                    data-action="delete" data-id="${asignacionId}" data-equipo-serie="${equipoSerie}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>
            </button>
        </div>
    `);
}

function handleAsignacionesGridActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const asignacionId = button.dataset.id;
    const equipoSerie = button.dataset.equipoSerie;

    console.log(`Herwing - Acción detectada: ${action} para asignación ID: ${asignacionId}`);

    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignacionDetails', String(asignacionId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignacionForm', String(asignacionId));
        }
    } else if (action === 'delete') {
        (async () => {
            const confirmed = await showConfirmationModal({
                title: 'Confirmar Eliminación',
                message: `¿Estás seguro de eliminar la asignación (ID: ${asignacionId}) para el equipo "${equipoSerie}"?`,
            });
            if (confirmed) {
                try {
                    await deleteAsignacion(asignacionId);
                    await showInfoModal({ title: 'Éxito', message: 'Asignación eliminada correctamente.'});
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('asignacionesList');
                    }
                } catch (error) {
                    await showInfoModal({ title: 'Error', message: `Error al eliminar la asignación: ${error.message}`});
                }
            }
        })();
    }
}

async function loadAsignacionesList() {
    console.log('Herwing está cargando la vista de lista de Asignaciones con Grid.js...');
    const gridContainer = renderAsignacionesListViewLayout();
    showAsignacionesLoading(gridContainer);

    try {
        //? ¿Debería filtrar por activas por defecto? const asignaciones = await getAsignaciones({ activa: 'true' });
        const asignaciones = await getAsignaciones(); // Por ahora, traigo todas.
        gridContainer.innerHTML = '';

        if (!asignaciones || asignaciones.length === 0) {
            showAsignacionesError('No hay asignaciones registradas.', gridContainer);
            return;
        }

        asignacionesGridInstance = new gridjs.Grid({
            columns: [
                { id: 'id', name: 'ID', width: '70px', sort: true },
                { id: 'equipo_numero_serie', name: 'Equipo (Serie)', sort: true },
                { // Columna "Asignado A" combinada
                    id: 'asignado_a',
                    name: 'Asignado A',
                    sort: false, // Ordenar por esto es complejo, mejor individualmente
                    formatter: (cell, row) => {
                        // row.cells[indice_de_datos_originales].data
                        // Necesito los nombres de las columnas originales que vienen de la API para construir esto
                        const empNombres = row.cells[2].data; // Asumiendo que getAsignaciones devuelve estos campos y están en este orden
                        const empApellidos = row.cells[3].data;
                        const sucNombre = row.cells[4].data;
                        const areaNombre = row.cells[5].data;
                        let display = [];
                        if (empNombres) display.push(`Emp: ${empNombres} ${empApellidos || ''}`);
                        if (sucNombre) display.push(`Suc: ${sucNombre}`);
                        if (areaNombre) display.push(`Área: ${areaNombre}`);
                        return display.length > 0 ? display.join('; ') : 'N/A';
                    }
                },
                { id: 'ip_direccion', name: 'IP Asignada', sort: true },
                {
                    id: 'fecha_asignacion',
                    name: 'Fecha Asignación',
                    sort: true,
                    formatter: (cell) => cell ? new Date(cell).toLocaleString() : 'N/A'
                },
                {
                    id: 'fecha_fin_asignacion',
                    name: 'Fecha Fin',
                    sort: true,
                    formatter: (cell) => cell ? new Date(cell).toLocaleString() : 'ACTIVA'
                },
                { id: 'status_nombre', name: 'Estado Asign.', sort: true },
                { name: 'Acciones', sort: false, width: '120px', formatter: formatAsignacionesActionsCell }
            ],
            data: asignaciones.map(asig => [
                asig.id,
                asig.equipo_numero_serie || 'N/A',
                // Campos para el formatter de "Asignado A"
                asig.empleado_nombres, // Necesito que la API devuelva estos campos incluso si son null
                asig.empleado_apellidos,
                asig.sucursal_asignada_nombre,
                asig.area_asignada_nombre,
                // Resto de campos
                asig.ip_direccion || 'N/A',
                asig.fecha_asignacion,
                asig.fecha_fin_asignacion,
                asig.status_nombre || 'N/A',
                null // Para la celda de acciones
            ]),
            search: true,
            pagination: { enabled: true, limit: 10, summary: true },
            sort: true,
            style: { /* ... (tus estilos de Tailwind para Grid.js) ... */
                table: 'min-w-full bg-white border-gray-200 shadow-md rounded-lg',
                thead: 'bg-gray-200',
                th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200',
                tbody: 'text-gray-600 text-sm font-light',
                tr: 'border-b border-gray-200 hover:bg-gray-100',
                td: 'px-6 py-4 whitespace-nowrap', // Ojo, si 'Asignado A' es largo, quitar whitespace-nowrap o dar más ancho
                footer: 'p-4 bg-gray-50 border-t border-gray-200',
                search: 'p-2 mb-4 border border-gray-300 rounded-md w-full sm:w-auto',
                paginationButton: 'mx-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100',
                paginationButtonCurrent: 'bg-blue-500 text-white border-blue-500',
                paginationSummary: 'text-sm text-gray-700'
            },
            language: window.gridjs.l10n.esES
        }).render(gridContainer);

        gridContainer.removeEventListener('click', handleAsignacionesGridActions);
        gridContainer.addEventListener('click', handleAsignacionesGridActions);

        console.log('Herwing renderizó la tabla de Asignaciones con Grid.js.');

    } catch (error) {
        console.error('Error al cargar o renderizar asignaciones con Grid.js:', error);
        showAsignacionesError(error.message, gridContainer);
    }
}

export { loadAsignacionesList };