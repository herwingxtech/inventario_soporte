function loadProfileView() {
    const contentArea = document.getElementById('content-area');
    //* Obtener datos del usuario desde localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        contentArea.innerHTML = `<div class="text-red-500">No hay datos de usuario disponibles.</div>`;
        return;
    }
    //* Renderizar la vista de perfil
    contentArea.innerHTML = `
        <div class="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
            <h2 class="text-2xl font-bold mb-4 text-center">Perfil de Usuario</h2>
            <div class="mb-4">
                <span class="font-semibold">Usuario:</span>
                <span>${userData.username}</span>
            </div>
            <div class="mb-4">
                <span class="font-semibold">Rol:</span>
                <span>${userData.roleId}</span>
            </div>
            <div class="flex justify-center mt-6">
                <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" data-action="logout">Cerrar sesión</button>
            </div>
        </div>
    `;
}

export { loadProfileView }; 