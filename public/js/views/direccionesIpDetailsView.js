// public/js/views/direccionIpDetailsView.js
// * Este módulo maneja la lógica para mostrar los detalles de una Dirección IP específica.

//? ¿Qué función de API necesito? 'getDireccionIpById'.
import { getDireccionIpById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// * Muestra un mensaje de carga mientras se obtienen los detalles de la IP.
function showDireccionIpDetailsLoading(ipId) {
    showDetailsLoading('Dirección IP', ipId);
}

// * Muestra un mensaje de error si falla la carga de datos de la IP.
function showDireccionIpDetailsError(message) {
    showDetailsError('Dirección IP', null, message, 'direccionesIpList', () => showDireccionIpDetails());
}

// * Renderiza la vista de detalles de la Dirección IP.
function renderDireccionIpDetails(ip) {
    contentArea.innerHTML = ''; // Limpio cualquier contenido previo.

    if (!ip) {
        showDireccionIpDetailsError('No se encontraron datos para esta Dirección IP.');
        return;
    }

    // * Creo el título para esta vista.
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = `Detalles de la Dirección IP: ${ip.direccion_ip}`;
    contentArea.appendChild(title);

    // * Contenedor para los detalles.
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-md', 'space-y-4');

    // * Función auxiliar para crear un par de etiqueta-valor.
    function createDetailItem(label, value) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('py-2', 'sm:grid', 'sm:grid-cols-3', 'sm:gap-4', 'sm:px-0');

        const dt = document.createElement('dt');
        dt.classList.add('text-sm', 'font-medium', 'text-gray-500');
        dt.textContent = label;

        const dd = document.createElement('dd');
        dd.classList.add('mt-1', 'text-sm', 'text-gray-900', 'sm:mt-0', 'sm:col-span-2');
        dd.textContent = value || 'N/A'; // Muestro N/A si el valor es nulo o vacío.

        itemDiv.appendChild(dt);
        itemDiv.appendChild(dd);
        return itemDiv;
    }

    // * Creo y añado los ítems de detalle.
    detailsContainer.appendChild(createDetailItem('ID', ip.id));
    detailsContainer.appendChild(createDetailItem('Dirección IP', ip.direccion_ip));
    detailsContainer.appendChild(createDetailItem('Sucursal Asociada', ip.nombre_sucursal)); // Del JOIN
    detailsContainer.appendChild(createDetailItem('Comentario / Notas', ip.comentario));
    detailsContainer.appendChild(createDetailItem('Estado', ip.status_nombre)); // Del JOIN

    const fechaRegistroFormateada = ip.fecha_registro ? new Date(ip.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionFormateada = ip.fecha_actualizacion ? new Date(ip.fecha_actualizacion).toLocaleString() : 'N/A';

    detailsContainer.appendChild(createDetailItem('Fecha de Registro', fechaRegistroFormateada));
    detailsContainer.appendChild(createDetailItem('Última Actualización', fechaActualizacionFormateada));


    contentArea.appendChild(detailsContainer);

    // * Botones de acción (Editar, Volver a la lista).
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('mt-6', 'flex', 'justify-end', 'space-x-3');

    const editButton = document.createElement('button');
    editButton.classList.add('px-4', 'py-2', 'border', 'border-yellow-500', 'text-yellow-600', 'rounded-md', 'hover:bg-yellow-50');
    editButton.textContent = 'Editar Dirección IP';
    editButton.addEventListener('click', () => {
        // * Navego al formulario de edición de la Dirección IP.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccionIpForm', String(ip.id)); // Paso el ID de la IP.
        }
    });

    const backToListButton = document.createElement('button');
    backToListButton.classList.add('px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'text-gray-700', 'hover:bg-gray-50');
    backToListButton.textContent = 'Volver a la Lista';
    backToListButton.addEventListener('click', () => {
        // * Navego de vuelta a la lista de Direcciones IP.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccionesIpList');
        }
    });

    actionsDiv.appendChild(backToListButton);
    actionsDiv.appendChild(editButton);
    contentArea.appendChild(actionsDiv);

    console.log('Herwing renderizó los detalles de la Dirección IP.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
// `params` debe ser el ID de la Dirección IP (como string o número).
// ===============================================================
async function showDireccionIpDetails(params) {
    const ipId = typeof params === 'string' ? params : (params && params.id);
    console.log('Herwing va a mostrar los detalles de una Dirección IP. ID:', ipId);

    if (!ipId) {
        showDireccionIpDetailsError('No se proporcionó un ID de Dirección IP para mostrar los detalles.');
        return;
    }
    showDireccionIpDetailsLoading(ipId); // Muestro carga.

    try {
        let ip = await getDireccionIpById(ipId); // Llamo a la API.
        if (ip && (ip.data || ip.direccion_ip)) { // Ajuste por si la API envuelve la respuesta
            ip = ip.data || ip;
        }
        renderDireccionIpDetails(ip); // Renderizo los detalles.
    } catch (error) {
        showDireccionIpDetailsError(error.message); // Muestro un error si algo falla.
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { showDireccionIpDetails };