// public/js/views/equipoDetailsView.js
// * Este módulo maneja la lógica para mostrar los detalles de un equipo específico.

//? ¿Qué funciones de API necesito? 'getEquipoById'
import { getEquipoById } from '../api.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// * Muestra un mensaje de carga mientras se obtienen los detalles del equipo.
function showEquipoDetailsLoading(equipoId) {
    contentArea.innerHTML = `<p>Cargando detalles del equipo ID: ${equipoId}...</p>`;
}

// * Muestra un mensaje de error si falla la carga de datos del equipo.
function showEquipoDetailsError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar detalles del equipo:</p><p class="text-red-500">${message}</p>`;
}

// * Renderiza la vista de detalles del equipo.
function renderEquipoDetails(equipo) {
    contentArea.innerHTML = ''; // Limpio cualquier contenido previo.

    if (!equipo) {
        showEquipoDetailsError('No se encontraron datos para este equipo.');
        return;
    }

    // * Creo el título para esta vista.
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = `Detalles del Equipo: ${equipo.nombre_equipo || equipo.numero_serie}`;
    contentArea.appendChild(title);

    // * Contenedor para los detalles con un diseño de dos columnas en pantallas medianas.
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-md', 'space-y-4');

    // * Función auxiliar para crear un par de etiqueta-valor.
    function createDetailItem(label, value) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('py-2', 'sm:grid', 'sm:grid-cols-3', 'sm:gap-4', 'sm:px-0'); // Estilo de definición

        const dt = document.createElement('dt'); // Etiqueta
        dt.classList.add('text-sm', 'font-medium', 'text-gray-500');
        dt.textContent = label;

        const dd = document.createElement('dd'); // Valor
        dd.classList.add('mt-1', 'text-sm', 'text-gray-900', 'sm:mt-0', 'sm:col-span-2');
        dd.textContent = value || 'N/A'; // Muestro N/A si el valor es nulo o vacío.

        itemDiv.appendChild(dt);
        itemDiv.appendChild(dd);
        return itemDiv;
    }

    // * Creo y añado los ítems de detalle.
    detailsContainer.appendChild(createDetailItem('ID', equipo.id));
    detailsContainer.appendChild(createDetailItem('Número de Serie', equipo.numero_serie));
    detailsContainer.appendChild(createDetailItem('Nombre del Equipo (Alias)', equipo.nombre_equipo));
    detailsContainer.appendChild(createDetailItem('Tipo de Equipo', equipo.nombre_tipo_equipo)); // Del JOIN
    detailsContainer.appendChild(createDetailItem('Marca', equipo.marca));
    detailsContainer.appendChild(createDetailItem('Modelo', equipo.modelo));
    detailsContainer.appendChild(createDetailItem('Sucursal Actual', equipo.nombre_sucursal_actual)); // Del JOIN
    detailsContainer.appendChild(createDetailItem('Procesador', equipo.procesador));
    detailsContainer.appendChild(createDetailItem('RAM', equipo.ram));
    detailsContainer.appendChild(createDetailItem('Disco Duro', equipo.disco_duro));
    detailsContainer.appendChild(createDetailItem('Sistema Operativo', equipo.sistema_operativo));
    detailsContainer.appendChild(createDetailItem('MAC Address', equipo.mac_address));
    // Formateo de fechas
    const fechaCompraFormateada = equipo.fecha_compra ? new Date(equipo.fecha_compra).toLocaleDateString() : 'N/A';
    const fechaRegistroFormateada = equipo.fecha_registro ? new Date(equipo.fecha_registro).toLocaleString() : 'N/A';
    const fechaActualizacionFormateada = equipo.fecha_actualizacion ? new Date(equipo.fecha_actualizacion).toLocaleString() : 'N/A';

    detailsContainer.appendChild(createDetailItem('Fecha de Compra', fechaCompraFormateada));
    detailsContainer.appendChild(createDetailItem('Fecha de Registro', fechaRegistroFormateada));
    detailsContainer.appendChild(createDetailItem('Última Actualización', fechaActualizacionFormateada));
    detailsContainer.appendChild(createDetailItem('Estado', equipo.status_nombre)); // Del JOIN
    detailsContainer.appendChild(createDetailItem('Otras Características / Notas', equipo.otras_caracteristicas));


    contentArea.appendChild(detailsContainer);

    // * Botones de acción (ej. Editar, Volver a la lista)
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('mt-6', 'flex', 'justify-end', 'space-x-3');

    const editButton = document.createElement('button');
    editButton.classList.add('px-4', 'py-2', 'border', 'border-yellow-500', 'text-yellow-600', 'rounded-md', 'hover:bg-yellow-50');
    editButton.textContent = 'Editar Equipo';
    editButton.addEventListener('click', () => {
        // Navegar al formulario de edición
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('equipoForm', String(equipo.id));
        }
    });

    const backToListButton = document.createElement('button');
    backToListButton.classList.add('px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'text-gray-700', 'hover:bg-gray-50');
    backToListButton.textContent = 'Volver a la Lista';
    backToListButton.addEventListener('click', () => {
        // Navegar de vuelta a la lista de equipos
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('equiposList');
        }
    });

    actionsDiv.appendChild(backToListButton);
    actionsDiv.appendChild(editButton);
    contentArea.appendChild(actionsDiv);


    console.log('Detalles del equipo renderizados.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DE DETALLES
// `params` debe contener `{ id: equipoId }`.
// ===============================================================
export async function showEquipoDetails(params) {
    console.log('Herwing va a mostrar los detalles de un equipo. Parámetros:', params);
    // Extraer el ID del parámetro. Si params es un string, usarlo directamente; si es un objeto, extraer params.id.
    const equipoId = typeof params === 'string' ? params : (params && params.id);
    if (!equipoId) {
        console.error('No se proporcionó un ID de equipo para mostrar los detalles.');
        contentArea.innerHTML = '<p class="text-red-500">Error al cargar detalles del equipo: No se proporcionó un ID de equipo para mostrar los detalles.</p>';
        return;
    }
    try {
        const equipo = await getEquipoById(equipoId);
        renderEquipoDetails(equipo);
    } catch (error) {
        console.error('Error al cargar los detalles del equipo:', error);
        contentArea.innerHTML = `<p class="text-red-500">Error al cargar detalles del equipo: ${error.message}</p>`;
    }
}