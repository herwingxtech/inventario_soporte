import { getNotaById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

const contentArea = document.getElementById('content-area');

function showNotaDetailsError(message) {
    showDetailsError('Nota', null, message, 'notas-list', () => showNotaDetails());
}

function renderNotaDetails(nota) {
    contentArea.innerHTML = '';
    if (!nota) {
        showNotaDetailsError('No se encontraron datos para esta nota.');
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
    title.textContent = `Detalles de la Nota (ID: ${nota.id})`;
    cardHeader.appendChild(title);
    card.appendChild(cardHeader);
    // Body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    const detailsGrid = document.createElement('dl');
    detailsGrid.className = 'row mb-0';
    // Estado con badge
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
    addDetail('ID', nota.id);
    addDetail('Título', nota.titulo);
    addDetail('Descripción', nota.descripcion);
    addDetail('Relacionado a', nota.relacionado_a);
    addDetail('ID Relacionado', nota.id_relacionado);
    addDetail('Estado', nota.status_nombre, true);
    const fechaRegistroF = nota.fecha_registro ? new Date(nota.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionF = nota.fecha_actualizacion ? new Date(nota.fecha_actualizacion).toLocaleString() : 'N/A';
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
    backBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('notas-list'); };
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Nota';
    editBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('nota-form', String(nota.id)); };
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);
    contentArea.appendChild(card);
    console.log('Detalles de la nota renderizados (estilo card).');
}

export async function showNotaDetails(params) {
    const notaId = typeof params === 'string' ? params : (params && params.id);
    if (!notaId) {
        showNotaDetailsError('No se proporcionó un ID de nota para mostrar los detalles.');
        return;
    }
    showDetailsLoading('nota', notaId);
    try {
        let nota = await getNotaById(notaId);
        if (nota && (nota.data || nota.nota)) {
            nota = nota.data || nota.nota;
        }
        renderNotaDetails(nota);
    } catch (error) {
        showNotaDetailsError(error.message || 'No se pudo obtener la nota.');
    }
} 