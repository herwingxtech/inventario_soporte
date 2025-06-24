//public/js/views/cuentasEmailView.js
//* Este módulo se encarga de toda la lógica para la vista de listado
//* de Cuentas de Email Corporativo.

//? Necesito importar más funciones de api.js a medida que añado funcionalidades (ej. delete).
import { getCuentasEmail, deleteCuentaEmail } from '../api.js';
import { showListLoading } from '../utils/loading.js';
import { showListError } from '../utils/error.js';

//* Referencia al contenedor principal donde se renderizará esta vista.
const contentArea = document.getElementById('content-area');

//* FUNCIONES DE RENDERIZADO ESPECÍFICAS DE ESTA VISTA

//* Muestra un mensaje de carga mientras se obtienen los datos de las cuentas de email.
function showCuentasEmailLoading() {
    //* Limpio el área y muestro el mensaje.
    showListLoading(contentArea, 'Cuentas de Email');
}

//* Muestra un mensaje de error si falla la carga de datos de las cuentas de email.
function showCuentasEmailError(message) {
    //* Limpio el área y muestro el error con un estilo distintivo.
    showListError(contentArea, 'Cuentas de Email', message, 'cuentasEmailList', () => loadCuentasEmailList());
}

//* Renderiza la tabla de cuentas de email con los datos obtenidos.
function renderCuentasEmailTable(cuentasEmail) {
    contentArea.innerHTML = ''; //* Limpio cualquier contenido previo.

    if (!cuentasEmail || cuentasEmail.length === 0) {
        contentArea.innerHTML = '<p>No hay cuentas de email corporativo registradas.</p>';
        return; //* No hay nada más que hacer si no hay datos.
    }

    //* Creo el título para esta vista.
    const title = document.createElement('h2');
    title.classList.add('text-2xl', 'font-bold', 'text-gray-800', 'mb-6');
    title.textContent = 'Lista de Cuentas de Email Corporativo';
    contentArea.appendChild(title);

    //* Botón para "Crear Nueva Cuenta de Email".
    const createButtonContainer = document.createElement('div');
    createButtonContainer.classList.add('mb-4');
    const createButton = document.createElement('button');
    createButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded'); //* Usando un color índigo.
    createButton.textContent = 'Nueva Cuenta de Email';
    createButton.addEventListener('click', () => {
        //TODO: Implementar la navegación al formulario de creación de cuentas de email.
        //* Ejemplo: navigateTo('cuentaEmailForm');
        console.log('Mostrar el formulario para crear una nueva cuenta de email.');
    });
    createButtonContainer.appendChild(createButton);
    contentArea.appendChild(createButtonContainer);

    //* Creación de la tabla y sus elementos.
    const table = document.createElement('table');
    table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200', 'shadow-md', 'rounded-lg', 'overflow-hidden');

    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
    const headerRow = document.createElement('tr');

    //* Defino las columnas que tendrá la tabla.
    //* 'prop' debe coincidir con el nombre de la propiedad en los objetos de datos.
    const headers = [
        { text: 'ID', prop: 'id' },
        { text: 'Email', prop: 'email' },
        { text: 'Usuario Email', prop: 'usuario_email' },
        { text: 'Contraseña Email', prop: 'password_data' },
        { text: 'Empleado Asignado', prop: null }, //* Combinaré nombre y apellido del empleado.
        { text: 'Estado', prop: 'status_nombre' },
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

    cuentasEmail.forEach(cuenta => {
        const row = document.createElement('tr');
        row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');
        row.dataset.id = cuenta.id; //* Guardo el ID en el atributo data-id de la fila.

        headers.forEach(header => {
            const td = document.createElement('td');
            td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

            if (header.prop) {
                if (header.prop === 'ssl_tls') {
                    //* Muestro 'Sí' o 'No' para el campo booleano ssl_tls.
                    td.textContent = cuenta[header.prop] ? 'Sí' : 'No';
                } else {
                    td.textContent = cuenta[header.prop] || 'N/A'; //* Muestro N/A si el valor es nulo o vacío.
                }
                if (header.prop === 'id') td.classList.add('font-semibold', 'text-gray-800', 'text-center');
            } else if (header.text === 'Empleado Asignado') {
                //* Combino nombre y apellido del empleado si existen.
                const nombreCompleto = (cuenta.nombre_empleado && cuenta.apellido_empleado)
                    ? `${cuenta.nombre_empleado} ${cuenta.apellido_empleado}`
                    : (cuenta.nombre_empleado || cuenta.apellido_empleado || 'N/A'); //* Muestra lo que haya o N/A.
                td.textContent = nombreCompleto;
            } else {
                //* Columna de Acciones.
                const actionsContainer = document.createElement('div');
                actionsContainer.classList.add('flex', 'item-center', 'justify-center');

                //* Botón Ver Detalles (si decido implementar una vista de detalle).
                const viewButton = document.createElement('button');
                viewButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-blue-500', 'hover:scale-110');
                viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
                viewButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación a la vista de detalles de la cuenta de email.
                    //* Ejemplo: navigateTo('cuentaEmailDetails', { id: cuenta.id });
                    console.log('Herwing quiere ver los detalles de la cuenta de email con ID:', cuenta.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('cuentaEmailDetails', String(cuenta.id));
                    }
                });

                //* Botón Editar.
                const editButton = document.createElement('button');
                editButton.classList.add('w-6', 'h-6', 'mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
                editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
                editButton.addEventListener('click', () => {
                    //TODO: Implementar la navegación al formulario de edición de la cuenta de email.
                    //* Ejemplo: navigateTo('cuentaEmailForm', { id: cuenta.id });
                    console.log('Herwing quiere editar la cuenta de email con ID:', cuenta.id);
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('cuentaEmailForm', String(cuenta.id));
                    }
                });

                //* Botón Eliminar.
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('w-6', 'h-6', 'transform', 'hover:text-red-500', 'hover:scale-110');
                deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
                deleteButton.addEventListener('click', async () => {
                    //TODO: Implementar un modal de confirmación más elegante.
                    if (confirm(`¿Estás seguro de eliminar la cuenta de email "${cuenta.email}" (ID: ${cuenta.id})?`)) {
                        console.log('Confirmada eliminación para cuenta de email con ID:', cuenta.id);
                        try {
                            await deleteCuentaEmail(cuenta.id); //* Uso la función de api.js
                            console.log('Cuenta de email eliminada exitosamente:', cuenta.id);
                            loadCuentasEmailList(); //* Recargo la lista para reflejar el cambio.
                        } catch (error) {
                            console.error('Error al eliminar cuenta de email:', error);
                            alert('Error al eliminar la cuenta de email: ' + error.message);
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
    contentArea.appendChild(table); //* Agrego la tabla completa al área de contenido.

    console.log('Tabla de Cuentas de Email renderizada.');
}


//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
//* Esta es la función que será llamada desde main.js para mostrar esta vista.
async function loadCuentasEmailList() {
    console.log('Cargando vista de lista de Cuentas de Email...');
    showCuentasEmailLoading(); //* Muestro el mensaje de carga.
    try {
        const cuentasEmail = await getCuentasEmail(); //* Llamo a la API.
        renderCuentasEmailTable(cuentasEmail); //* Renderizo la tabla con los datos.
    } catch (error) {
        showCuentasEmailError(error.message); //* Muestro un error si algo falla.
    }
}

export { loadCuentasEmailList };