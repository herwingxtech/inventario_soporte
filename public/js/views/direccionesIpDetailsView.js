//public/js/views/direccionIpDetailsView.js
//* Este módulo maneja la lógica para mostrar los detalles de una Dirección IP específica.

//? ¿Qué función de API necesito? 'getDireccionIpById'.
import { getDireccionIpById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

//* Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

//* Muestra un mensaje de carga mientras se obtienen los detalles de la IP.
function showDireccionIpDetailsLoading(ipId) {
    showDetailsLoading('Dirección IP', ipId);
}

//* Muestra un mensaje de error si falla la carga de datos de la IP.
function showDireccionIpDetailsError(message) {
    showDetailsError('Dirección IP', null, message, 'direccionesIpList', () => showDireccionIpDetails());
}

//* Renderiza la vista de detalles de la Dirección IP.
function renderDireccionIpDetails(ip) {
    contentArea.innerHTML = '';
    if (!ip) {
        showDireccionIpDetailsError('No se encontraron datos para esta Dirección IP.');
        return;
    }
    // Card principal
    const card = document.createElement('div');
    card.className = 'card shadow-sm mb-4';
    // Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    const title = document.createElement('h4');
    title.className = 'card-title mb-0';
    title.textContent = `Detalles de la Dirección IP: ${ip.direccion_ip}`;
    cardHeader.appendChild(title);
    card.appendChild(cardHeader);
    // Body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    const detailsGrid = document.createElement('dl');
    detailsGrid.className = 'row mb-0';
    function addDetail(label, value, isStatus) {
        const dt = document.createElement('dt');
        dt.className = 'col-sm-4 text-sm-end text-muted';
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.className = 'col-sm-8 mb-2';
        dd.innerHTML = isStatus ? getStatusBadge(value) : (value || 'N/A');
        detailsGrid.appendChild(dt);
        detailsGrid.appendChild(dd);
    }
    addDetail('ID', ip.id);
    addDetail('Dirección IP', ip.direccion_ip);
    addDetail('Sucursal Asociada', ip.nombre_sucursal);
    addDetail('Comentario / Notas', ip.comentario);
    addDetail('Estado', ip.status_nombre, true);
    const fechaRegistroFormateada = ip.fecha_registro ? new Date(ip.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionFormateada = ip.fecha_actualizacion ? new Date(ip.fecha_actualizacion).toLocaleString() : 'N/A';
    addDetail('Fecha de Registro', fechaRegistroFormateada);
    addDetail('Última Actualización', fechaActualizacionFormateada);
    cardBody.appendChild(detailsGrid);
    card.appendChild(cardBody);
    // Botones de acción
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-footer d-flex justify-content-end gap-2';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-danger light btn-sl-sm';
    backBtn.innerHTML = '<i class="fa fa-arrow-left me-2"></i>Volver a la Lista';
    backBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('direcciones-ip-list'); };
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Dirección IP';
    editBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('direccion-ip-form', String(ip.id)); };
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);
    contentArea.appendChild(card);
    console.log('Detalles de la Dirección IP renderizados (estilo card).');
}


//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
//* `params` debe ser el ID de la Dirección IP (como string o número).
async function showDireccionIpDetails(params) {
    const ipId = typeof params === 'string' ? params : (params && params.id);
    console.log('Herwing va a mostrar los detalles de una Dirección IP. ID:', ipId);

    if (!ipId) {
        showDireccionIpDetailsError('No se proporcionó un ID de Dirección IP para mostrar los detalles.');
        return;
    }
    showDireccionIpDetailsLoading(ipId); //* Muestro carga.

    try {
        let ip = await getDireccionIpById(ipId); //* Llamo a la API.
        if (ip && (ip.data || ip.direccion_ip)) { //* Ajuste por si la API envuelve la respuesta
            ip = ip.data || ip;
        }
        renderDireccionIpDetails(ip); //* Renderizo los detalles.
    } catch (error) {
        showDireccionIpDetailsError(error.message); //* Muestro un error si algo falla.
    }
}

export { showDireccionIpDetails };