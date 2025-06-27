//public/js/views/empleadoDetailsView.js
import { getEmpleadoById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';
import { getStatusBadge } from '../utils/statusBadge.js';

//* Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

//* Muestra un mensaje de carga mientras se obtienen los detalles del empleado.
function showEmpleadoDetailsLoading(empleadoId) {
    showDetailsLoading('Empleado', empleadoId);
}

//* Muestra un mensaje de error si falla la carga de datos del empleado.
function showEmpleadoDetailsError(message) {
    showDetailsError('Empleado', null, message, 'empleados-list', () => showEmpleadoDetails());
}

//* Renderiza la vista de detalles del empleado.
function renderEmpleadoDetails(empleado) {
    contentArea.innerHTML = '';
    if (!empleado) {
        showEmpleadoDetailsError('No se encontraron datos para este empleado.');
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
    title.textContent = `Detalles del Empleado: ${empleado.nombres || ''} ${empleado.apellidos || ''}`;
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
    addDetail('ID', empleado.id);
    addDetail('Número de Empleado', empleado.numero_empleado);
    addDetail('Nombres', empleado.nombres);
    addDetail('Apellidos', empleado.apellidos);
    addDetail('Email Personal', empleado.email_personal);
    addDetail('Teléfono', empleado.telefono);
    addDetail('Puesto', empleado.puesto);
    const fechaNacimientoFormateada = empleado.fecha_nacimiento ? new Date(empleado.fecha_nacimiento).toLocaleDateString() : 'N/A';
    const fechaIngresoFormateada = empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString() : 'N/A';
    const fechaRegistroFormateada = empleado.fecha_registro ? new Date(empleado.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionFormateada = empleado.fecha_actualizacion ? new Date(empleado.fecha_actualizacion).toLocaleString() : 'N/A';
    addDetail('Fecha de Nacimiento', fechaNacimientoFormateada);
    addDetail('Fecha de Ingreso', fechaIngresoFormateada);
    addDetail('Sucursal Asignada', empleado.nombre_sucursal);
    addDetail('Área Asignada', empleado.nombre_area);
    addDetail('Estado', empleado.status_nombre, true);
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
    backBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('empleados-list'); };
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary btn-sl-sm';
    editBtn.innerHTML = '<i class="fa fa-edit me-2"></i>Editar Empleado';
    editBtn.onclick = () => { if (typeof window.navigateTo === 'function') window.navigateTo('empleado-form', String(empleado.id)); };
    actionsDiv.appendChild(backBtn);
    actionsDiv.appendChild(editBtn);
    card.appendChild(actionsDiv);
    contentArea.appendChild(card);
    console.log('Detalles del empleado renderizados (estilo card).');
}


//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
//* `params` debe ser el ID del empleado (como string o número).
async function showEmpleadoDetails(params) {
    //* Extraigo el ID del parámetro, que puede ser un string (de la URL) o un objeto (si se pasa internamente).
    const empleadoId = typeof params === 'string' ? params : (params && params.id);
    console.log('Herwing va a mostrar los detalles de un empleado. ID:', empleadoId);

    if (!empleadoId) {
        showEmpleadoDetailsError('No se proporcionó un ID de empleado para mostrar los detalles.');
        return;
    }
    showEmpleadoDetailsLoading(empleadoId); //* Muestro carga.

    try {
        let empleado = await getEmpleadoById(empleadoId); //* Llamo a la API.
        //* Si la API envuelve los datos, los extraigo.
        if (empleado && (empleado.data || empleado.empleado)) {
            empleado = empleado.data || empleado.empleado;
        }
        renderEmpleadoDetails(empleado); //* Renderizo los detalles.
    } catch (error) {
        showEmpleadoDetailsError(error.message); //* Muestro un error si algo falla.
    }
}

export { showEmpleadoDetails };