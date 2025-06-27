//public/js/views/equiposView.js
// * Usando DataTables para las acciones.
import { getEquipos, deleteEquipo } from '../api.js';
import { showListError } from '../utils/error.js';
import { showLoadingSpinner, showListLoading } from '../utils/loading.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let equiposDataTable = null;

function renderEquiposListViewLayout() {
    contentArea.innerHTML = '';

    //* Card container como en Karciz
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Equipos';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    
    // Mostrar spinner aquí
    cardBody.innerHTML = `<div id="equipos-list-loading"></div>`;
    
    //* Responsive wrapper
    const responsiveDiv = document.createElement('div');
    responsiveDiv.className = 'table-responsive';
    
    const tableContainer = document.createElement('table');
    tableContainer.id = 'equipos-datatable';
    tableContainer.className = 'display';
    tableContainer.style.minWidth = '845px';
    
    responsiveDiv.appendChild(tableContainer);
    cardBody.appendChild(responsiveDiv);
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    
    return cardBody;
}

function showEquiposError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Equipos', message, 'equipos-list', () => loadEquiposList());
}

// * Función para formatear la celda de acciones en DataTables
function formatActionsCell(data, type, row) {
    if (type === 'display') {
        const equipoId = row[0]; // ID es la primera columna
        const equipoNumeroSerie = row[1]; // Número Serie es la segunda
        
        return `
            <div class="d-flex">
                <a href="javascript:void(0);" class="btn btn-primary shadow btn-xs sharp me-1" 
                   title="Ver Detalles" data-action="view" data-id="${equipoId}">
                    <i class="fas fa-eye"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-warning shadow btn-xs sharp me-1" 
                   title="Editar Equipo" data-action="edit" data-id="${equipoId}">
                    <i class="fas fa-pencil-alt"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-danger shadow btn-xs sharp" 
                   title="Eliminar Equipo" data-action="delete" data-id="${equipoId}" data-numero-serie="${equipoNumeroSerie}">
                    <i class="fa fa-trash"></i>
                </a>
            </div>
        `;
    }
    return data;
}

// * Listener de eventos delegado para los botones de acción en la tabla
function handleTableActions(event) {
    const button = event.target.closest('a[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const equipoId = button.dataset.id;
    const equipoNumeroSerie = button.dataset.numeroSerie;

    console.log(`Acción detectada: ${action} para equipo ID: ${equipoId}`);

    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('equipo-details', String(equipoId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('equipo-form', String(equipoId));
        }
    } else if (action === 'delete') {
        (async () => {
            const confirmed = await Swal.fire({
                title: 'Confirmar Eliminación de Equipo',
                text: `¿Está seguro de que desea eliminar el equipo "${equipoNumeroSerie}" del inventario? Esta acción no se puede deshacer y eliminará permanentemente todos los registros asociados.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, Eliminar Equipo',
                cancelButtonText: 'Cancelar'
            });
            if (confirmed.isConfirmed) {
                try {
                    await deleteEquipo(equipoId);
                    await Swal.fire({
                        title: 'Equipo Eliminado Exitosamente',
                        text: `El equipo "${equipoNumeroSerie}" ha sido eliminado del inventario de manera permanente.`,
                        icon: 'success',
                        confirmButtonText: 'Entendido'
                    });
                    await reloadEquiposTable();
                } catch (error) {
                    await Swal.fire({
                        title: 'Error al Eliminar Equipo',
                        text: `No se pudo eliminar el equipo "${equipoNumeroSerie}". Error: ${error.message}`,
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                }
            }
        })();
    }
}

async function loadEquiposList() {
    const cardBody = renderEquiposListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('equipos-list-loading'), 'equipos');
    });
    console.log('Cargando la vista de lista de equipos con DataTables...');
    try {
        const equipos = await getEquipos();
        if (!equipos || equipos.length === 0) {
            showEquiposError('No hay equipos registrados en el inventario.', cardBody);
            return;
        }
        // Limpiar el spinner y agregar la tabla
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'equipos-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        // Inicializar DataTable
        equiposDataTable = $('#equipos-datatable').DataTable({
            data: equipos.map(eq => [
                eq.id,
                eq.numero_serie,
                eq.nombre_equipo || 'N/A',
                eq.nombre_tipo_equipo || 'N/A',
                eq.nombre_sucursal_actual || 'N/A',
                eq.nombre_empresa || 'N/A',
                eq.status_nombre || 'N/A',
                null // Columna de acciones
            ]),
            columns: [
                { 
                    title: 'ID',
                    data: 0,
                    width: '80px'
                },
                { 
                    title: 'Número Serie',
                    data: 1
                },
                { 
                    title: 'Nombre Equipo',
                    data: 2
                },
                { 
                    title: 'Tipo',
                    data: 3
                },
                { 
                    title: 'Ubicación',
                    data: 4
                },
                { 
                    title: 'Empresa',
                    data: 5
                },
                { 
                    title: 'Estado',
                    data: 6,
                    render: function(data, type, row) {
                        return getStatusBadge(data);
                    }
                },
                { 
                    title: 'Acciones',
                    data: 7,
                    width: '120px',
                    render: formatActionsCell
                }
            ],
            columnDefs: [
                {
                    targets: -1, // Última columna (acciones)
                    orderable: false,
                    searchable: false
                }
            ],
            language: {
                decimal: ",",
                emptyTable: "No hay datos disponibles en la tabla",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totales)",
                infoPostFix: "",
                thousands: ".",
                lengthMenu: "Mostrar _MENU_ registros",
                loadingRecords: "Cargando...",
                processing: "Procesando...",
                search: "Buscar:",
                zeroRecords: "No se encontraron registros coincidentes",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior"
                },
                aria: {
                    sortAscending: ": activar para ordenar la columna ascendente",
                    sortDescending: ": activar para ordenar la columna descendente"
                }
            },
            initComplete: function() {
                $('#equipos-datatable').on('click', 'a[data-action]', handleTableActions);
            }
        });
    } catch (error) {
        showEquiposError(error.message, cardBody);
    }
}

// Función para recargar la tabla después de operaciones CRUD
async function reloadEquiposTable() {
    if (equiposDataTable) {
        try {
            const equipos = await getEquipos();
            const tableData = equipos.map(eq => [
                eq.id,
                eq.numero_serie,
                eq.nombre_equipo || 'N/A',
                eq.nombre_tipo_equipo || 'N/A',
                eq.nombre_sucursal_actual || 'N/A',
                eq.nombre_empresa || 'N/A',
                eq.status_nombre || 'N/A',
                null
            ]);
            
            equiposDataTable.clear().rows.add(tableData).draw();
        } catch (error) {
            console.error('Error al recargar la tabla:', error);
        }
    }
}

export { loadEquiposList, reloadEquiposTable };
