// public/js/main.js
// Este es el archivo JavaScript principal de tu frontend.
// Contiene la lógica para interactuar con la API del backend
// y manipular el DOM para mostrar los datos del inventario.

console.log('Frontend JavaScript cargado correctamente.');

// URL base de tu API backend
const API_URL = 'http://localhost:3000/api'; // Asegúrate de que coincida con el puerto de tu server.js

// ===============================================================
// FUNCIONES PARA INTERACTUAR CON LA API
// Usamos la API Fetch para hacer peticiones HTTP al backend.
// ===============================================================

// Función asíncrona para obtener todos los equipos desde el backend.
// Retorna un array de objetos equipo o lanza un error.
async function getEquipos() {
  console.log('Intentando obtener equipos de la API...');
  try {
    // Realiza una petición GET a la ruta /api/equipos
    const response = await fetch(`${API_URL}/equipos`);

    // Verifica si la respuesta HTTP fue exitosa (código 2xx)
    if (!response.ok) {
      // Si la respuesta no es OK, lanza un error con el status y mensaje.
      // Intentamos leer el body como JSON para obtener el mensaje de error del backend
      const errorData = await response.json();
      throw new Error(`Error al obtener equipos: ${response.status} ${response.statusText} - ${errorData.message}`);
    }

    // Parsea el cuerpo de la respuesta como JSON y retorna los datos.
    const data = await response.json();
    console.log('Equipos recibidos:', data);
    return data;

  } catch (error) {
    // Captura cualquier error durante la petición (problemas de red, errores lanzados arriba)
    console.error('Error al obtener equipos:', error);
    // Propaga el error para que la función que llamó a getEquipos pueda manejarlo
    throw error;
  }
}

// Puedes añadir funciones similares para otras entidades:
/*
async function getEmpleados() {
    const response = await fetch(`${API_URL}/empleados`);
    if (!response.ok) throw new Error('Error al obtener empleados');
    return await response.json();
}
// ... etc.
*/


// ===============================================================
// FUNCIONES PARA MANIPULAR EL DOM (RENDERIZAR)
// Estas funciones toman datos y generan/actualizan el HTML.
// ===============================================================

// Obtiene el área de contenido principal donde mostraremos las vistas.
const contentArea = document.getElementById('content-area');

// Función para mostrar un mensaje de carga mientras se obtienen los datos.
function showLoading() {
  contentArea.innerHTML = '<p>Cargando datos...</p>';
}

// Función para mostrar un mensaje de error en el área de contenido.
function showError(message) {
  contentArea.innerHTML = `<p class="text-red-500">Error: ${message}</p>`;
}

// Función para renderizar una lista de equipos en una tabla HTML.
// Recibe un array de objetos equipo.
function renderEquiposTable(equipos) {
  // Limpia el contenido anterior del área.
  contentArea.innerHTML = '';

  // Verifica si hay equipos para mostrar.
  if (!equipos || equipos.length === 0) {
    contentArea.innerHTML = '<p>No hay equipos registrados.</p>';
    return;
  }

  // Crea los elementos de la tabla usando el DOM API.
  const table = document.createElement('table');
  // Añade clases de Tailwind para estilizar la tabla.
  table.classList.add('min-w-full', 'bg-white', 'border', 'border-gray-200');

  // Crea la cabecera de la tabla (<thead>).
  const thead = document.createElement('thead');
  thead.classList.add('bg-gray-200', 'text-gray-600', 'uppercase', 'text-sm', 'leading-normal');
  const headerRow = document.createElement('tr');

  // Define las columnas de la cabecera (Texto visible, Nombre de la propiedad en los datos)
  const headers = [
    { text: 'Número Serie', prop: 'numero_serie' },
    { text: 'Nombre Equipo', prop: 'nombre_equipo' },
    { text: 'Tipo', prop: 'nombre_tipo_equipo' }, // Usamos el nombre_tipo_equipo del JOIN
    { text: 'Ubicación Actual', prop: 'nombre_sucursal_actual' }, // Usamos el nombre_sucursal_actual del JOIN
    { text: 'Estado', prop: 'status_nombre' }, // Usamos el status_nombre del JOIN
    { text: 'Acciones', prop: null } // Columna para botones de acción
  ];

  // Crea las celdas de la cabecera (<th>).
  headers.forEach(header => {
    const th = document.createElement('th');
    th.classList.add('py-3', 'px-6', 'text-left', 'border-b', 'border-gray-200');
    th.textContent = header.text;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Crea el cuerpo de la tabla (<tbody>).
  const tbody = document.createElement('tbody');
  tbody.classList.add('text-gray-600', 'text-sm', 'font-light');

  // Itera sobre cada objeto equipo en el array recibido.
  equipos.forEach(equipo => {
    const row = document.createElement('tr');
    row.classList.add('border-b', 'border-gray-200', 'hover:bg-gray-100');

    // Crea las celdas de datos (<td>) para cada propiedad definida en los headers.
    headers.forEach(header => {
      const td = document.createElement('td');
      td.classList.add('py-3', 'px-6', 'text-left', 'whitespace-nowrap');

      if (header.prop) {
        // Muestra el valor de la propiedad del objeto equipo.
        // Usamos || 'N/A' para mostrar "N/A" si el valor es null, undefined o vacío.
        td.textContent = equipo[header.prop] || 'N/A';
      } else {
        // Es la columna de Acciones. Creamos botones.
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('flex', 'item-center', 'justify-start'); // Alinear botones

        // Botón Ver Detalles (ejemplo)
        const viewButton = document.createElement('button');
        viewButton.classList.add('mr-2', 'transform', 'hover:text-purple-500', 'hover:scale-110');
        viewButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
        // Añadir un listener (implementaremos la navegación/modal después)
        viewButton.addEventListener('click', () => {
          console.log('Ver detalles de equipo con ID:', equipo.id);
          // TODO: Implementar mostrar detalles del equipo
        });

        // Botón Editar (ejemplo)
        const editButton = document.createElement('button');
        editButton.classList.add('mr-2', 'transform', 'hover:text-yellow-500', 'hover:scale-110');
        editButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
        // Añadir un listener (implementaremos formularios de edición después)
        editButton.addEventListener('click', () => {
          console.log('Editar equipo con ID:', equipo.id);
          // TODO: Implementar formulario de edición
        });


        // Botón Eliminar (ejemplo)
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('transform', 'hover:text-red-500', 'hover:scale-110');
        deleteButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m14 0H5m2 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path></svg>';
        // Añadir un listener (implementaremos la confirmación y eliminación después)
        deleteButton.addEventListener('click', async () => {
          // TODO: Implementar modal de confirmación
          if (confirm(`¿Estás seguro de eliminar el equipo con ID ${equipo.id}?`)) {
            console.log('Eliminando equipo con ID:', equipo.id);
            // TODO: Implementar llamada DELETE a la API
            // TODO: Implementar llamada DELETE a la API
             try {
                 const response = await fetch(`${API_URL}/equipos/${equipo.id}`, {
                     method: 'DELETE'
                 });
                 if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'Error al eliminar');
                 }
                 console.log('Equipo eliminado:', equipo.id);
                 // Volver a cargar la lista después de eliminar
                 fetchAndRenderEquipos();
             } catch (error) {
                 console.error('Error al eliminar equipo:', error);
                 alert('Error al eliminar el equipo: ' + error.message);
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

  // Agrega la tabla al área de contenido.
  contentArea.appendChild(table);

  console.log('Tabla de equipos renderizada.');
}

// ===============================================================
// FUNCIÓN PRINCIPAL Y MANEJO DE EVENTOS
// Controla el flujo al cargar la página.
// ===============================================================

// Función asíncrona que orquesta la obtención y renderización de equipos.
async function fetchAndRenderEquipos() {
  showLoading(); // Muestra el mensaje de carga.
  try {
    // Llama a la función para obtener los datos de la API.
    const equipos = await getEquipos();
    // Si tiene éxito, renderiza la tabla con los datos recibidos.
    renderEquiposTable(equipos);
  } catch (error) {
    // Si hay un error en cualquier paso (petición o parsing), muestra el mensaje de error.
    showError(error.message);
  }
}


// Espera a que el DOM esté completamente cargado antes de ejecutar el código principal.
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM completamente cargado. Iniciando fetchAndRenderEquipos.');
  // Llama a la función principal para cargar y mostrar los equipos al cargar la página.
  fetchAndRenderEquipos();

  // Puedes añadir otros event listeners aquí, por ejemplo, para los enlaces de navegación
  // que cambiarían la vista (ej. mostrar lista de empleados).
});

// Script para el menú hamburguesa (ya estaba en index.html, lo puedes dejar ahí o moverlo aquí si quieres centralizar JS)
// Aquí lo dejamos como ejemplo de cómo el JS se conecta a eventos del DOM.
document.getElementById('hamburger-button').addEventListener('click', function () {
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu.classList.toggle('max-h-0'); // Alterna la altura máxima para ocultar/mostrar
  mobileMenu.classList.toggle('max-h-screen'); // Usa max-h-screen para mostrar
});