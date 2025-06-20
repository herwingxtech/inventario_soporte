// public/js/views/empleadosView.js
// * Este módulo se encarga de toda la lógica para la vista de listado de Empleados,
// * utilizando Grid.js para la tabla y delegación de eventos para las acciones.

//? ¿Qué funciones de API necesito? 'getEmpleados', 'deleteEmpleado'.
import { getEmpleados, deleteEmpleado } from '../api.js';
// * Importo mis funciones de modales personalizadas.
import { showConfirmationModal, showInfoModal } from '../ui/modal.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';

// * Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');
let empleadosGridInstance = null; // * Para la instancia del Grid de empleados.
let gridContainerGlobal = null; // * Contenedor del grid para el listener.

// * Renderiza el marco/layout de la vista de lista (título y botón "Nuevo").
function renderEmpleadosListViewLayout() {
    contentArea.innerHTML = '';
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Empleados';
    contentArea.appendChild(title);

    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nuevo Empleado';
    createButton.dataset.view = 'empleadoForm'; // * Para que main.js lo maneje.
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    const gridContainer = document.createElement('div');
    gridContainer.id = 'empleados-grid-container';
    contentArea.appendChild(gridContainer);
    gridContainerGlobal = gridContainer;
    return gridContainer;
}

// * Muestra mensaje de carga.
function showEmpleadosLoading(container) {
    const target = container || gridContainerGlobal || contentArea;
    showListLoading(target, 'Empleados');
}

// * Muestra mensaje de error.
function showEmpleadosError(message, container) {
    const target = container || gridContainerGlobal || contentArea;
    showListError(target, 'Empleados', message, 'empleadosList', () => loadEmpleadosList());
}

// * Formatea la celda de acciones para la tabla de empleados.
function formatEmpleadosActionsCell(cell, row) {
    const empleadoId = row.cells[0].data; // Asumo ID es la primera columna.
    const empleadoNombreCompleto = `${row.cells[2].data || ''} ${row.cells[3].data || ''}`.trim(); // Asumo nombres y apellidos

    return gridjs.html(`
        <div class="flex items-center justify-center space-x-2">
            <button title="Ver Detalles del Empleado"
                    class="btn-action-view w-6 h-6 transform hover:text-blue-500 hover:scale-110"
                    data-action="view" data-id="${empleadoId}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057 2.458 12z"></path></svg>
            </button>
            <button title="Editar Empleado"
                    class="btn-action-edit w-6 h-6 transform hover:text-yellow-500 hover:scale-110"
                    data-action="edit" data-id="${empleadoId}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button title="Eliminar Empleado"
                    class="btn-action-delete w-6 h-6 transform hover:text-red-500 hover:scale-110"
                    data-action="delete" data-id="${empleadoId}" data-nombre="${empleadoNombreCompleto}">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>
            </button>
        </div>
    `);
}

// * Listener delegado para acciones en el grid de empleados.
function handleEmpleadosGridActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const empleadoId = button.dataset.id;
    const empleadoNombre = button.dataset.nombre; // Para el mensaje de confirmación

    console.log(`Herwing - Acción detectada: ${action} para empleado ID: ${empleadoId}`);

    if (action === 'view') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleadoDetails', String(empleadoId));
        }
    } else if (action === 'edit') {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleadoForm', String(empleadoId));
        }
    } else if (action === 'delete') {
        (async () => {
            const confirmed = await showConfirmationModal({
                title: 'Confirmar Eliminación',
                message: `¿Estás seguro de eliminar al empleado "${empleadoNombre}" (ID: ${empleadoId})?`,
                confirmButtonText: 'Sí, Eliminar'
            });
            if (confirmed) {
                try {
                    await deleteEmpleado(empleadoId);
                    await showInfoModal({ title: 'Éxito', message: 'Empleado eliminado correctamente.'});
                    if (typeof window.navigateTo === 'function') { // O loadEmpleadosList() si es global.
                        window.navigateTo('empleadosList');
                    }
                } catch (error) {
                    await showInfoModal({ title: 'Error', message: `Error al eliminar el empleado: ${error.message}`});
                }
            }
        })();
    }
}

// * Función principal para cargar y renderizar la lista de empleados.
async function loadEmpleadosList() {
    console.log('Herwing está cargando la vista de lista de empleados con Grid.js...');
    const gridContainer = renderEmpleadosListViewLayout();
    showEmpleadosLoading(gridContainer);

    try {
        const empleados = await getEmpleados();
        gridContainer.innerHTML = ''; // Limpio carga

        if (!empleados || empleados.length === 0) {
            showEmpleadosError('No hay empleados registrados.', gridContainer);
            return;
        }

        empleadosGridInstance = new gridjs.Grid({
            columns: [
                { id: 'id', name: 'ID', width: '80px', sort: true },
                { id: 'numero_empleado', name: 'No. Empl.', sort: true, width: '120px' },
                { id: 'nombres', name: 'Nombres', sort: true },
                { id: 'apellidos', name: 'Apellidos', sort: true },
                { id: 'nombre_empresa', name: 'Empresa', sort: true },
                { id: 'nombre_area', name: 'Área', sort: true },
                { id: 'puesto', name: 'Puesto', sort: true },
                { id: 'status_nombre', name: 'Estado', sort: true },
                {
                    name: 'Acciones',
                    sort: false,
                    width: '120px',
                    formatter: formatEmpleadosActionsCell
                }
            ],
            data: empleados.map(emp => [
                emp.id,
                emp.numero_empleado || 'N/A',
                emp.nombres,
                emp.apellidos,
                emp.puesto || 'N/A',
                emp.nombre_empresa || 'N/A',
                emp.nombre_area || 'N/A',
                emp.status_nombre || 'N/A',
                null // Para la celda de acciones
            ]),
            search: true,
            pagination: { enabled: true, limit: 10, summary: true },
            sort: true,
            style: { /* ... (tus estilos de Tailwind para Grid.js, igual que en equiposView) ... */
                table: 'min-w-full bg-white border-gray-200 shadow-md rounded-lg',
                thead: 'bg-gray-200',
                th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200',
                tbody: 'text-gray-600 text-sm font-light',
                tr: 'border-b border-gray-200 hover:bg-gray-100',
                td: 'px-6 py-4 whitespace-nowrap',
                footer: 'p-4 bg-gray-50 border-t border-gray-200',
                search: 'p-2 mb-4 border border-gray-300 rounded-md w-full sm:w-auto',
                paginationButton: 'mx-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100',
                paginationButtonCurrent: 'bg-blue-500 text-white border-blue-500',
                paginationSummary: 'text-sm text-gray-700'
            },
            language: window.gridjs.l10n.esES // Asumo que el CDN de Grid.js carga l10n
        }).render(gridContainer);

        gridContainer.removeEventListener('click', handleEmpleadosGridActions);
        gridContainer.addEventListener('click', handleEmpleadosGridActions);

        console.log('Herwing renderizó la tabla de empleados con Grid.js.');

    } catch (error) {
        console.error('Error al cargar o renderizar empleados con Grid.js:', error);
        showEmpleadosError(error.message, gridContainer);
    }
}

// * Exporto la función principal.
export { loadEmpleadosList };