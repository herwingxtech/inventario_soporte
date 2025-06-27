//public/js/views/mantenimientosView.js
// * Este módulo se encarga de toda la lógica para la vista de listado
// * de los registros de Mantenimiento de equipos.

//? ¿Necesitaré importar 'deleteMantenimiento' aquí o en una vista de detalle/modal?
import { getMantenimientos, deleteMantenimiento } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

let mantenimientosDataTable = null;

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// * Muestra un mensaje de carga mientras se obtienen los datos de los mantenimientos.
function showMantenimientosLoading() {
    showListLoading(contentArea, 'Mantenimientos');
}

// * Muestra un mensaje de error si falla la carga de datos de los mantenimientos.
function showMantenimientosError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Mantenimientos', message, 'mantenimientosList', () => loadMantenimientosList());
}

function renderMantenimientosListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Mantenimientos';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="mantenimientos-list-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
}

function formatMantenimientosActionsCell(data, type, row) {
    if (type === 'display') {
        const mantenimientoId = row[0];
        return `
            <div class="d-flex">
                <a href="javascript:void(0);" class="btn btn-primary shadow btn-xs sharp me-1"
                   title="Ver Detalles" data-action="view" data-id="${mantenimientoId}">
                    <i class="fas fa-eye"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-warning shadow btn-xs sharp me-1"
                   title="Editar Mantenimiento" data-action="edit" data-id="${mantenimientoId}">
                    <i class="fas fa-pencil-alt"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-danger shadow btn-xs sharp"
                   title="Eliminar Mantenimiento" data-action="delete" data-id="${mantenimientoId}">
                    <i class="fa fa-trash"></i>
                </a>
            </div>
        `;
    }
    return data;
}

function handleMantenimientosTableActions(event) {
    const button = event.target.closest('a[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const mantenimientoId = button.dataset.id;
    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('mantenimiento-details', String(mantenimientoId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('mantenimiento-form', String(mantenimientoId));
        }
    } else if (action === 'delete') {
        (async () => {
            const result = Swal.fire({
                title: '¿Eliminar Mantenimiento?',
                text: `¿Estás seguro de eliminar el registro de mantenimiento (ID: ${mantenimientoId})? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            });
            if (result.isConfirmed) {
                try {
                    await deleteMantenimiento(mantenimientoId);
                    await reloadMantenimientosTable();
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'El registro de mantenimiento ha sido eliminado exitosamente.',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Error al eliminar el registro de mantenimiento: ' + (error.message || 'Error desconocido.'),
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                }
            }
        })();
    }
}

// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
// Esta es la función que será llamada desde main.js para mostrar esta vista.
// ===============================================================
async function loadMantenimientosList() {
    const cardBody = renderMantenimientosListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('mantenimientos-list-loading'), 'mantenimientos');
    });
    try {
        const mantenimientos = await getMantenimientos();
        if (!mantenimientos || mantenimientos.length === 0) {
            showMantenimientosError('No hay registros de mantenimiento en el sistema.', cardBody);
            return;
        }
        // Limpiar el spinner y agregar la tabla
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'mantenimientos-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        // Inicializar DataTable
        mantenimientosDataTable = $('#mantenimientos-datatable').DataTable({
            data: mantenimientos.map(mantenimiento => [
                mantenimiento.id,
                mantenimiento.equipo_numero_serie || 'N/A',
                mantenimiento.equipo_nombre || 'N/A',
                mantenimiento.fecha_inicio ? mantenimiento.fecha_inicio.split('T')[0] : 'N/A',
                mantenimiento.fecha_fin ? mantenimiento.fecha_fin.split('T')[0] : 'N/A',
                mantenimiento.diagnostico || 'N/A',
                getStatusBadge(mantenimiento.status_nombre || 'N/A'),
                null
            ]),
            columns: [
                { title: 'ID', data: 0 },
                { title: 'Equipo (Serie)', data: 1 },
                { title: 'Equipo (Nombre)', data: 2 },
                { title: 'Fecha Inicio', data: 3 },
                { title: 'Fecha Fin', data: 4 },
                { title: 'Diagnóstico', data: 5 },
                { title: 'Estado', data: 6 },
                { title: 'Acciones', data: 7, width: '120px', render: formatMantenimientosActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            initComplete: function() {
                $('#mantenimientos-datatable').on('click', 'a[data-action]', handleMantenimientosTableActions);
            }
        });
    } catch (error) {
        showMantenimientosError(error.message, cardBody);
    }
}

async function reloadMantenimientosTable() {
    if (window.mantenimientosDataTable) {
        try {
            const mantenimientos = await getMantenimientos();
            const tableData = mantenimientos.map(mantenimiento => [
                mantenimiento.id,
                mantenimiento.equipo_numero_serie || 'N/A',
                mantenimiento.equipo_nombre || 'N/A',
                mantenimiento.fecha_inicio ? mantenimiento.fecha_inicio.split('T')[0] : 'N/A',
                mantenimiento.fecha_fin ? mantenimiento.fecha_fin.split('T')[0] : 'N/A',
                mantenimiento.diagnostico || 'N/A',
                getStatusBadge(mantenimiento.status_nombre || 'N/A'),
                null
            ]);
            window.mantenimientosDataTable.clear().rows.add(tableData).draw();
        } catch (error) {
            console.error('Error al recargar la tabla:', error);
        }
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// Exporto la función principal para que main.js pueda usarla.
// ===============================================================
export { loadMantenimientosList, reloadMantenimientosTable };