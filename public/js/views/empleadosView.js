// public/js/views/empleadosView.js
// Lógica específica para la vista de listado de Empleados.

// Importamos las funciones de la API que necesitamos.
import { getEmpleados, deleteEmpleado } from '../api.js'; // Asumimos que ya tenemos getEmpleados y deleteEmpleado en api.js

// ===============================================================
// ELEMENTOS DEL DOM RELACIONADOS CON ESTA VISTA
// ===============================================================
const contentArea = document.getElementById('content-area'); // El contenedor principal.

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// Función para mostrar un mensaje de carga específico para esta vista.
function showEmpleadosLoading() {
    contentArea.innerHTML = '<p>Cargando lista de empleados...</p>';
}

// Función para mostrar un mensaje de error específico para esta vista.
function showEmpleadosError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar empleados:</p><p class="text-red-500">${message}</p>`;
}

// Función para renderizar una lista de empleados en una tabla HTML en el contentArea.
function renderEmpleadosTable(empleados) {
    contentArea.innerHTML = ''; // Limpia el contenido anterior.

    if (!empleados || empleados.length === 0) {
        contentArea.innerHTML = '<p>No hay empleados registrados en el sistema.</p>';
        return;
    }

    // Crear el título de la vista
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Empleados';
    contentArea.appendChild(title);


    // Botón para "Crear Nuevo Empleado" (a implementar)
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right'); // Alinear a la derecha
    const createButton = document.createElement('button');
    createButton.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    createButton.textContent = 'Nuevo Empleado';
    createButton.addEventListener('click', () => {
        console.log('Mostrar formulario para crear nuevo empleado');
        // TODO: Llamar a una función para mostrar el formulario de creación
        // showEmpleadoForm(); // O navigateTo('empleadoForm');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);


    // Crear la tabla
    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');

    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');

    // Define las columnas de la cabecera (Texto visible, Nombre de la propiedad en los datos)
    // Asegúrate que 'prop' coincida con los nombres de las propiedades que devuelve tu API /api/empleados
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'No. Empleado', prop: 'numero_empleado' },
        { text: 'Nombre Completo', prop: null }, // Combinaremos nombres y apellidos
        { text: 'Email Personal', prop: 'email_personal' },
        { text: 'Puesto', prop: 'puesto' },
        { text: 'Sucursal', prop: 'nombre_sucursal' }, // De la FK
        { text: 'Área', prop: 'nombre_area' },       // De la FK
        { text: 'Estado', prop: 'status_nombre' },   // De la FK
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

    empleados.forEach(empleado => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = empleado.id; // Guardar el ID en la fila

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                 // Formateo para fechas (si tuvieras fecha_ingreso en la tabla)
                // if (header.prop.includes('fecha_ingreso') && empleado[header.prop]) {
                //    td.textContent = new Date(empleado[header.prop]).toLocaleDateString();
                // } else {
                td.textContent = empleado[header.prop] || 'N/A';
                // }
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else if (header.text === 'Nombre Completo') {
                // Combinar nombres y apellidos
                td.textContent = `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim() || 'N/A';
            } else {
                // Columna de Acciones
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // Botón Ver Detalles
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                    console.log('Ver detalles de empleado con ID:', empleado.id);
                    // TODO: Implementar navigateTo('empleadoDetails', { id: empleado.id });
                });

                // Botón Editar
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.addEventListener('click', () => {
                    console.log('Editar empleado con ID:', empleado.id);
                    // TODO: Implementar navigateTo('empleadoForm', { id: empleado.id });
                });

                // Botón Eliminar
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    if (confirm(`¿Estás seguro de eliminar al empleado "${empleado.nombres} ${empleado.apellidos}" (ID: ${empleado.id})?`)) {
                        console.log('Confirmada eliminación para empleado con ID:', empleado.id);
                        try {
                            await deleteEmpleado(empleado.id); // Usa la función de api.js
                            console.log('Empleado eliminado exitosamente:', empleado.id);
                            // Recargar la lista de empleados.
                            loadEmpleadosList();
                        } catch (error) {
                            console.error('Error al eliminar empleado:', error);
                            alert('Error al eliminar el empleado: ' + error.message);
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
    contentArea.appendChild(table); // Agrega la tabla al área de contenido.

    console.log('Tabla de empleados renderizada.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA (Para ser llamada por main.js o navegación)
// Orquesta la obtención de datos y el renderizado para la lista de empleados.
// ===============================================================
async function loadEmpleadosList() {
    console.log('Cargando vista de lista de empleados...');
    showEmpleadosLoading(); // Muestra carga.
    try {
        const empleados = await getEmpleados(); // Llama a la función de la API.
        renderEmpleadosTable(empleados); // Renderiza la tabla.
    } catch (error) {
        showEmpleadosError(error.message); // Muestra error si falla la carga.
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { loadEmpleadosList };