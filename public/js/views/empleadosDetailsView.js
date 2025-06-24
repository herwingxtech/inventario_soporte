//public/js/views/empleadoDetailsView.js
import { getEmpleadoById } from '../api.js';
import { showDetailsLoading } from '../utils/loading.js';
import { showDetailsError } from '../utils/error.js';

//* Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

//* Muestra un mensaje de carga mientras se obtienen los detalles del empleado.
function showEmpleadoDetailsLoading(empleadoId) {
    showDetailsLoading('Empleado', empleadoId);
}

//* Muestra un mensaje de error si falla la carga de datos del empleado.
function showEmpleadoDetailsError(message) {
    showDetailsError('Empleado', null, message, 'empleadosList', () => showEmpleadoDetails());
}

//* Renderiza la vista de detalles del empleado.
function renderEmpleadoDetails(empleado) {
    contentArea.innerHTML = ''; //* Limpio cualquier contenido previo.

    if (!empleado) {
        showEmpleadoDetailsError('No se encontraron datos para este empleado.');
        return;
    }

    //* Creo el título para esta vista.
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = `Detalles del Empleado: ${empleado.nombres || ''} ${empleado.apellidos || ''}`;
    contentArea.appendChild(title);

    //* Contenedor para los detalles.
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-md', 'space-y-4');

    //* Función auxiliar para crear un par de etiqueta-valor.
    function createDetailItem(label, value) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('py-2', 'sm:grid', 'sm:grid-cols-3', 'sm:gap-4', 'sm:px-0');

        const dt = document.createElement('dt');
        dt.classList.add('text-sm', 'font-medium', 'text-gray-500');
        dt.textContent = label;

        const dd = document.createElement('dd');
        dd.classList.add('mt-1', 'text-sm', 'text-gray-900', 'sm:mt-0', 'sm:col-span-2');
        dd.textContent = value || 'N/A'; //* Muestro N/A si el valor es nulo o vacío.

        itemDiv.appendChild(dt);
        itemDiv.appendChild(dd);
        return itemDiv;
    }

    //* Creo y añado los ítems de detalle.
    detailsContainer.appendChild(createDetailItem('ID', empleado.id));
    detailsContainer.appendChild(createDetailItem('Número de Empleado', empleado.numero_empleado));
    detailsContainer.appendChild(createDetailItem('Nombres', empleado.nombres));
    detailsContainer.appendChild(createDetailItem('Apellidos', empleado.apellidos));
    detailsContainer.appendChild(createDetailItem('Email Personal', empleado.email_personal));
    detailsContainer.appendChild(createDetailItem('Teléfono', empleado.telefono));
    detailsContainer.appendChild(createDetailItem('Puesto', empleado.puesto));

    const fechaNacimientoFormateada = empleado.fecha_nacimiento ? new Date(empleado.fecha_nacimiento).toLocaleDateString() : 'N/A';
    const fechaIngresoFormateada = empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString() : 'N/A';
    const fechaRegistroFormateada = empleado.fecha_registro ? new Date(empleado.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionFormateada = empleado.fecha_actualizacion ? new Date(empleado.fecha_actualizacion).toLocaleString() : 'N/A';

    detailsContainer.appendChild(createDetailItem('Fecha de Nacimiento', fechaNacimientoFormateada));
    detailsContainer.appendChild(createDetailItem('Fecha de Ingreso', fechaIngresoFormateada));
    detailsContainer.appendChild(createDetailItem('Sucursal Asignada', empleado.nombre_sucursal)); //* Del JOIN
    detailsContainer.appendChild(createDetailItem('Área Asignada', empleado.nombre_area));       //* Del JOIN
    detailsContainer.appendChild(createDetailItem('Estado', empleado.status_nombre));           //* Del JOIN
    detailsContainer.appendChild(createDetailItem('Fecha de Registro', fechaRegistroFormateada));
    detailsContainer.appendChild(createDetailItem('Última Actualización', fechaActualizacionFormateada));


    contentArea.appendChild(detailsContainer);

    //* Botones de acción (Editar, Volver a la lista).
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('mt-6', 'flex', 'justify-end', 'space-x-3');

    const editButton = document.createElement('button');
    editButton.classList.add('px-4', 'py-2', 'border', 'border-yellow-500', 'text-yellow-600', 'rounded-md', 'hover:bg-yellow-50');
    editButton.textContent = 'Editar Empleado';
    editButton.addEventListener('click', () => {
        //* Navego al formulario de edición del empleado.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleadoForm', String(empleado.id)); //* Paso el ID del empleado.
        }
    });

    const backToListButton = document.createElement('button');
    backToListButton.classList.add('px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'text-gray-700', 'hover:bg-gray-50');
    backToListButton.textContent = 'Volver a la Lista';
    backToListButton.addEventListener('click', () => {
        //* Navego de vuelta a la lista de empleados.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleadosList');
        }
    });

    actionsDiv.appendChild(backToListButton);
    actionsDiv.appendChild(editButton);
    contentArea.appendChild(actionsDiv);

    console.log('Detalles del empleado renderizados por Herwing.');
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