// public/js/views/asignacionDetailsView.js
// * Este módulo maneja la lógica para mostrar los detalles de una Asignación específica.

//? ¿Qué función de API necesito? 'getAsignacionById'.
import { getAsignacionById } from '../api.js';

// * Referencia al contenedor principal.
const contentArea = document.getElementById('content-area');

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

function showAsignacionDetailsLoading(asignacionId) {
    contentArea.innerHTML = `<p>Cargando detalles de la Asignación ID: ${asignacionId}...</p>`;
}

function showAsignacionDetailsError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar detalles de la asignación:</p><p class="text-red-500">${message}</p>
                             <button class="mt-2 px-4 py-2 border border-gray-300 rounded-md" onclick="window.navigateTo('asignacionesList')">Volver a la lista</button>`;
}

function renderAsignacionDetails(asignacion) {
    contentArea.innerHTML = '';

    if (!asignacion) {
        showAsignacionDetailsError('No se encontraron datos para esta asignación.');
        return;
    }

    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = `Detalles de la Asignación (ID: ${asignacion.id})`;
    contentArea.appendChild(title);

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-md', 'space-y-4');

    function createDetailItem(label, value) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('py-2', 'sm:grid', 'sm:grid-cols-3', 'sm:gap-4', 'sm:px-0');
        const dt = document.createElement('dt');
        dt.classList.add('text-sm', 'font-medium', 'text-gray-500');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.classList.add('mt-1', 'text-sm', 'text-gray-900', 'sm:mt-0', 'sm:col-span-2');
        dd.textContent = value || 'N/A';
        itemDiv.appendChild(dt);
        itemDiv.appendChild(dd);
        return itemDiv;
    }

    detailsContainer.appendChild(createDetailItem('ID Asignación', asignacion.id));
    detailsContainer.appendChild(createDetailItem('Equipo (Serie)', `${asignacion.equipo_numero_serie || 'N/A'} (ID: ${asignacion.id_equipo})`));
    detailsContainer.appendChild(createDetailItem('Equipo (Nombre)', asignacion.equipo_nombre));

    const empleadoInfo = asignacion.id_empleado ? `${asignacion.empleado_nombres || ''} ${asignacion.empleado_apellidos || ''} (ID: ${asignacion.id_empleado})` : 'N/A';
    detailsContainer.appendChild(createDetailItem('Empleado Asignado', empleadoInfo));

    const sucursalInfo = asignacion.id_sucursal_asignado ? `${asignacion.sucursal_asignada_nombre || ''} (ID: ${asignacion.id_sucursal_asignado})` : 'N/A';
    detailsContainer.appendChild(createDetailItem('Sucursal Asignada', sucursalInfo));

    const areaInfo = asignacion.id_area_asignado ? `${asignacion.area_asignada_nombre || ''} (ID: ${asignacion.id_area_asignado})` : 'N/A';
    detailsContainer.appendChild(createDetailItem('Área Asignada', areaInfo));

    const equipoPadreInfo = asignacion.id_equipo_padre ? `${asignacion.equipo_padre_numero_serie || ''} - ${asignacion.equipo_padre_nombre || 'Sin Nombre'} (ID: ${asignacion.id_equipo_padre})` : 'N/A';
    detailsContainer.appendChild(createDetailItem('Componente de (Equipo Padre)', equipoPadreInfo));

    const ipInfo = asignacion.id_ip ? `${asignacion.ip_direccion || ''} (ID: ${asignacion.id_ip})` : 'N/A (o DHCP)';
    detailsContainer.appendChild(createDetailItem('Dirección IP Asignada', ipInfo));

    const fechaAsignacionF = asignacion.fecha_asignacion ? new Date(asignacion.fecha_asignacion).toLocaleString() : 'N/A';
    const fechaFinAsignacionF = asignacion.fecha_fin_asignacion ? new Date(asignacion.fecha_fin_asignacion).toLocaleString() : 'ACTIVA';
    const fechaRegistroF = asignacion.fecha_registro ? new Date(asignacion.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionF = asignacion.fecha_actualizacion ? new Date(asignacion.fecha_actualizacion).toLocaleString() : 'N/A';

    detailsContainer.appendChild(createDetailItem('Fecha de Asignación', fechaAsignacionF));
    detailsContainer.appendChild(createDetailItem('Fecha de Fin de Asignación', fechaFinAsignacionF));
    detailsContainer.appendChild(createDetailItem('Estado de la Asignación', asignacion.status_nombre));
    detailsContainer.appendChild(createDetailItem('Observaciones', asignacion.observacion));
    detailsContainer.appendChild(createDetailItem('Fecha de Registro', fechaRegistroF));
    detailsContainer.appendChild(createDetailItem('Última Actualización', fechaActualizacionF));

    contentArea.appendChild(detailsContainer);

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('mt-6', 'flex', 'justify-end', 'space-x-3');

    const editButton = document.createElement('button');
    editButton.classList.add('px-4', 'py-2', 'border', 'border-yellow-500', 'text-yellow-600', 'rounded-md', 'hover:bg-yellow-50');
    editButton.textContent = 'Editar Asignación';
    
    // Deshabilitar si el estado es "Finalizado"
    if (asignacion.status_nombre && asignacion.status_nombre.toLowerCase() === 'finalizado') {
        editButton.disabled = true;
        editButton.classList.add('opacity-50', 'cursor-not-allowed');
        editButton.title = 'No se puede editar una asignación finalizada';
    } else {
        editButton.addEventListener('click', () => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('asignacionForm', String(asignacion.id));
            }
        });
    }

    const backToListButton = document.createElement('button');
    backToListButton.classList.add('px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'text-gray-700', 'hover:bg-gray-50');
    backToListButton.textContent = 'Volver a la Lista';
    backToListButton.addEventListener('click', () => {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('asignacionesList');
        }
    });

    actionsDiv.appendChild(backToListButton);
    actionsDiv.appendChild(editButton);
    contentArea.appendChild(actionsDiv);

    console.log('Herwing renderizó los detalles de la Asignación.');
}

// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
// ===============================================================
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

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { showAsignacionDetails };