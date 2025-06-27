//public/js/views/mantenimientosDetailsView.js
//* Este módulo maneja la lógica para mostrar los detalles de un mantenimiento específico.

import { getMantenimientoById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

//* Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

//* Muestra un mensaje de carga mientras se obtienen los detalles del mantenimiento.
function showMantenimientoDetailsLoading(mantenimientoId) {
    showDetailsLoading('Mantenimiento', mantenimientoId);
}

//* Muestra un mensaje de error si falla la carga de datos del mantenimiento.
function showMantenimientoDetailsError(message) {
    showDetailsError('Mantenimiento', null, message, 'mantenimientos-list', () => showMantenimientoDetails());
}

//* Renderiza la vista de detalles del mantenimiento.
function renderMantenimientoDetails(mantenimiento) {
    contentArea.innerHTML = '';
    
    if (!mantenimiento) {
        showMantenimientoDetailsError('No se encontraron datos para este mantenimiento.');
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
    title.textContent = `Detalles del Mantenimiento (ID: ${mantenimiento.id})`;
    cardHeader.appendChild(title);
    card.appendChild(cardHeader);

    // Body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // Grid de detalles
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

    addDetail('ID', mantenimiento.id);
    addDetail('Equipo', mantenimiento.equipo_nombre || mantenimiento.numero_serie);
    addDetail('Tipo de Mantenimiento', mantenimiento.tipo);
    addDetail('Proveedor', mantenimiento.proveedor);
    addDetail('Responsable', mantenimiento.responsable);
    addDetail('Descripción', mantenimiento.descripcion);
    addDetail('Estado', mantenimiento.status_nombre, true);
    
    const fechaMantenimientoF = mantenimiento.fecha_mantenimiento ? new Date(mantenimiento.fecha_mantenimiento).toLocaleDateString() : 'N/A';
    const fechaRegistroF = mantenimiento.fecha_registro ? new Date(mantenimiento.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionF = mantenimiento.fecha_actualizacion ? new Date(mantenimiento.fecha_actualizacion).toLocaleString() : 'N/A';
    
    addDetail('Fecha de Mantenimiento', fechaMantenimientoF);
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
    backBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('mantenimientos-list'); };
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Mantenimiento';
    editBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('mantenimiento-form', String(mantenimiento.id)); };
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);

    contentArea.appendChild(card);
    console.log('Detalles del mantenimiento renderizados (estilo card).');
}

//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
//* `params` debe contener `{ id: mantenimientoId }`.
export async function showMantenimientoDetails(params) {
    console.log('Herwing va a mostrar los detalles de un mantenimiento. Parámetros:', params);
    
    //* Extraer el ID del parámetro. Si params es un string, usarlo directamente; si es un objeto, extraer params.id.
    const mantenimientoId = typeof params === 'string' ? params : (params && params.id);
    
    if (!mantenimientoId) {
        console.error('No se proporcionó un ID de mantenimiento para mostrar los detalles.');
        contentArea.innerHTML = '<p class="text-red-500">Error al cargar detalles del mantenimiento: No se proporcionó un ID de mantenimiento para mostrar los detalles.</p>';
        return;
    }

    try {
        showMantenimientoDetailsLoading(mantenimientoId);
        const mantenimiento = await getMantenimientoById(mantenimientoId);
        renderMantenimientoDetails(mantenimiento);
    } catch (error) {
        console.error('Error al cargar los detalles del mantenimiento:', error);
        showMantenimientoDetailsError(error.message || 'Error desconocido al cargar los detalles del mantenimiento.');
    }
}