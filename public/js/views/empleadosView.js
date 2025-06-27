//public/js/views/empleadosView.js
// * Este módulo se encarga de toda la lógica para la vista de listado de Empleados,
// * utilizando DataTables para la tabla y delegación de eventos para las acciones.

import { getEmpleados, deleteEmpleado } from '../api.js';
import { showListError } from '../utils/error.js';
import { showLoadingSpinner, showListLoading } from '../utils/loading.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let empleadosDataTable = null;

function renderEmpleadosListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Empleados';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    // Mostrar spinner aquí
    cardBody.innerHTML = `<div id="empleados-list-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
}

function showEmpleadosError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Empleados', message, 'empleadosList', () => loadEmpleadosList());
}

// * Formatea la celda de acciones en DataTables
function formatEmpleadosActionsCell(data, type, row) {
    if (type === 'display') {
        const empleadoId = row[0]; // ID es la primera columna
        const nombres = row[2] || '';
        const apellidos = row[3] || '';
        const empleadoNombreCompleto = `${nombres} ${apellidos}`.trim();
        return `
            <div class="d-flex">
                <a href="javascript:void(0);" class="btn btn-primary shadow btn-xs sharp me-1"
                   title="Ver Detalles" data-action="view" data-id="${empleadoId}">
                    <i class="fas fa-eye"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-warning shadow btn-xs sharp me-1"
                   title="Editar Empleado" data-action="edit" data-id="${empleadoId}">
                    <i class="fas fa-pencil-alt"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-danger shadow btn-xs sharp"
                   title="Eliminar Empleado" data-action="delete" data-id="${empleadoId}" data-nombre="${empleadoNombreCompleto}">
                    <i class="fa fa-trash"></i>
                </a>
        </div>
        `;
    }
    return data;
}

// * Listener de eventos delegado para los botones de acción en la tabla
function handleEmpleadosTableActions(event) {
    const button = event.target.closest('a[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const empleadoId = button.dataset.id;
    const empleadoNombre = button.dataset.nombre;

    console.log(`Acción detectada: ${action} para empleado ID: ${empleadoId}`);

    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleado-details', String(empleadoId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleado-form', String(empleadoId));
        }
    } else if (action === 'delete') {
        (async () => {
            const confirmed = await Swal.fire({
                title: 'Confirmar Eliminación de Empleado',
                text: `¿Está seguro de que desea eliminar al empleado "${empleadoNombre}" del sistema? Esta acción eliminará permanentemente todos los registros asociados, incluyendo asignaciones y cuentas de email.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, Eliminar Empleado',
                cancelButtonText: 'Cancelar'
            });
            if (confirmed.isConfirmed) {
                try {
                    await deleteEmpleado(empleadoId);
                    await Swal.fire({
                        title: 'Empleado Eliminado Exitosamente',
                        text: `El empleado "${empleadoNombre}" ha sido eliminado del sistema de manera permanente.`,
                        icon: 'success',
                        confirmButtonText: 'Entendido'
                    });
                    await reloadEmpleadosTable();
                } catch (error) {
                    await Swal.fire({
                        title: 'Error al Eliminar Empleado',
                        text: `No se pudo eliminar al empleado "${empleadoNombre}". Error: ${error.message}`,
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                }
            }
        })();
    }
}

async function loadEmpleadosList() {
    const cardBody = renderEmpleadosListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('empleados-list-loading'), 'empleados');
    });
    console.log('Cargando la vista de lista de empleados con DataTables...');
    try {
        const empleados = await getEmpleados();
        if (!empleados || empleados.length === 0) {
            showEmpleadosError('No hay empleados registrados.', cardBody);
            return;
        }
        // Limpiar el spinner y agregar la tabla
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'empleados-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        // Inicializar DataTable
        empleadosDataTable = $('#empleados-datatable').DataTable({
            data: empleados.map(emp => [
                emp.id,
                emp.numero_empleado || 'N/A',
                emp.nombres || 'N/A',
                emp.apellidos || 'N/A',
                emp.nombre_empresa || 'N/A',
                emp.nombre_area || 'N/A',
                emp.puesto || 'N/A',
                emp.status_nombre || 'N/A',
                null // Columna de acciones
            ]),
            columns: [
                { title: 'ID', data: 0, width: '80px' },
                { title: 'No. Empl.', data: 1 },
                { title: 'Nombres', data: 2 },
                { title: 'Apellidos', data: 3 },
                { title: 'Empresa', data: 4 },
                { title: 'Área', data: 5 },
                { title: 'Puesto', data: 6 },
                { title: 'Estado', data: 7, render: function(data, type, row) { return getStatusBadge(data); } },
                { title: 'Acciones', data: 8, width: '120px', render: formatEmpleadosActionsCell }
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
                $('#empleados-datatable').on('click', 'a[data-action]', handleEmpleadosTableActions);
            }
        });
    } catch (error) {
        showEmpleadosError(error.message, cardBody);
    }
}

// Función para recargar la tabla después de operaciones CRUD
async function reloadEmpleadosTable() {
    if (empleadosDataTable) {
        try {
            const empleados = await getEmpleados();
            const tableData = empleados.map(emp => [
                emp.id,
                emp.numero_empleado || 'N/A',
                emp.nombres || 'N/A',
                emp.apellidos || 'N/A',
                emp.nombre_empresa || 'N/A',
                emp.nombre_area || 'N/A',
                emp.puesto || 'N/A',
                emp.status_nombre || 'N/A',
                null
            ]);
            empleadosDataTable.clear().rows.add(tableData).draw();
    } catch (error) {
            console.error('Error al recargar la tabla:', error);
        }
    }
}

export { loadEmpleadosList, reloadEmpleadosTable };