// public/js/views/direccionesIpView.js
// * Lógica específica para la vista de listado de Direcciones IP.

//? Funciones de API necesarias: getDireccionesIp, deleteDireccionIp.
import { getDireccionesIp, deleteDireccionIp } from '../api.js';
// * Importo mis funciones de modales personalizadas.
import { showConfirmationModal, showInfoModal } from '../ui/modal.js'; // Asumo que showInfoModal existe aquí.

// * Referencia al contenedor principal.
const contentArea = document.getElementById('content-area');
let listDataContainer = null; // Para el layout de la lista.

// * Renderiza el marco de la vista de lista.
function renderDireccionesIpListViewLayout() {
    contentArea.innerHTML = '';

    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Direcciones IP';
    contentArea.appendChild(title);

    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nueva Dirección IP';
    createButton.addEventListener('click', () => {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccionIpForm');
        }
        console.log('Herwing quiere mostrar el formulario para crear una nueva Dirección IP.');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    listDataContainer = document.createElement('div');
    listDataContainer.id = 'direcciones-ip-list-data-container';
    contentArea.appendChild(listDataContainer);
}

// * Muestra carga en el contenedor de datos.
function showDireccionesIpLoading() {
    if (listDataContainer) {
        listDataContainer.innerHTML = '<p>Cargando lista de Direcciones IP...</p>';
    } else {
        contentArea.innerHTML = '<p>Cargando lista de Direcciones IP...</p>';
    }
}

// * Muestra error en el contenedor de datos.
function showDireccionesIpError(message) {
    if (listDataContainer) {
        listDataContainer.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Direcciones IP:</p><p class="text-red-500">${message}</p>`;
    } else {
        contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Direcciones IP:</p><p class="text-red-500">${message}</p>`;
    }
}

// * Renderiza la tabla de Direcciones IP.
function renderDireccionesIpTable(direccionesIp) {
    if (!listDataContainer) return;
    listDataContainer.innerHTML = '';

    if (!direccionesIp || direccionesIp.length === 0) {
        listDataContainer.innerHTML = '<p>No hay direcciones IP registradas en el sistema.</p>';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');
    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'Dirección IP', prop: 'direccion_ip' },
        { text: 'Sucursal Asociada', prop: 'nombre_sucursal' },
        { text: 'Comentario', prop: 'comentario' },
        { text: 'Estado', prop: 'status_nombre' },
        { text: 'Acciones', prop: null }
    ];
    headers.forEach(header => {
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
    direccionesIp.forEach(ip => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = ip.id;

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');
            if (header.prop) {
                td.textContent = ip[header.prop] || 'N/A';
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else {
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles (Actualizado)
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.title = 'Ver Detalles de la IP';
                viewButton.addEventListener('click', () => {
                    console.log('Herwing quiere ver los detalles de la Dirección IP con ID:', ip.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('direccionIpDetails', String(ip.id));
                    }
                });

                // * Botón Editar (Actualizado)
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.title = 'Editar Dirección IP';
                editButton.addEventListener('click', () => {
                    console.log('Herwing quiere editar la Dirección IP con ID:', ip.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('direccionIpForm', String(ip.id));
                    }
                });

                // * Botón Eliminar (MODIFICADO para usar showConfirmationModal y showInfoModal)
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.title = 'Eliminar Dirección IP';
                deleteButton.addEventListener('click', async () => {
                    console.log('Herwing quiere eliminar la Dirección IP con ID:', ip.id);
                    // * Uso mi modal de confirmación personalizado.
                    const confirmed = await showConfirmationModal({
                        title: 'Confirmar Eliminación',
                        message: `¿Estás realmente seguro de que quieres eliminar la Dirección IP "${ip.direccion_ip}" (ID: ${ip.id})?`,
                        confirmButtonText: 'Sí, Eliminar',
                        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white'
                    });

                    if (confirmed) {
                        console.log('Eliminación confirmada por Herwing para Dirección IP ID:', ip.id);
                        try {
                            await deleteDireccionIp(ip.id); // Llamo a la función de api.js
                            console.log('Dirección IP eliminada exitosamente:', ip.id);
                            // * Uso mi modal de información para el mensaje de éxito.
                            await showInfoModal({
                                title: 'Éxito',
                                message: 'La Dirección IP ha sido eliminada correctamente.'
                            });
                            loadDireccionesIpList(); // Recargo la lista para reflejar el cambio.
                        } catch (error) {
                            console.error('Error al eliminar Dirección IP:', error);
                            // * Uso mi modal de información para el mensaje de error.
                            await showInfoModal({
                                title: 'Error',
                                message: `Error al eliminar la Dirección IP: ${error.message}`
                                //? Podría añadir un 'type: "error"' para estilizarlo diferente.
                            });
                        }
                    } else {
                        console.log('Eliminación cancelada por Herwing para Dirección IP ID:', ip.id);
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
    console.log('Herwing renderizó la Tabla de Direcciones IP.');
}

// * Función principal de carga de la vista de lista de Direcciones IP.
async function loadDireccionesIpList() {
    console.log('Herwing está cargando la vista de lista de Direcciones IP...');
    renderDireccionesIpListViewLayout(); // * Renderizo el layout primero.
    showDireccionesIpLoading();
    try {
        const direccionesIp = await getDireccionesIp();
        renderDireccionesIpTable(direccionesIp);
    } catch (error) {
        showDireccionesIpError(error.message);
    }
}

// * Exporto la función principal para que main.js pueda usarla.
export { loadDireccionesIpList };