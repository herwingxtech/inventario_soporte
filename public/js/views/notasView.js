//public/js/views/notasList.js
// * Este módulo se encarga de toda la lógica para la vista de listado
// * de los registros de Notas.

//? ¿Necesitaré importar 'deleteNota' aquí? ¿O mejor en una vista de detalle/modal?
import { getNotas, deleteNota } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// * Muestra un mensaje de carga mientras se obtienen los datos de las notas.
function showNotasListLoading() {
    showListLoading(contentArea, 'Notas');
}

// * Muestra un mensaje de error si falla la carga de datos de las notas.
function showNotasListError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Notas', message, 'notasList', () => loadNotasList());
}

function renderNotasListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Notas';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="notas-list-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
}

function formatNotasActionsCell(data, type, row) {
    if (type === 'display') {
        const notaId = row[0];
        return `
            <div class="d-flex">
                <a href="javascript:void(0);" class="btn btn-primary shadow btn-xs sharp me-1"
                   title="Ver Detalles" data-action="view" data-id="${notaId}">
                    <i class="fas fa-eye"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-warning shadow btn-xs sharp me-1"
                   title="Editar Nota" data-action="edit" data-id="${notaId}">
                    <i class="fas fa-pencil-alt"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-danger shadow btn-xs sharp"
                   title="Eliminar Nota" data-action="delete" data-id="${notaId}">
                    <i class="fa fa-trash"></i>
                </a>
            </div>
        `;
    }
    return data;
}

function handleNotasTableActions(event) {
    const button = event.target.closest('a[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const notaId = button.dataset.id;
    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('nota-details', String(notaId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('nota-form', String(notaId));
        }
    } else if (action === 'delete') {
        (async () => {
            const result = Swal.fire({
                title: '¿Eliminar Nota?',
                text: `¿Estás seguro de eliminar la nota con ID ${notaId}? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            });
            if (result.isConfirmed) {
                try {
                    await deleteNota(notaId);
                    await reloadNotasTable();
                    Swal.fire({
                        title: 'Eliminada',
                        text: 'La nota ha sido eliminada exitosamente.',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Error al eliminar la nota: ' + (error.message || 'Error desconocido.'),
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
let notasDataTable = null;
async function loadNotasList() {
    const cardBody = renderNotasListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('notas-list-loading'), 'notas');
    });
    try {
        const notas = await getNotas();
        if (!notas || notas.length === 0) {
            showNotasListError('No hay notas registradas en el sistema.', cardBody);
            return;
        }
        // Limpiar el spinner y agregar la tabla
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'notas-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        // Inicializar DataTable
        notasDataTable = $('#notas-datatable').DataTable({
            data: notas.map(nota => [
                nota.id,
                nota.titulo || 'N/A',
                (nota.contenido || '').substring(0, 50) + ((nota.contenido || '').length > 50 ? '...' : ''),
                [
                    nota.id_equipo ? `Equipo #${nota.id_equipo} (${nota.equipo_numero_serie || 'N/A'})` : null,
                    nota.id_mantenimiento ? `Mantenimiento #${nota.id_mantenimiento}` : null,
                    nota.id_cuenta_email ? `Email: ${nota.cuenta_email_email || 'N/A'}` : null
                ].filter(Boolean).join(', ') || 'N/A',
                nota.id_usuario_sistema || 'N/A',
                nota.fecha_creacion ? new Date(nota.fecha_creacion).toLocaleString() : 'N/A',
                null
            ]),
            columns: [
                { title: 'ID', data: 0 },
                { title: 'Título', data: 1 },
                { title: 'Contenido (extracto)', data: 2 },
                { title: 'Asociado a', data: 3 },
                { title: 'Creado por', data: 4 },
                { title: 'Fecha Creación', data: 5 },
                { title: 'Acciones', data: 6, width: '120px', render: formatNotasActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            initComplete: function() {
                $('#notas-datatable').on('click', 'a[data-action]', handleNotasTableActions);
            }
        });
    } catch (error) {
        showNotasListError(error.message, cardBody);
    }
}

async function reloadNotasTable() {
    if (window.notasDataTable) {
        try {
            const notas = await getNotas();
            const tableData = notas.map(nota => [
                nota.id,
                nota.titulo || 'N/A',
                (nota.contenido || '').substring(0, 50) + ((nota.contenido || '').length > 50 ? '...' : ''),
                [
                    nota.id_equipo ? `Equipo #${nota.id_equipo} (${nota.equipo_numero_serie || 'N/A'})` : null,
                    nota.id_mantenimiento ? `Mantenimiento #${nota.id_mantenimiento}` : null,
                    nota.id_cuenta_email ? `Email: ${nota.cuenta_email_email || 'N/A'}` : null
                ].filter(Boolean).join(', ') || 'N/A',
                nota.id_usuario_sistema || 'N/A',
                nota.fecha_creacion ? new Date(nota.fecha_creacion).toLocaleString() : 'N/A',
                null
            ]);
            window.notasDataTable.clear().rows.add(tableData).draw();
        } catch (error) {
            console.error('Error al recargar la tabla:', error);
        }
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// Exporto la función principal para que main.js pueda usarla.
// ===============================================================
export { loadNotasList, reloadNotasTable };