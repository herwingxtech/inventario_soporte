import { getCuentaEmailById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');

function showCuentaEmailDetailsError(message) {
    showDetailsError('Cuenta Email', null, message, 'cuentas-email-list', () => showCuentaEmailDetails());
}

function renderCuentaEmailDetails(cuenta) {
    contentArea.innerHTML = '';
    if (!cuenta) {
        showCuentaEmailDetailsError('No se encontraron datos para esta cuenta de email.');
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
    title.textContent = `Detalles de la Cuenta Email: ${cuenta.email}`;
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
    addDetail('ID', cuenta.id);
    addDetail('Email', cuenta.email);
    addDetail('Empleado Asignado', cuenta.nombre_empleado);
    addDetail('Sucursal', cuenta.nombre_sucursal);
    addDetail('Área', cuenta.nombre_area);
    addDetail('Tipo', cuenta.tipo);
    addDetail('Estado', cuenta.status_nombre, true);
    const fechaRegistroFormateada = cuenta.fecha_registro ? new Date(cuenta.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionFormateada = cuenta.fecha_actualizacion ? new Date(cuenta.fecha_actualizacion).toLocaleString() : 'N/A';
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
    backBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('cuentas-email-list'); };
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Cuenta Email';
    editBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('cuenta-email-form', String(cuenta.id)); };
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);
    contentArea.appendChild(card);
    console.log('Detalles de la cuenta email renderizados (estilo card).');
}

export async function showCuentaEmailDetails(params) {
    const cuentaId = typeof params === 'string' ? params : (params && params.id);
    if (!cuentaId) {
        showCuentaEmailDetailsError('No se proporcionó un ID de cuenta de email para mostrar los detalles.');
        return;
    }
    showDetailsLoading('cuenta de email', cuentaId);
    try {
        let cuenta = await getCuentaEmailById(cuentaId);
        if (cuenta && (cuenta.data || cuenta.cuenta)) {
            cuenta = cuenta.data || cuenta.cuenta;
        }
        renderCuentaEmailDetails(cuenta);
    } catch (error) {
        showCuentaEmailDetailsError(error.message || 'No se pudo obtener la cuenta de email.');
    }
} 