//public/js/views/asignacionDetailsView.js
//* Este módulo maneja la lógica para mostrar los detalles de una Asignación específica.

import { getAsignacionById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

//* Referencia al contenedor principal.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

function showAsignacionDetailsLoading(asignacionId) {
    showDetailsLoading('Asignación', asignacionId);
}

function showAsignacionDetailsError(message) {
    showDetailsError('Asignación', null, message, 'asignacionesList', () => showAsignacionDetails());
}

function renderAsignacionDetails(asignacion) {
    contentArea.innerHTML = '';
    if (!asignacion) {
        showAsignacionDetailsError('No se encontraron datos para esta asignación.');
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
    title.textContent = `Detalles de la Asignación (ID: ${asignacion.id})`;
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
    addDetail('ID Asignación', asignacion.id);
    addDetail('Equipo (Serie)', `${asignacion.equipo_numero_serie || 'N/A'} (ID: ${asignacion.id_equipo})`);
    addDetail('Equipo (Nombre)', asignacion.equipo_nombre);
    const empleadoInfo = asignacion.id_empleado ? `${asignacion.empleado_nombres || ''} ${asignacion.empleado_apellidos || ''} (ID: ${asignacion.id_empleado})` : 'N/A';
    addDetail('Empleado Asignado', empleadoInfo);
    const sucursalInfo = asignacion.id_sucursal_asignado ? `${asignacion.sucursal_asignada_nombre || ''} (ID: ${asignacion.id_sucursal_asignado})` : 'N/A';
    addDetail('Sucursal Asignada', sucursalInfo);
    const areaInfo = asignacion.id_area_asignado ? `${asignacion.area_asignada_nombre || ''} (ID: ${asignacion.id_area_asignado})` : 'N/A';
    addDetail('Área Asignada', areaInfo);
    const equipoPadreInfo = asignacion.id_equipo_padre ? `${asignacion.equipo_padre_numero_serie || ''} - ${asignacion.equipo_padre_nombre || 'Sin Nombre'} (ID: ${asignacion.id_equipo_padre})` : 'N/A';
    addDetail('Componente de (Equipo Padre)', equipoPadreInfo);
    const ipInfo = asignacion.id_ip ? `${asignacion.ip_direccion || ''} (ID: ${asignacion.id_ip})` : 'N/A (o DHCP)';
    addDetail('Dirección IP Asignada', ipInfo);
    const fechaAsignacionF = asignacion.fecha_asignacion ? new Date(asignacion.fecha_asignacion).toLocaleString() : 'N/A';
    const fechaFinAsignacionF = asignacion.fecha_fin_asignacion ? new Date(asignacion.fecha_fin_asignacion).toLocaleString() : 'ACTIVA';
    const fechaRegistroF = asignacion.fecha_registro ? new Date(asignacion.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionF = asignacion.fecha_actualizacion ? new Date(asignacion.fecha_actualizacion).toLocaleString() : 'N/A';
    addDetail('Fecha de Asignación', fechaAsignacionF);
    addDetail('Fecha de Fin de Asignación', fechaFinAsignacionF);
    addDetail('Estado', asignacion.status_nombre, true);
    addDetail('Observaciones', asignacion.observacion);
    addDetail('Fecha de Registro', fechaRegistroF);
    addDetail('Última Actualización', fechaActualizacionF);
    cardBody.appendChild(detailsGrid);
    card.appendChild(cardBody);
    // Botones de acción
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-footer d-flex justify-content-end gap-2';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-danger light btn-sl-sm';
    backBtn.innerHTML = '<i class="fa fa-arrow-left me-2"></i>Volver a la Lista';
    backBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('asignaciones-list'); };
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Asignación';
    if (asignacion.status_nombre && asignacion.status_nombre.toLowerCase() === 'finalizado') {
        editBtn.disabled = true;
        editBtn.classList.add('opacity-50', 'cursor-not-allowed');
        editBtn.title = 'No se puede editar una asignación finalizada';
    } else {
        editBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('asignacion-form', String(asignacion.id)); };
    }
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);
    contentArea.appendChild(card);
    console.log('Detalles de la asignación renderizados (estilo card).');
}

//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
async function showAsignacionDetails(params) {
    const asignacionId = typeof params === 'string' ? params : (params && params.id);
    console.log('Herwing va a mostrar los detalles de una Asignación. ID:', asignacionId);

    if (!asignacionId) {
        showAsignacionDetailsError('No se proporcionó un ID de asignación para mostrar los detalles.');
        return;
    }
    showAsignacionDetailsLoading(asignacionId);

    try {
        let asignacion = await getAsignacionById(asignacionId);
        if (asignacion && (asignacion.data || asignacion.asignacion)) {
            asignacion = asignacion.data || asignacion.asignacion;
        }
        renderAsignacionDetails(asignacion);
    } catch (error) {
        showAsignacionDetailsError(error.message);
    }
}

export { showAsignacionDetails };