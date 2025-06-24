//public/js/views/equiposView.js
// * Usando Grid.js y Delegación de Eventos para las acciones.
import { getEquipos, deleteEquipo } from '../api.js';
import { showConfirmationModal, showInfoModal } from '../ui/modal.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';

const contentArea = document.getElementById('content-area');
let equiposGridInstance = null;
let gridContainerGlobal = null; //* Para acceder al contenedor del grid desde el listener.

function renderEquiposListViewLayout() {
    contentArea.innerHTML = '';
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Equipos';
    contentArea.appendChild(title);

    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nuevo Equipo';
    createButton.dataset.view = 'equipoForm'; //* Para que el listener global de main.js lo maneje

    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    //* Responsive wrapper
    const responsiveDiv = document.createElement('div');
    responsiveDiv.className = 'overflow-x-auto w-full';
    const gridContainer = document.createElement('div');
    gridContainer.id = 'equipos-grid-container';
    responsiveDiv.appendChild(gridContainer);
    contentArea.appendChild(responsiveDiv);
    gridContainerGlobal = gridContainer;
    return gridContainer;
}

function showEquiposLoading(container) {
    const target = container || gridContainerGlobal || contentArea;
    showListLoading(target, 'Equipos');
}

function showEquiposError(message, container) {
    const target = container || gridContainerGlobal || contentArea;
    showListError(target, 'Equipos', message, 'equiposList', () => loadEquiposList());
}

// * Función para formatear la celda de acciones en Grid.js
// * Ahora añadimos atributos data-* para la delegación de eventos.
function formatActionsCell(cell, row) {
    const equipoId = row.cells[0].data; //! Asumimos que ID es la primera columna.
    const equipoNumeroSerie = row.cells[1].data; //! Asumimos que Número Serie es la segunda.

    //* Usamos template literals para construir el HTML de los botones con data-attributes.
    //* `gridjs.html()` es necesario para que Grid.js interprete esto como HTML.
    return gridjs.html(`
        <div class="flex items-center justify-center space-x-2">
            <button title="Ver Detalles del Equipo"
                    class="btn-action-view w-6 h-6 transform hover:text-blue-500 hover:scale-110"
                    data-action="view" data-id="${equipoId}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button title="Editar Equipo"
                    class="btn-action-edit w-6 h-6 transform hover:text-yellow-500 hover:scale-110"
                    data-action="edit" data-id="${equipoId}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button title="Eliminar Equipo"
                    class="btn-action-delete w-6 h-6 transform hover:text-red-500 hover:scale-110"
                    data-action="delete" data-id="${equipoId}" data-numero-serie="${equipoNumeroSerie}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>
            </button>
        </div>
    `);
}

// * Listener de eventos delegado para los botones de acción en la tabla.
// * Este listener se añade al contenedor del grid DESPUÉS de que Grid.js lo renderice.
function handleGridActions(event) {
    const button = event.target.closest('button[data-action]'); // Encuentra el botón más cercano con data-action.
    if (!button) return; // Si el clic no fue en un botón de acción, no hago nada.

    const action = button.dataset.action;
    const equipoId = button.dataset.id;
    // Necesito el número de serie para el mensaje de confirmación de eliminación.
    const equipoNumeroSerie = button.dataset.numeroSerie;


    console.log(`Acción detectada: ${action} para equipo ID: ${equipoId}`);

    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('equipoDetails', String(equipoId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('equipoForm', String(equipoId));
        }
    } else if (action === 'delete') {
        // Uso async aquí para el modal de confirmación.
        (async () => {
            const confirmed = await showConfirmationModal({
                title: 'Confirmar Eliminación',
                message: `¿Estás realmente seguro de que quieres eliminar el equipo con Número de Serie "${equipoNumeroSerie}" (ID: ${equipoId})? Esta acción no se puede deshacer.`,
                confirmButtonText: 'Sí, Eliminar'
            });
            if (confirmed) {
                try {
                    await deleteEquipo(equipoId);
                    await showInfoModal({ title: 'Éxito', message: 'Equipo eliminado correctamente.'});
                    // * Para refrescar Grid.js, la forma más simple si los datos son locales
                    // * es forzar una nueva carga de la vista de lista.
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('equiposList'); // Recarga la vista actual
                    }
                } catch (error) {
                    await showInfoModal({ title: 'Error', message: `Error al eliminar el equipo: ${error.message}`});
                }
            }
        })();
    }
}


async function loadEquiposList() {
    console.log('Cargando la vista de lista de equipos con Grid.js...');
    const gridContainer = renderEquiposListViewLayout();
    showEquiposLoading(gridContainer);

    try {
        const equipos = await getEquipos();
        gridContainer.innerHTML = '';

        if (!equipos || equipos.length === 0) {
            showEquiposError('No hay equipos registrados en el inventario.', gridContainer);
            return;
        }

        if (equiposGridInstance) {
            // * Si ya existe una instancia, la destruyo para evitar duplicados o errores.
            // * Opcionalmente, podría intentar actualizar los datos (`.updateConfig({data: ...}).forceRender()`)
            // * pero destruir y recrear es más simple para empezar.
            // equiposGridInstance.destroy(); // Grid.js no tiene un método destroy() simple.
            // Simplemente limpio el contenedor.
        }


        equiposGridInstance = new gridjs.Grid({
            columns: [
                { id: 'id', name: 'ID', width: '80px', sort: true },
                { id: 'numero_serie', name: 'Número Serie', sort: true },
                { id: 'nombre_equipo', name: 'Nombre Equipo', sort: true },
                { id: 'nombre_tipo_equipo', name: 'Tipo', sort: true },
                { id: 'nombre_sucursal_actual', name: 'Ubicación', sort: true },
                { id: 'nombre_empresa', name: 'Empresa' , sort: true },
                { id: 'status_nombre', name: 'Estado', sort: true },
                {
                    name: 'Acciones',
                    sort: false,
                    width: '120px',
                    formatter: formatActionsCell
                }
            ],
            data: equipos.map(eq => [
                eq.id,
                eq.numero_serie,
                eq.nombre_equipo || 'N/A',
                eq.nombre_tipo_equipo || 'N/A',
                eq.nombre_sucursal_actual || 'N/A',
                eq.nombre_empresa || 'N/A',
                eq.status_nombre || 'N/A',
                null
            ]),
            search: true,
            pagination: {
                enabled: true,
                limit: 10,
                summary: true
            },
            sort: true,
            style: { 
            },
            language: window.gridjs.l10n.esES
        }).render(gridContainer);

        // * AÑADO EL LISTENER DE EVENTOS DELEGADO AL CONTENEDOR DEL GRID DESPUÉS DE RENDERIZAR.
        // * Solo necesito añadirlo una vez si el `gridContainer` es persistente
        // * o re-añadirlo si `gridContainer` se recrea.
        // * Para asegurar, lo removemos y añadimos.
        gridContainer.removeEventListener('click', handleGridActions); // Quito listener previo si existe
        gridContainer.addEventListener('click', handleGridActions);   // Añado el nuevo listener

        console.log('Renderizando la tabla de equipos con Grid.js y delegación de eventos.');

    } catch (error) {
        console.error('Error al cargar o renderizar equipos con Grid.js:', error);
        showEquiposError(error.message, gridContainer);
    }
}

export { loadEquiposList };
