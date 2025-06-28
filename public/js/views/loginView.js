//public/js/views/loginView.js
// * Lógica para la vista de Login.

import { login } from '../api.js'; // Necesito la función de login de mi API.

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
               <div class="authincation h-100">
            <div class="container h-100">
                <div class="row justify-content-center h-100 align-items-center">
                    <div class="col-md-6">
                        <div class="authincation-content">
                            <div class="row no-gutters">
                                <div class="col-xl-12">
                                    <div class="auth-form">
                                        <div class="d-flex justify-center text-center mb-3">
                                            <a href="/inventario/">
                                                <img src="http://erp.linea-digital.com/erp/images/icono2.png" alt="Logo principal">
                                            </a>
                                        </div>
                                        <h4 class="text-center mb-4">Inicio de sesión</h4>
                                        ${redirectMsg}
                                        <form id="loginForm" class="mt-8 space-y-6">
                                            <div class="form-group">
                                                <label class="mb-1" for="username"><strong>Nombre de usuario</strong></label>
                                                <input id="username" name="username" type="text" autocomplete="username" required class="form-control" placeholder="Nombre de usuario">
                                            </div>
                                            <div class="form-group">
                                                <label class="mb-1" for="password"><strong>Contraseña</strong></label>
                                                <input id="password" name="password" type="password" autocomplete="current-password" required class="form-control" placeholder="Contraseña">
                                            </div>
                        
                                            <div id="login-error-message" class="text-danger text-sm"></div>
                                            <div class="text-center">
                                                <button type="submit" class="btn btn-primary btn-block">Iniciar Sesión</button>
                                            </div>
                                        </form>
                                        <div class="new-account mt-3">
                                            <p>¿No tienes una cuenta? <a class="text-primary" href="/inventario/" id="sign-up-link">Regístrate</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Añado el listener al formulario SOLO si existe.
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    // Forzar el tema oscuro de karciz
    document.body.setAttribute('data-theme-version', 'dark');
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
        Swal.fire({
            title: '¡Bienvenido!',
            text: 'Has iniciado sesión correctamente.',
            icon: 'success'
        });

        // Refresco la página completa para que la app se reinicialice en estado "logueado".
        // O, mejor, llamo a navigateTo para ir al home sin recargar.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('home');
        } else {
            window.location.href = '/inventario/'; // Fallback a recargar la página.
        }

    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        errorDiv.textContent = error.message || 'Ocurrió un error inesperado.';
    }
}

// * Exporto la función para que main.js la pueda usar.
export { renderLoginForm as loadLoginView }; 