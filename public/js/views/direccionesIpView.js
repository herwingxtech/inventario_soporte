// public/js/views/direccionesIpView.js
// Lógica específica para la vista de listado de Direcciones IP.

// Importamos las funciones de la API que necesitamos.
import { getDireccionesIp, deleteDireccionIp } from '../api.js'; // Asegúrate que getDireccionesIp y deleteDireccionIp existan en api.js

// ===============================================================
// ELEMENTOS DEL DOM RELACIONADOS CON ESTA VISTA
// ===============================================================
const contentArea = document.getElementById('content-area'); // El contenedor principal.

// ===============================================================
// FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA
// ===============================================================

// Función para mostrar un mensaje de carga específico para esta vista.
function showDireccionesIpLoading() {
    contentArea.innerHTML = '<p>Cargando lista de Direcciones IP...</p>';
}

// Función para mostrar un mensaje de error específico para esta vista.
function showDireccionesIpError(message) {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al cargar Direcciones IP:</p><p class="text-red-500">${message}</p>`;
}

// Función para renderizar una lista de direcciones IP en una tabla HTML en el contentArea.
function renderDireccionesIpTable(direccionesIp) {
    contentArea.innerHTML = ''; // Limpia el contenido anterior.

    if (!direccionesIp || direccionesIp.length === 0) {
        contentArea.innerHTML = '<p>No hay direcciones IP registradas en el sistema.</p>';
        return;
    }

    // Crear el título de la vista
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Direcciones IP';
    contentArea.appendChild(title);

    // Botón para "Crear Nueva Dirección IP" (a implementar)
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4', 'text-right');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded'); // Color diferente para distinguir
    createButton.textContent = 'Nueva Dirección IP';
    createButton.addEventListener('click', () => {
        console.log('Mostrar formulario para crear nueva dirección IP');
        // TODO: Llamar a una función para mostrar el formulario de creación
        // navigateTo('direccionIpForm');
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
    // Asegúrate que 'prop' coincida con los nombres de las propiedades que devuelve tu API /api/direcciones-ip
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'Dirección IP', prop: 'direccion_ip' },
        { text: 'Sucursal Asociada', prop: 'nombre_sucursal' }, // De la FK (puede ser N/A)
        { text: 'Comentario', prop: 'comentario' },
        { text: 'Estado', prop: 'status_nombre' }, // De la FK
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

    direccionesIp.forEach(ip => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = ip.id; // Guardar el ID en la fila

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                td.textContent = ip[header.prop] || 'N/A'; // Muestra N/A si es null/vacio.
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else {
                // Columna de Acciones
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                // Botón Ver Detalles (menos relevante para IPs, pero por consistencia)
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                    console.log('Ver detalles de Dirección IP con ID:', ip.id);
                    // TODO: Implementar navigateTo('direccionIpDetails', { id: ip.id });
                });

                // Botón Editar
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.addEventListener('click', () => {
                    console.log('Editar Dirección IP con ID:', ip.id);
                    // TODO: Implementar navigateTo('direccionIpForm', { id: ip.id });
                });

                // Botón Eliminar
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    if (confirm(`¿Estás seguro de eliminar la Dirección IP "${ip.direccion_ip}" (ID: ${ip.id})?`)) {
                        console.log('Confirmada eliminación para Dirección IP con ID:', ip.id);
                        try {
                            await deleteDireccionIp(ip.id); // Usa la función de api.js
                            console.log('Dirección IP eliminada exitosamente:', ip.id);
                            // Recargar la lista de Direcciones IP.
                            loadDireccionesIpList();
                        } catch (error) {
                            console.error('Error al eliminar Dirección IP:', error);
                            alert('Error al eliminar la Dirección IP: ' + error.message);
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

    console.log('Tabla de Direcciones IP renderizada.');
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
// Orquesta la obtención de datos y el renderizado para la lista de Direcciones IP.
// ===============================================================
async function loadDireccionesIpList() {
    console.log('Cargando vista de lista de Direcciones IP...');
    showDireccionesIpLoading(); // Muestra carga.
    try {
        const direccionesIp = await getDireccionesIp(); // Llama a la función de la API.
        renderDireccionesIpTable(direccionesIp); // Renderiza la tabla.
    } catch (error) {
        showDireccionesIpError(error.message); // Muestra error si falla la carga.
    }
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { loadDireccionesIpList };