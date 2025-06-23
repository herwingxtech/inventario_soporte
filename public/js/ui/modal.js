// public/js/ui/modal.js
// * Este módulo se encarga de crear y manejar modales genéricos.

// * Referencia al body para añadir/quitar el modal del DOM.
const body = document.body;

// * Variable para almacenar la referencia al overlay del modal actual, si existe.
let currentModalOverlay = null;

// * Función para crear y mostrar un modal de confirmación.
// * Retorna una Promise que se resuelve a `true` si el usuario confirma,
// * o `false` si cancela o cierra el modal.
// *
// * @param {string} title - El título del modal.
// * @param {string} message - El mensaje/pregunta del modal.
// * @param {string} confirmButtonText - Texto para el botón de confirmación (default: 'Confirmar').
// * @param {string} cancelButtonText - Texto para el botón de cancelación (default: 'Cancelar').
// * @param {string} confirmButtonClass - Clases de Tailwind para el botón de confirmación (default: bg-red-600 hover:bg-red-700).
// * @returns {Promise<boolean>}
function showConfirmationModal({
    title = 'Confirmación',
    message = '¿Estás seguro?',
    confirmButtonText = 'Confirmar',
    cancelButtonText = 'Cancelar',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700 text-white' // Clases por defecto para un modal de "peligro"
}) {
    // * Primero, me aseguro de que no haya otro modal abierto.
    // * Si hay uno, lo cierro antes de abrir el nuevo.
    //? ¿Debería permitir múltiples modales apilados? Por ahora, solo uno a la vez.
    if (currentModalOverlay) {
        closeCurrentModal();
    }

    return new Promise((resolve) => {
        // * Creo el overlay del modal (el fondo oscuro).
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'confirmationModalOverlay'; // Le doy un ID por si necesito seleccionarlo.
        // Clases de Tailwind: fijo, cubre toda la pantalla, solo blur, flex para centrar, z-index alto.
        modalOverlay.className = 'fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out opacity-0';

        // * Creo el contenedor principal del modal (la caja blanca).
        const modalDialog = document.createElement('div');
        modalDialog.id = 'confirmationModalDialog';
        // Clases de Tailwind: fondo blanco, padding, bordes redondeados, sombra, ancho máximo, responsive.
        modalDialog.className = 'bg-white p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0';

        // * Creo el título del modal.
        const modalTitle = document.createElement('h3');
        modalTitle.id = 'confirmationModalTitle';
        modalTitle.className = 'text-xl font-semibold mb-4 text-gray-800';
        modalTitle.textContent = title;

        // * Creo el mensaje del modal.
        const modalMessage = document.createElement('p');
        modalMessage.id = 'confirmationModalMessage';
        modalMessage.className = 'text-gray-700 mb-6';
        modalMessage.textContent = message;

        // * Creo el contenedor para los botones.
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'flex justify-end space-x-3';

        // * Creo el botón de Cancelar.
        const cancelButton = document.createElement('button');
        cancelButton.id = 'confirmationModalCancel';
        // Clases de Tailwind: padding, bordes, redondeado, fuente, color, hover.
        cancelButton.className = 'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
        cancelButton.textContent = cancelButtonText;
        cancelButton.addEventListener('click', () => {
            closeModalAndResolve(false); // Cierro el modal y resuelvo la promesa con false.
        });

        // * Creo el botón de Confirmar.
        const confirmButton = document.createElement('button');
        confirmButton.id = 'confirmationModalConfirm';
        // Clases de Tailwind: padding, bordes (transparentes), redondeado, sombra, fuente, color (del parámetro), hover.
        confirmButton.className = `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClass} focus:ring-${confirmButtonClass.split(' ')[0].split('-')[1]}-500`; // Ajuste para el focus ring color
        confirmButton.textContent = confirmButtonText;
        confirmButton.addEventListener('click', () => {
            closeModalAndResolve(true); // Cierro el modal y resuelvo la promesa con true.
        });

        // * Armo la estructura del modal.
        buttonsDiv.appendChild(cancelButton);
        buttonsDiv.appendChild(confirmButton);

        modalDialog.appendChild(modalTitle);
        modalDialog.appendChild(modalMessage);
        modalDialog.appendChild(buttonsDiv);

        modalOverlay.appendChild(modalDialog);

        // * Añado el modal completo al body del documento.
        body.appendChild(modalOverlay);
        body.classList.add('overflow-hidden'); // Evito el scroll del fondo mientras el modal está abierto.
        currentModalOverlay = modalOverlay; // Guardo la referencia al modal actual.

        // * Hago que el modal aparezca con una pequeña transición (fade in y scale up).
        // * Usamos un pequeño timeout para asegurar que el navegador aplique la clase 'opacity-0' antes de cambiarla.
        requestAnimationFrame(() => {
            modalOverlay.classList.remove('opacity-0');
            modalDialog.classList.remove('scale-95', 'opacity-0');
            modalDialog.classList.add('scale-100', 'opacity-100');
        });


        // * Función interna para cerrar el modal y resolver la promesa.
        function closeModalAndResolve(value) {
            // * Transición de salida.
            modalOverlay.classList.add('opacity-0');
            modalDialog.classList.remove('scale-100', 'opacity-100');
            modalDialog.classList.add('scale-95', 'opacity-0');

            // * Espero a que termine la transición antes de remover el elemento.
            setTimeout(() => {
                if (body.contains(modalOverlay)) { // Verifico si aún está en el DOM.
                    body.removeChild(modalOverlay);
                }
                body.classList.remove('overflow-hidden'); // Restauro el scroll del body.
                currentModalOverlay = null; // Limpio la referencia.
                resolve(value); // Resuelvo la promesa.
            }, 300); // La duración debe coincidir con la de Tailwind (duration-300).
        }

        // * Cierro el modal si el usuario presiona la tecla Escape.
        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                closeModalAndResolve(false);
                document.removeEventListener('keydown', handleEscapeKey); // Limpio el listener.
            }
        }
        document.addEventListener('keydown', handleEscapeKey);

        // * Cierro el modal si el usuario hace clic fuera del diálogo del modal (en el overlay).
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) { // Solo si el clic es directamente en el overlay.
                closeModalAndResolve(false);
            }
        });
    });
}

// * Función para mostrar un modal informativo (reemplaza alert()).
// * @param {string} title - El título del modal.
// * @param {string} message - El mensaje a mostrar.
// * @param {string} buttonText - Texto para el botón (default: 'Aceptar').
// * @returns {Promise<void>}
function showInfoModal({
    title = 'Información',
    message = '',
    buttonText = 'Aceptar'
}) {
    // * Primero, me aseguro de que no haya otro modal abierto.
    if (currentModalOverlay) {
        closeCurrentModal();
    }

    return new Promise((resolve) => {
        // * Creo el overlay del modal.
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'infoModalOverlay';
        modalOverlay.className = 'fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out opacity-0';

        // * Creo el contenedor principal del modal.
        const modalDialog = document.createElement('div');
        modalDialog.id = 'infoModalDialog';
        modalDialog.className = 'bg-white p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0';

        // * Creo el título del modal.
        const modalTitle = document.createElement('h3');
        modalTitle.id = 'infoModalTitle';
        modalTitle.className = 'text-xl font-semibold mb-4 text-gray-800';
        modalTitle.textContent = title;

        // * Creo el mensaje del modal.
        const modalMessage = document.createElement('p');
        modalMessage.id = 'infoModalMessage';
        modalMessage.className = 'text-gray-700 mb-6';
        modalMessage.textContent = message;

        // * Creo el botón de Aceptar.
        const acceptButton = document.createElement('button');
        acceptButton.id = 'infoModalAccept';
        acceptButton.className = 'px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
        acceptButton.textContent = buttonText;
        acceptButton.addEventListener('click', () => {
            closeModalAndResolve();
        });

        // * Armo la estructura del modal.
        modalDialog.appendChild(modalTitle);
        modalDialog.appendChild(modalMessage);
        modalDialog.appendChild(acceptButton);

        modalOverlay.appendChild(modalDialog);

        // * Añado el modal al body.
        body.appendChild(modalOverlay);
        body.classList.add('overflow-hidden');
        currentModalOverlay = modalOverlay;

        // * Animación de entrada.
        requestAnimationFrame(() => {
            modalOverlay.classList.remove('opacity-0');
            modalDialog.classList.remove('scale-95', 'opacity-0');
            modalDialog.classList.add('scale-100', 'opacity-100');
        });

        // * Función interna para cerrar el modal.
        function closeModalAndResolve() {
            modalOverlay.classList.add('opacity-0');
            modalDialog.classList.remove('scale-100', 'opacity-100');
            modalDialog.classList.add('scale-95', 'opacity-0');

            setTimeout(() => {
                if (body.contains(modalOverlay)) {
                    body.removeChild(modalOverlay);
                }
                body.classList.remove('overflow-hidden');
                currentModalOverlay = null;
                resolve();
            }, 300);
        }

        // * Cierro el modal con Escape.
        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                closeModalAndResolve();
                document.removeEventListener('keydown', handleEscapeKey);
            }
        }
        document.addEventListener('keydown', handleEscapeKey);

        // * Cierro el modal al hacer clic fuera.
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModalAndResolve();
            }
        });
    });
}

// * Cierra el modal actual si existe (usado si se abre otro modal o se navega).
function closeCurrentModal() {
    if (currentModalOverlay) {
        const cancelButton = currentModalOverlay.querySelector('#confirmationModalCancel');
        if (cancelButton) {
            // Simulo un clic en cancelar para activar la lógica de cierre y resolución de promesa.
            // Esto es un poco un hack, idealmente la función closeModalAndResolve sería más independiente.
            // O, si no hay promesa que resolver, simplemente lo removemos.
            // Por ahora, para el modal de confirmación, simular cancelar está bien.
            cancelButton.click();
        } else {
            // Si no es un modal de confirmación (no tiene botón cancelar), simplemente lo quito.
             if (body.contains(currentModalOverlay)) {
                body.removeChild(currentModalOverlay);
            }
            body.classList.remove('overflow-hidden');
            currentModalOverlay = null;
        }
    }
}


//TODO: Implementar showInfoModal(title, message, buttonText) para reemplazar alert().
//TODO: Implementar showFormModal(title, formHTML, onSubmitCallback) para modales con formularios.

// * Exporto las funciones para que otros módulos puedan usarlas.
export { showConfirmationModal, showInfoModal, closeCurrentModal };