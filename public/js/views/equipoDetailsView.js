//public/js/views/equipoDetailsView.js
// * Este módulo maneja la lógica para mostrar los detalles de un equipo específico.

import { getEquipoById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

// * Muestra un mensaje de carga mientras se obtienen los detalles del equipo.
function showEquipoDetailsLoading(equipoId) {
    showDetailsLoading('Equipo', equipoId);
}

// * Muestra un mensaje de error si falla la carga de datos del equipo.
function showEquipoDetailsError(message) {
    showDetailsError('Equipo', null, message, 'equiposList', () => showEquipoDetails());
}

// * Renderiza la vista de detalles del equipo.
function renderEquipoDetails(equipo) {
    contentArea.innerHTML = '';

    if (!equipo) {
        showEquipoDetailsError('No se encontraron datos para este equipo.');
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
    title.textContent = `Detalles del Equipo: ${equipo.nombre_equipo || equipo.numero_serie}`;
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
    addDetail('ID', equipo.id);
    addDetail('Número de Serie', equipo.numero_serie);
    addDetail('Nombre del Equipo (Alias)', equipo.nombre_equipo);
    addDetail('Tipo de Equipo', equipo.nombre_tipo_equipo);
    addDetail('Marca', equipo.marca);
    addDetail('Modelo', equipo.modelo);
    addDetail('Sucursal Actual', equipo.nombre_sucursal_actual);
    addDetail('Procesador', equipo.procesador);
    addDetail('RAM', equipo.ram);
    addDetail('Disco Duro', equipo.disco_duro);
    addDetail('Sistema Operativo', equipo.sistema_operativo);
    addDetail('MAC Address', equipo.mac_address);
    const fechaCompraFormateada = equipo.fecha_compra ? new Date(equipo.fecha_compra).toLocaleDateString() : 'N/A';
    const fechaRegistroFormateada = equipo.fecha_registro ? new Date(equipo.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionFormateada = equipo.fecha_actualizacion ? new Date(equipo.fecha_actualizacion).toLocaleString() : 'N/A';
    addDetail('Fecha de Compra', fechaCompraFormateada);
    addDetail('Fecha de Registro', fechaRegistroFormateada);
    addDetail('Última Actualización', fechaActualizacionFormateada);
    addDetail('Estado', equipo.status_nombre, true);
    addDetail('Otras Características / Notas', equipo.otras_caracteristicas);
    cardBody.appendChild(detailsGrid);
    card.appendChild(cardBody);

    // Botones de acción
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-footer d-flex justify-content-end gap-2';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-danger light btn-sl-sm';
    backBtn.innerHTML = '<i class="fa fa-arrow-left me-2"></i>Volver a la Lista';
    backBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('equipos-list'); };
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Equipo';
    editBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('equipo-form', String(equipo.id)); };
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);

    contentArea.appendChild(card);
    console.log('Detalles del equipo renderizados (estilo card).');
}


//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
//* `params` debe contener `{ id: equipoId }`.
export async function showEquipoDetails(params) {
    console.log('Herwing va a mostrar los detalles de un equipo. Parámetros:', params);
    //! Extraer el ID del parámetro. Si params es un string, usarlo directamente; si es un objeto, extraer params.id.
    const equipoId = typeof params === 'string' ? params : (params && params.id);
    if (!equipoId) {
        console.error('No se proporcionó un ID de equipo para mostrar los detalles.');
        contentArea.innerHTML = '<p class="text-red-500">Error al cargar detalles del equipo: No se proporcionó un ID de equipo para mostrar los detalles.</p>';
        return;
    }
    try {
        showDetailsLoading('equipo', equipoId);
        const equipo = await getEquipoById(equipoId);
        renderEquipoDetails(equipo);
    } catch (error) {
        console.error('Error al cargar los detalles del equipo:', error);
        contentArea.innerHTML = `<p class="text-red-500">Error al cargar detalles del equipo: ${error.message}</p>`;
    }
}