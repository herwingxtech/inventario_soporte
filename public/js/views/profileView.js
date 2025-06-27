import { showLoadingSpinner } from '../utils/loading.js';
import { getUsuarioSistemaById } from '../api.js';

async function loadProfileView() {
    const contentArea = document.getElementById('content-area');
    showLoadingSpinner(contentArea, 'Cargando perfil de usuario...');
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        contentArea.innerHTML = `<div class="text-danger">No hay datos de usuario disponibles.</div>`;
        return;
    }
    try {
        const usuario = await getUsuarioSistemaById(userData.id);
        contentArea.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 70vh;">
          <div class="card shadow rounded-4" style="max-width: 500px; width: 100%;">
            <div class="card-body text-center p-4">
              <div class="mb-3 d-flex justify-center">
                <img src="/images/profile/12.png" alt="Foto de perfil" class="rounded-circle border " style="width: 120px; height: 120px; object-fit: contain;">
              </div>
              <div class="mb-2 text-muted small">${usuario.email || '-'}</div>
              <div class="mb-2">
                <span class="badge bg-secondary">${usuario.nombre_rol}</span>
                <span class="badge bg-success text-dark border ms-1 text">${usuario.status_nombre}</span>
              </div>
              <div class="mb-3 text-muted" style="font-size: 0.95em;">
                <i class="fa fa-calendar me-1"></i> Registrado: ${usuario.fecha_registro ? new Date(usuario.fecha_registro).toLocaleDateString() : '-'}
                <br>
                <i class="fa fa-sign-in-alt me-1"></i> Último login: ${usuario.fecha_ultimo_login ? new Date(usuario.fecha_ultimo_login).toLocaleString() : '-'}
              </div>
              <hr>
              <div class="text-start">
                <div class="fw-semibold mb-2 text-primary"><i class="fa fa-id-badge me-2"></i>Empleado Asociado</div>
                ${usuario.id_empleado ? `
                  <div class="mb-1"><i class="fa fa-user me-2"></i><strong>ID:</strong> ${usuario.id_empleado}</div>
                  <div class="mb-1"><i class="fa fa-user-tag me-2"></i><strong>Nombre:</strong> ${usuario.nombre_empleado || '-'} ${usuario.apellido_empleado || ''}</div>
                ` : '<div class="text-muted">Sin empleado asociado</div>'}
              </div>
            </div>
          </div>
        </div>
        `;
    } catch (error) {
        contentArea.innerHTML = `<div class="text-danger">No se pudo cargar el perfil: ${error.message}</div>`;
    }
}

export { loadProfileView }; 