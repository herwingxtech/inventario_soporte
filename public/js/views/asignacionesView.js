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

// * Formatea la celda de acciones para la tabla de asignaciones.
function formatAsignacionesActionsCell(cell, row) {
    const asignacionId = row.cells[0].data; // Asumo ID de asignación
    const equipoSerie = row.cells[1].data; // Asumo Serie del equipo
    // * Determino si la asignación es activa basándome en si fecha_fin_asignacion (columna 5) tiene datos.
    // * row.cells[5].data contendrá el valor de `fecha_fin_asignacion` del mapeo de datos.
    const isActiva = !row.cells[5].data;

    // * Contenedor para los botones.
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'flex items-center justify-center space-x-2';

    // * Botón Ver Detalles (siempre disponible).
    const viewButton = document.createElement('button');
    viewButton.className = 'btn-action-view w-6 h-6 transform hover:text-blue-500 hover:scale-110';
    viewButton.title = 'Ver Detalles de la Asignación';
    viewButton.dataset.action = 'view';
    viewButton.dataset.id = asignacionId;
    viewButton.innerHTML = '<svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057 2.458 12z"></path></svg>';
    actionsContainer.appendChild(viewButton);

    // * Botón Editar/Finalizar (su comportamiento y apariencia cambian).
    const editButton = document.createElement('button');
    if (isActiva) {
        // * Si la asignación está ACTIVA, el botón permite editar/finalizar.
        editButton.className = 'btn-action-edit w-6 h-6 transform hover:text-yellow-500 hover:scale-110';
        editButton.title = 'Editar o Finalizar Asignación';
        editButton.dataset.action = 'edit';
        editButton.dataset.id = asignacionId;
        editButton.innerHTML = '<svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
    } else {
        // * Si la asignación está FINALIZADA, el botón está deshabilitado.
        // * Le doy un estilo diferente para que se vea claramente que no es clickeable.
        editButton.className = 'w-6 h-6 text-gray-400 cursor-not-allowed'; // Deshabilitado visualmente
        editButton.title = 'Esta asignación histórica no se puede editar.';
        editButton.disabled = true; // Deshabilito el botón funcionalmente.
        editButton.innerHTML = '<svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
    }
    actionsContainer.appendChild(editButton);

    // * Botón Eliminar (sigue disponible, pero podrías deshabilitarlo también para históricos).
  /*  const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-action-delete w-6 h-6 transform hover:text-red-500 hover:scale-110';
    deleteButton.title = 'Eliminar Registro de Asignación';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = asignacionId;
    deleteButton.dataset.equipoSerie = equipoSerie;
    deleteButton.innerHTML = '<svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
    actionsContainer.appendChild(deleteButton);*/

    return gridjs.html(actionsContainer.outerHTML);
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
        const asignaciones = await getAsignaciones();
        gridContainer.innerHTML = '';

        if (!asignaciones || asignaciones.length === 0) {
            showAsignacionesError('No hay asignaciones registradas.', gridContainer);
            return;
        }

        asignacionesGridInstance = new gridjs.Grid({
            columns: [
                { id: 'id', name: 'ID', width: '70px', sort: true },
                { id: 'equipo_numero_serie', name: 'Equipo', sort: true },
                { // Columna "Asignado A" combinada
                    id: 'asignado_a',
                    name: 'Asignado A',
                    sort: false,
                    formatter: (cell, row) => {
                        // Accedemos a los datos por el ID de la fila original (Grid.js recomienda esto)
                        // Asegúrate de que tu backend envíe estos campos directamente en el objeto 'asig'
                        const originalAsigData = asignaciones.find(a => a.id === row.cells[0].data);
                        if (!originalAsigData) return 'N/A';

                        // Ahora accedemos directamente a las propiedades del objeto original
                        const empNombres = originalAsigData.empleado_nombres;
                        const empApellidos = originalAsigData.empleado_apellidos;
                        const sucNombre = originalAsigData.sucursal_asignada_nombre;
                        const areaNombre = originalAsigData.area_asignada_nombre;

                        let display = [];
                        if (empNombres) display.push(`Emp: ${empNombres} ${empApellidos || ''}`);
                        if (sucNombre) display.push(`Suc: ${sucNombre}`);
                        if (areaNombre) display.push(`Área: ${areaNombre}`);
                        return display.length > 0 ? display.join('; ') : 'N/A';
                    }
                },
                { id: 'ip_direccion', name: 'IP', sort: true },
                {
                    id: 'fecha_asignacion',
                    name: 'Fecha Asignación',
                    sort: true,
                    // Asegúrate de que el backend envía fechas en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
                    // o YYYY-MM-DD para que new Date() las parse bien.
                    formatter: (cell) => cell ? new Date(cell).toLocaleDateString() : 'N/A'
                },
                {
                    id: 'fecha_fin_asignacion',
                    name: 'Fecha Fin',
                    sort: true,
                    // Asegúrate de que el backend envía fechas en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
                    // o YYYY-MM-DD para que new Date() las parse bien.
                    formatter: (cell) => cell ? new Date(cell).toLocaleString() : 'ACTIVA'
                },
                { id: 'status_nombre', name: 'Estado Asign.', sort: true },
                { name: 'Acciones', sort: false, width: '120px', formatter: formatAsignacionesActionsCell }
            ],
            data: asignaciones.map(asig => [
                asig.id,
                asig.equipo_numero_serie || 'N/A',
                // Para la columna "Asignado A" enviamos un marcador de posición, el formatter lo gestionará.
                // Lo importante es que haya un elemento en esta posición para que Grid.js la cuente.
                null, // Columna 'asignado_a'
                asig.ip_direccion || 'N/A',
                asig.fecha_asignacion,
                asig.fecha_fin_asignacion,
                asig.status_nombre || 'N/A',
                null // Para la celda de acciones
            ]),
            search: true,
            pagination: { enabled: true, limit: 10, summary: true },
            sort: true,
            style: {
                table: 'min-w-full bg-white border-gray-200 shadow-md rounded-lg',
                thead: 'bg-gray-200',
                th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200',
                tbody: 'text-gray-600 text-sm font-light',
                tr: 'border-b border-gray-200 hover:bg-gray-100',
                td: 'px-6 py-4 whitespace-nowrap',
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
