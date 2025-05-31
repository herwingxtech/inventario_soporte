// public/js/views/equiposView.js
// ! Vista de listado de equipos
// * Aquí gestiono la lógica de renderizado, eventos y consumo de API para la tabla de equipos.
// * Los TODO son recordatorios personales para refactorizar o mejorar la UX/UI.

// Importamos las funciones de la API que necesitamos.
import { getEquipos, deleteEquipo } from '../api.js';
// Importamos funciones genéricas para manipulación del DOM/UI.
// TODO: Crear dom.js si decides centralizar (por ahora, usamos IDs directos y console.log).
// import { showLoading, showError, clearContent } from '../dom.js';
// Importamos funciones para renderizar elementos UI.
// TODO: Crear render.js si decides centralizar (por ahora, la lógica de tabla está aquí).
// import { renderTable } from '../render.js';


// ===============================================================
// ELEMENTOS DEL DOM RELACIONADOS CON ESTA VISTA
// ===============================================================
const contentArea = document.getElementById('content-area'); // El contenedor principal.


// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// Función para mostrar un mensaje de carga específico para esta vista.
function showEquiposLoading() {
    contentArea.innerHTML = '<p>Cargando lista de equipos...</p>';
}

// Función para mostrar un mensaje de error específico para esta vista.
function showEquiposError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar equipos:</p><p class="text-red-500">${message}</p>`;
}

// Función para renderizar una lista de equipos en una tabla HTML en el contentArea.
// Esta lógica estaba antes en main.js.
function renderEquiposTable(equipos) {
    contentArea.innerHTML = ''; // Limpia el contenido anterior.

    if (!equipos || equipos.length === 0) {
        contentArea.innerHTML = '<p>No hay equipos registrados en el inventario.</p>';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden'); // Más estilos Tailwind

    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');

    // Define las columnas (Texto visible, Nombre de la propiedad en los datos)
    const headers = [
        { text: 'ID', prop: 'id' }, // Añadimos ID para referencia
        { text: 'Número Serie', prop: 'numero_serie' },
        { text: 'Nombre Equipo', prop: 'nombre_equipo' },
        { text: 'Tipo', prop: 'nombre_tipo_equipo' },
        { text: 'Ubicación Actual', prop: 'nombre_sucursal_actual' },
        { text: 'Estado', prop: 'status_nombre' },
        { text: 'Acciones', prop: null }
    ];

    headers.forEach(header => {
        const th = document.createElement('th');
         th.classList.add('py-3', 'px-6', 'text-left', 'border-b', 'border-gray-200');
         // Alinear texto en acciones a la derecha o centro si se prefiere
         if (!header.prop) th.classList.add('text-center'); // Ejemplo: alinear acciones al centro
        th.textContent = header.text;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.classList.add('text-gray-600', 'text-sm', 'font-light');

    equipos.forEach(equipo => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
         // Añadir data-id al tr para identificar la fila por ID de equipo (útil para eventos)
         row.dataset.id = equipo.id;

        headers.forEach(header => {
            const td = document.createElement('td');
             td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                // Formateo básico para fechas si la propiedad es una fecha
                if (header.prop.includes('fecha') && equipo[header.prop]) {
                     // Asumiendo que las fechas de la DB vienen como strings o Date objects.
                     // Si vienen como strings YYYY-MM-DDTHH:mm:ss.sssZ, puedes formatearlas.
                     // Para simplicidad, mostraremos tal cual por ahora o formatearemos básico.
                     // const date = new Date(equipo[header.prop]);
                     // td.textContent = date.toLocaleDateString(); // Ejemplo: 22/7/2024
                     td.textContent = equipo[header.prop].split('T')[0]; // Muestra solo YYYY-MM-DD si es un timestamp
                } else {
                     td.textContent = equipo[header.prop] || 'N/A'; // Muestra N/A si es null/vacio.
                }
                 // Añadir clases para columnas específicas si se desea (ej: text-center para ID)
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');

            } else {
                // Columna de Acciones
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center'); // Centrar botones

                // Botón Ver Detalles
                const viewButton = document.createElement('button');
                 viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110'); // Cambiado color a azul
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                // Listener: Llamaremos a una función para mostrar detalles (a implementar después).
                viewButton.addEventListener('click', () => {
                    console.log('Ver detalles de equipo con ID:', equipo.id);
                    // TODO: Implementar la carga y renderizado de la vista de detalles del equipo
                    // showEquipoDetails(equipo.id);
                });

                // Botón Editar
                 const editButton = document.createElement('button');
                 editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                 // Listener: Llamaremos a una función para mostrar el formulario de edición (a implementar después).
                editButton.addEventListener('click', () => {
                     console.log('Editar equipo con ID:', equipo.id);
                     // TODO: Implementar la carga y renderizado del formulario de edición del equipo
                     // showEquipoForm(equipo.id); // Pasar ID para editar, o null/undefined para crear
                 });


                // Botón Eliminar
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                // Listener: Manejamos la confirmación y la llamada a la API DELETE.
                deleteButton.addEventListener('click', async () => {
                    // TODO: Usar un modal de confirmación más elegante después.
                    if (confirm(`¿Estás seguro de eliminar el equipo con Número de Serie "${equipo.numero_serie}" (ID: ${equipo.id})?`)) {
                         console.log('Confirmada eliminación para equipo con ID:', equipo.id);
                        try {
                            // Llama a la función deleteEquipo de api.js
                            await deleteEquipo(equipo.id);
                            console.log('Equipo eliminado exitosamente:', equipo.id);
                            // Opcional: Muestra un mensaje de éxito flotante.
                            // window.showSuccessMessage('Equipo eliminado!');
                            // Después de eliminar, volvemos a cargar la lista para reflejar el cambio.
                            loadEquiposList(); // Llama a la función que carga la vista de lista.

                        } catch (error) {
                            // Maneja el error de la eliminación (ej. si tiene asignaciones activas).
                            console.error('Error al eliminar equipo:', error);
                             // Usa el mensaje del error (que ya viene formateado por api.js).
                            alert('Error al eliminar el equipo: ' + error.message);
                        }
                    }
                });

                // Añade los botones al contenedor de acciones.
                actionsContainer.appendChild(viewButton);
                actionsContainer.appendChild(editButton);
                actionsContainer.appendChild(deleteButton);
                td.appendChild(actionsContainer);
            }

            row.appendChild(td); // Añade la celda a la fila.
        });

        tbody.appendChild(row); // Añade la fila al cuerpo de la tabla.
    });

    table.appendChild(tbody); // Añade el cuerpo a la tabla.

    // Agrega la tabla al área de contenido principal.
    contentArea.appendChild(table);

    console.log('Tabla de equipos renderizada.');
}

// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA (Para ser llamada por main.js o navegación)
// Orquesta la obtención de datos y el renderizado para la lista de equipos.
// ===============================================================

async function loadEquiposList() {
     console.log('Cargando vista de lista de equipos...');
    showEquiposLoading(); // Muestra carga.
    try {
        // Llama a la función de la API para obtener los datos.
        const equipos = await getEquipos();
        // Si tiene éxito, renderiza la tabla.
        renderEquiposTable(equipos);
    } catch (error) {
        // Si hay un error, muestra el mensaje de error.
        showEquiposError(error.message);
    }
}


// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// Exportamos las funciones que otros módulos podrían necesitar llamar (ej. desde la navegación en main.js).
// ===============================================================
export { loadEquiposList };