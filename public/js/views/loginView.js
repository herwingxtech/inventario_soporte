// public/js/views/loginView.js
// * Lógica para la vista de Login.

import { login } from '../api.js'; // Necesito la función de login de mi API.
import { showInfoModal } from '../ui/modal.js';

const loginContent = document.getElementById('login-content');

// * Renderiza el formulario de login.
function renderLoginForm() {
    console.log('Herwing está renderizando el formulario de login.');
    let redirectMsg = '';
    if (sessionStorage.getItem('loginRedirect')) {
        redirectMsg = `<div class="mb-4 text-red-600 text-center font-semibold">Debes iniciar sesión para continuar.</div>`;
        sessionStorage.removeItem('loginRedirect');
    }
    loginContent.innerHTML = `
        <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md mx-auto">
            ${redirectMsg}
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Iniciar Sesión
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    Ingresa a tu cuenta del Inventario IT
                </p>
            </div>
            <form id="loginForm" class="mt-8 space-y-6">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="username" class="sr-only">Nombre de usuario</label>
                        <input id="username" name="username" type="text" autocomplete="username" required
                               class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                               placeholder="Nombre de usuario">
                    </div>
                    <div>
                        <label for="password" class="sr-only">Contraseña</label>
                        <input id="password" name="password" type="password" autocomplete="current-password" required
                               class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                               placeholder="Contraseña">
                    </div>
                </div>

                <div id="login-error-message" class="text-red-500 text-sm"></div>

                <div>
                    <button type="submit"
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Iniciar Sesión
                    </button>
                </div>
            </form>
        </div>
    `;

    // Añado el listener al formulario.
    document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
}

// * Maneja el envío del formulario de login.
async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    const errorDiv = document.getElementById('login-error-message');
    errorDiv.textContent = ''; // Limpio errores previos.

    try {
        console.log(`Herwing está intentando iniciar sesión como: ${username}`);
        const response = await login({ username, password }); // Llamo a la API de login.

        // * Si el login es exitoso, la API devuelve un token.
        console.log('Login exitoso, token recibido:', response.token);

        // * Almaceno el token en localStorage.
        // ! localStorage es visible para cualquier script en la página.
        // ! Para mayor seguridad, se pueden usar HttpOnly cookies, pero esto es más complejo de configurar.
        localStorage.setItem('authToken', response.token);
        // Opcional: guardar información del usuario también.
        localStorage.setItem('userData', JSON.stringify(response.user));

        // Muestro un mensaje de éxito y redirijo al home.
        await showInfoModal({ title: '¡Bienvenido!', message: 'Has iniciado sesión correctamente.'});

        // Refresco la página completa para que la app se reinicialice en estado "logueado".
        // O, mejor, llamo a navigateTo para ir al home sin recargar.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('home');
        } else {
            window.location.href = '/'; // Fallback a recargar la página.
        }

    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        errorDiv.textContent = error.message || 'Ocurrió un error inesperado.';
    }
}

// * Exporto la función para que main.js la pueda usar.
export { renderLoginForm as loadLoginView }; 