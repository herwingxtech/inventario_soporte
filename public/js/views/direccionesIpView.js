//public/js/views/direccionesIpView.js
// * Este módulo se encarga de la vista de listado de Direcciones IP, usando Grid.js.

//public/js/views/direccionesIpView.js
// * Este módulo se encarga de la vista de listado de Direcciones IP, usando Grid.js.

import { getDireccionesIp, deleteDireccionIp } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');
let ipsGridInstance = null;
let gridContainerGlobal = null;
let direccionesIpDataTable = null;

function renderDireccionesIpListViewLayout() {
    contentArea.innerHTML = '';
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card');
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const cardTitle = document.createElement('h4');
    cardTitle.classList.add('card-title', 'fs-20', 'font-w700');
    cardTitle.textContent = 'Lista de Direcciones IP';
    cardHeader.appendChild(cardTitle);
    cardContainer.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    cardBody.innerHTML = `<div id="direccionesip-list-loading"></div>`;
    cardContainer.appendChild(cardBody);
    contentArea.appendChild(cardContainer);
    return cardBody;
}

function showDireccionesIpLoading(container) {
    const target = container || gridContainerGlobal || contentArea;
    showListLoading(target, 'Direcciones IP');
}

function showDireccionesIpError(message, container) {
    const target = container || contentArea;
    showListError(target, 'Direcciones IP', message, 'direccionesIpList', () => loadDireccionesIpList());
}

function formatIpActionsCell(data, type, row) {
    if (type === 'display') {
        const ipId = row[0];
        const direccionIp = row[1];
        return `
            <div class="d-flex">
                <a href="javascript:void(0);" class="btn btn-primary shadow btn-xs sharp me-1"
                   title="Ver Detalles" data-action="view" data-id="${ipId}">
                    <i class="fas fa-eye"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-warning shadow btn-xs sharp me-1"
                   title="Editar Dirección IP" data-action="edit" data-id="${ipId}">
                    <i class="fas fa-pencil-alt"></i>
                </a>
                <a href="javascript:void(0);" class="btn btn-danger shadow btn-xs sharp"
                   title="Eliminar Dirección IP" data-action="delete" data-id="${ipId}" data-direccion-ip="${direccionIp}">
                    <i class="fa fa-trash"></i>
                </a>
        </div>
        `;
    }
    return data;
}

function handleIpTableActions(event) {
    const button = event.target.closest('a[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const ipId = button.dataset.id;
    const direccionIp = button.dataset.direccionIp;
    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccion-ip-details', String(ipId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccion-ip-form', String(ipId));
        }
    } else if (action === 'delete') {
        (async () => {
            const confirmed = await Swal.fire({
                title: 'Confirmar Eliminación de Dirección IP',
                text: `¿Está seguro de que desea eliminar la dirección IP "${direccionIp}" del sistema? Esta acción eliminará permanentemente el registro y podría afectar asignaciones activas.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, Eliminar IP',
                cancelButtonText: 'Cancelar'
            });
            if (confirmed.value) {
                try {
                    await deleteDireccionIp(ipId);
                    await Swal.fire({
                        title: 'Dirección IP Eliminada Exitosamente',
                        text: `La dirección IP "${direccionIp}" ha sido eliminada del sistema de manera permanente.`,
                        icon: 'success',
                        confirmButtonText: 'Entendido'
                    });
                    await reloadDireccionesIpTable();
                } catch (error) {
                    await Swal.fire({
                        title: 'Error al Eliminar Dirección IP',
                        text: `No se pudo eliminar la dirección IP "${direccionIp}". Error: ${error.message}`,
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                }
            }
        })();
    }
}

async function loadDireccionesIpList() {
    const cardBody = renderDireccionesIpListViewLayout();
    import('../utils/loading.js').then(({ showListLoading }) => {
        showListLoading(document.getElementById('direccionesip-list-loading'), 'direcciones IP');
    });
    try {
        const direccionesIp = await getDireccionesIp();
        if (!direccionesIp || direccionesIp.length === 0) {
            showDireccionesIpError('No hay IPs registradas.', cardBody);
            return;
        }
        cardBody.innerHTML = '';
        const responsiveDiv = document.createElement('div');
        responsiveDiv.className = 'table-responsive';
        const tableContainer = document.createElement('table');
        tableContainer.id = 'direccionesip-datatable';
        tableContainer.className = 'display';
        tableContainer.style.minWidth = '845px';
        responsiveDiv.appendChild(tableContainer);
        cardBody.appendChild(responsiveDiv);
        direccionesIpDataTable = $('#direccionesip-datatable').DataTable({
            data: direccionesIp.map(ip => [
                ip.id,
                ip.direccion_ip,
                ip.nombre_empresa || 'N/A',
                ip.nombre_sucursal || 'N/A',
                ip.comentario || 'N/A',
                getStatusBadge(ip.status_nombre || 'N/A'),
                null
            ]),
            columns: [
                { title: 'ID', data: 0, width: '80px' },
                { title: 'Dirección IP', data: 1 },
                { title: 'Empresa', data: 2 },
                { title: 'Sucursal', data: 3 },
                { title: 'Comentario', data: 4 },
                { title: 'Estado', data: 5 },
                { title: 'Acciones', data: 6, width: '120px', render: formatIpActionsCell }
            ],
            columnDefs: [
                {
                    targets: -1,
                    orderable: false,
                    searchable: false
                }
            ],
            initComplete: function() {
                $('#direccionesip-datatable').on('click', 'a[data-action]', handleIpTableActions);
            }
        });
    } catch (error) {
        showDireccionesIpError(error.message, cardBody);
    }
}

async function reloadDireccionesIpTable() {
    if (window.direccionesIpDataTable) {
        try {
            const direccionesIp = await getDireccionesIp();
            const tableData = direccionesIp.map(ip => [
                ip.id,
                ip.direccion_ip,
                ip.nombre_empresa || 'N/A',
                ip.nombre_sucursal || 'N/A',
                ip.comentario || 'N/A',
                getStatusBadge(ip.status_nombre || 'N/A'),
                null
            ]);
            window.direccionesIpDataTable.clear().rows.add(tableData).draw();
    } catch (error) {
            console.error('Error al recargar la tabla:', error);
        }
    }
}

export { loadDireccionesIpList, reloadDireccionesIpTable };