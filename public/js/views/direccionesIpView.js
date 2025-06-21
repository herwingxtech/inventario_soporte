// public/js/views/direccionesIpView.js
// * Este módulo se encarga de la vista de listado de Direcciones IP, usando Grid.js.

import { getDireccionesIp, deleteDireccionIp } from '../api.js';
import { showConfirmationModal, showInfoModal } from '../ui/modal.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';

const contentArea = document.getElementById('content-area');
let ipsGridInstance = null;
let gridContainerGlobal = null;

function renderDireccionesIpListViewLayout() {
    contentArea.innerHTML = '';
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Direcciones IP';
    contentArea.appendChild(title);

    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-yellow-500', 'hover:bg-yellow-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nueva Dirección IP';
    createButton.dataset.view = 'direccionIpForm';
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    const responsiveDiv = document.createElement('div');
    responsiveDiv.className = 'overflow-x-auto w-full';
    const gridContainer = document.createElement('div');
    gridContainer.id = 'direccionesip-grid-container';
    responsiveDiv.appendChild(gridContainer);
    contentArea.appendChild(responsiveDiv);
    gridContainerGlobal = gridContainer;
    return gridContainer;
}

function showDireccionesIpLoading(container) {
    const target = container || gridContainerGlobal || contentArea;
    showListLoading(target, 'Direcciones IP');
}

function showDireccionesIpError(message, container) {
    const target = container || gridContainerGlobal || contentArea;
    showListError(target, 'Direcciones IP', message, 'direccionesIpList', () => loadDireccionesIpList());
}

function formatIpActionsCell(cell, row) {
    const ipId = row.cells[0].data;
    const direccionIp = row.cells[1].data;

    return gridjs.html(`
        <div class="flex items-center justify-center space-x-2">
            <button title="Ver Detalles de la IP"
                    class="btn-action-view w-6 h-6 transform hover:text-blue-500 hover:scale-110"
                    data-action="view" data-id="${ipId}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057 2.458 12z"></path></svg>
            </button>
            <button title="Editar Dirección IP"
                    class="btn-action-edit w-6 h-6 transform hover:text-yellow-500 hover:scale-110"
                    data-action="edit" data-id="${ipId}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button title="Eliminar Dirección IP"
                    class="btn-action-delete w-6 h-6 transform hover:text-red-500 hover:scale-110"
                    data-action="delete" data-id="${ipId}" data-direccion-ip="${direccionIp}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>
            </button>
        </div>
    `);
}

function handleIpGridActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const ipId = button.dataset.id;
    const direccionIp = button.dataset.direccionIp;

    console.log(`Herwing - Acción detectada: ${action} para Dirección IP ID: ${ipId}`);

    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccionIpDetails', String(ipId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccionIpForm', String(ipId));
        }
    } else if (action === 'delete') {
        (async () => {
            const confirmed = await showConfirmationModal({
                title: 'Confirmar Eliminación',
                message: `¿Estás seguro de eliminar la Dirección IP "${direccionIp}" (ID: ${ipId})?`,
            });
            if (confirmed) {
                try {
                    await deleteDireccionIp(ipId);
                    await showInfoModal({ title: 'Éxito', message: 'Dirección IP eliminada correctamente.'});
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('direccionesIpList');
                    }
                } catch (error) {
                    await showInfoModal({ title: 'Error', message: `Error al eliminar la Dirección IP: ${error.message}`});
                }
            }
        })();
    }
}

async function loadDireccionesIpList() {
    console.log('Herwing está cargando la vista de lista de Direcciones IP con Grid.js...');
    const gridContainer = renderDireccionesIpListViewLayout();
    showDireccionesIpLoading(gridContainer);

    try {
        const direccionesIp = await getDireccionesIp();
        gridContainer.innerHTML = '';

        if (!direccionesIp || direccionesIp.length === 0) {
            showDireccionesIpError('No hay IPs registradas.', gridContainer);
            return;
        }

        ipsGridInstance = new gridjs.Grid({
            columns: [
                { id: 'id', name: 'ID', width: '80px', sort: true },
                {
                    id: 'direccion_ip',
                    name: 'Dirección IP',
                    sort: {
                        compare: (a, b) => {
                            const ipToArr = ip => ip.split('.').map(Number);
                            const arrA = ipToArr(a);
                            const arrB = ipToArr(b);
                            for (let i = 0; i < 4; i++) {
                                if (arrA[i] !== arrB[i]) return arrA[i] - arrB[i];
                            }
                            return 0;
                        }
                    }
                },
                { id: 'nombre_empresa', name: 'Empresa', sort: true },
                { id: 'nombre_sucursal', name: 'Sucursal', sort: true },
                { id: 'comentario', name: 'Comentario', width: '250px', sort: false }, // Comentario puede ser largo
                { id: 'status_nombre', name: 'Estado', sort: true },
                { name: 'Acciones', sort: false, width: '120px', formatter: formatIpActionsCell }
            ],
            data: direccionesIp.map(ip => [
                ip.id,
                ip.direccion_ip,
                ip.nombre_empresa || 'N/A',
                ip.nombre_sucursal || 'N/A',
                ip.comentario || 'N/A',
                ip.status_nombre || 'N/A',
                null
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
                td: 'px-6 py-4 whitespace-nowrap',
                footer: 'p-4 bg-gray-50 border-t border-gray-200',
                search: 'p-2 mb-4 border border-gray-300 rounded-md w-full sm:w-auto',
                paginationButton: 'mx-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100',
                paginationButtonCurrent: 'bg-blue-500 text-white border-blue-500',
                paginationSummary: 'text-sm text-gray-700'
            },
            language: window.gridjs.l10n.esES
        }).render(gridContainer);

        gridContainer.removeEventListener('click', handleIpGridActions);
        gridContainer.addEventListener('click', handleIpGridActions);

        console.log('Herwing renderizó la tabla de Direcciones IP con Grid.js.');

    } catch (error) {
        console.error('Error al cargar o renderizar IPs con Grid.js:', error);
        showDireccionesIpError(error.message, gridContainer);
    }
}

export { loadDireccionesIpList };