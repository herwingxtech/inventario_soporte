//public/js/views/notasList.js
// * Este módulo se encarga de toda la lógica para la vista de listado
// * de los registros de Notas.

//? ¿Necesitaré importar 'deleteNota' aquí? ¿O mejor en una vista de detalle/modal?
import { getNotas, deleteNota } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// * Muestra un mensaje de carga mientras se obtienen los datos de las notas.
function showNotasListLoading() {
    showListLoading(contentArea, 'Notas');
}

// * Muestra un mensaje de error si falla la carga de datos de las notas.
function showNotasListError(message) {
    showListError(contentArea, 'Notas', message, 'notasList', () => loadNotasList());
}

// * Renderiza la tabla de notas con los datos obtenidos.
function renderNotasListTable(notas) {
    contentArea.innerHTML = ''; // Limpio cualquier contenido previo.

    if (!notas || notas.length === 0) {
        contentArea.innerHTML = '<p>No hay notas registradas en el sistema.</p>';
        return; // No hay nada más que hacer si no hay datos.
    }

    // * Creo el título para esta vista.
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Notas';
    contentArea.appendChild(title);

    // * Botón para "Crear Nueva Nota".
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    // Usando un color cian para este botón.
    createButton.classList.add('bg-cyan-500', 'hover:bg-cyan-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nueva Nota';
    createButton.addEventListener('click', () => {
        //TODO: Implementar la navegación al formulario de creación de notas.
        // Ejemplo: navigateTo('notaForm');
        console.log('Herwing quiere mostrar el formulario para crear una nueva nota.');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    // * Creación de la tabla y sus elementos.
    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');

    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');

    // * Defino las columnas que tendrá la tabla.
    // * 'prop' debe coincidir con el nombre de la propiedad en los objetos de datos de la API.
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'Título', prop: 'titulo' },
        { text: 'Contenido (extracto)', prop: 'contenido' },
        { text: 'Asociado a', prop: null }, // Combinaremos a qué está asociada
        { text: 'Creado por', prop: 'id_usuario_sistema' }, // Del JOIN
        { text: 'Fecha Creación', prop: 'fecha_creacion' },
        { text: 'Acciones', prop: null }
    ];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.classList.add('py-3', 'px-6', 'text-left', 'border-b', 'border-gray-200');
        if (!header.prop && header.text === 'Acciones') th.classList.add('text-center');
        th.textContent = header.text;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.classList.add('text-gray-600', 'text-sm', 'font-light');

    notas.forEach(nota => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = nota.id; // Guardo el ID en el atributo data-id de la fila.

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                if (header.prop === 'contenido') {
                    // Muestro un extracto del contenido.
                    const extracto = nota.contenido || '';
                    td.textContent = extracto.substring(0, 50) + (extracto.length > 50 ? '...' : '');
                } else if (header.prop === 'fecha_creacion' && nota[header.prop]) {
                    // Formateo básico para la fecha de creación.
                    td.textContent = new Date(nota[header.prop]).toLocaleString(); // Muestra fecha y hora local.
                } else {
                    td.textContent = nota[header.prop] || 'N/A'; // Muestro N/A si el valor es nulo o vacío.
                }
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');

            } else if (header.text === 'Asociado a') {
                // * Muestro a qué está asociada la nota.
                let asociadoA = [];
                if (nota.id_equipo) asociadoA.push(`Equipo #${nota.id_equipo} (${nota.equipo_numero_serie || 'N/A'})`);
                if (nota.id_mantenimiento) asociadoA.push(`Mantenimiento #${nota.id_mantenimiento}`);
                if (nota.id_cuenta_email) asociadoA.push(`Email: ${nota.cuenta_email_email || 'N/A'}`);
                td.textContent = asociadoA.length > 0 ? asociadoA.join(', ') : 'N/A';
                 td.classList.remove('whitespace-nowrap'); // Permitir que este campo se ajuste si es largo
                 td.classList.add('whitespace-normal');
            } else {
                // * Columna de Acciones.
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // * Botón Ver Detalles.
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación a la vista de detalles de la nota.
                    // Ejemplo: navigateTo('notaDetails', { id: nota.id });
                    console.log('Herwing quiere ver los detalles de la nota con ID:', nota.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('notaDetails', String(nota.id));
                    }
                });

                // * Botón Editar.
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación al formulario de edición de la nota.
                    // Ejemplo: navigateTo('notaForm', { id: nota.id });
                    console.log('Herwing quiere editar la nota con ID:', nota.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('notaForm', String(nota.id));
                    }
                });

                // * Botón Eliminar.
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    //TODO: Implementar un modal de confirmación más elegante.
                    if (confirm(`¿Estás seguro de eliminar la nota con ID ${nota.id} (Título: "${nota.titulo || 'Sin Título'}")?`)) {
                        console.log('Confirmada eliminación para nota con ID:', nota.id);
                        try {
                            await deleteNota(nota.id); // Uso la función de api.js
                            console.log('Nota eliminada exitosamente:', nota.id);
                            loadNotasList(); // Recargo la lista para reflejar el cambio.
                        } catch (error) {
                            console.error('Error al eliminar nota:', error);
                            alert('Error al eliminar la nota: ' + error.message);
                        }
                    }
                });

                actionsContainer.appendChild(viewButton);
                actionsContainer.appendChild(editButton);
                actionsContainer.appendChild(deleteButton);
                td.appendChild(actionsContainer);
            }

            row.appendChild(td);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    contentArea.appendChild(table); // Agrego la tabla completa al área de contenido.

    console.log('Tabla de Notas renderizada.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
// Esta es la función que será llamada desde main.js para mostrar esta vista.
// ===============================================================
async function loadNotasList() {
    console.log('Cargando vista de lista de Notas...');
    showNotasListLoading(); // Muestro el mensaje de carga.
    try {
        const notas = await getNotas(); // Llamo a la API.
        renderNotasListTable(notas); // Renderizo la tabla con los datos.
    } catch (error) {
        showNotasListError(error.message); // Muestro un error si algo falla.
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// Exporto la función principal para que main.js pueda usarla.
// ===============================================================
export { loadNotasList };