//public/js/views/cuentaEmailFormView.js
// * Formulario de creación y edición de Cuentas Email
import { createCuentaEmail, updateCuentaEmail, getCuentaEmailById, getEmpleados, getStatuses } from '../api.js';
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

const contentArea = document.getElementById('content-area');
let empleadosCache = null;
let statusesCache = null;

function showCuentaEmailFormLoading(action = 'Crear') {
    showFormLoading(action, 'cuenta email');
}

function showCuentaEmailFormError(message, action = 'procesar') {
    showFormError(action, 'cuenta email', message, () => showCuentaEmailForm());
}

async function renderCuentaEmailForm(cuentaToEdit = null) {
    const cuentaId = typeof cuentaToEdit === 'string' ? cuentaToEdit : (cuentaToEdit && cuentaToEdit.id);
    const isEditing = cuentaId !== null;
    const formTitle = isEditing ? `Editar Cuenta Email (ID: ${cuentaId})` : 'Registrar Nueva Cuenta Email';
    let currentCuentaData = null;
    if (isEditing && typeof cuentaToEdit === 'string') {
        try {
            currentCuentaData = await getCuentaEmailById(cuentaId);
            if (!currentCuentaData) {
                showCuentaEmailFormError(`No se encontró la cuenta con ID ${cuentaId}.`, 'cargar');
                return;
            }
        } catch (error) {
            showCuentaEmailFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else if (isEditing) {
        currentCuentaData = cuentaToEdit;
    }
    showCuentaEmailFormLoading(isEditing ? 'Editar' : 'Crear');
    try {
        if (!empleadosCache) empleadosCache = await getEmpleados();
        if (!statusesCache) statusesCache = await getStatuses();
        contentArea.innerHTML = `
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">${formTitle}</h4>
                    </div>
                    <div class="card-body">
                        <form id="cuentaEmailForm" class="basic-form">
                            <div class="mb-3">
                                <label for="email" class="form-label">Correo Electrónico <span class="text-danger">*</span></label>
                                <input type="email" id="email" name="email" required class="form-control input-default" value="${isEditing && currentCuentaData.email ? currentCuentaData.email : ''}" placeholder="usuario@empresa.com">
                            </div>
                            <div class="mb-3">
                                <label for="id_empleado" class="form-label">Empleado Asignado</label>
                                <select id="id_empleado" name="id_empleado" class="form-control select2">
                                    <option value="">Sin asignar</option>
                                    ${empleadosCache.map(emp => `<option value="${emp.id}" ${isEditing && currentCuentaData.id_empleado === emp.id ? 'selected' : ''}>${emp.nombres} ${emp.apellidos} (ID: ${emp.id})</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="id_status" class="form-label">Estado <span class="text-danger">*</span></label>
                                <select id="id_status" name="id_status" required class="form-control select2">
                                    <option value="">Seleccione un estado...</option>
                                    ${statusesCache
                                      .filter(status => isEditing || ![2, 6, 7, 9, 12].includes(status.id))
                                      .map(status => `<option value="${status.id}" ${isEditing && currentCuentaData.id_status === status.id ? 'selected' : (!isEditing && status.id === 1 ? 'selected' : '')}>${status.nombre_status}</option>`)
                                      .join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="notas" class="form-label">Notas</label>
                                <textarea id="notas" name="notas" rows="3" class="form-control uppercase-field" placeholder="DESCRIBA EL PROPÓSITO DE LA CUENTA, DEPARTAMENTO, PERMISOS ESPECIALES, OBSERVACIONES, ETC.">${isEditing && currentCuentaData.notas ? currentCuentaData.notas : ''}</textarea>
                            </div>
                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelCuentaEmailForm" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar Cuenta'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        if (window.$ && $.fn.select2) {
            $('#id_empleado').select2({ width: '100%' });
            $('#id_status').select2({ width: '100%' });
        }

        // Inicializar transformación a mayúsculas en campos de texto
        applyUppercaseToFields(['notas']);

        document.getElementById('cuentaEmailForm').addEventListener('submit', (event) => handleCuentaEmailFormSubmit(event, cuentaId));
        document.getElementById('cancelCuentaEmailForm').addEventListener('click', async () => {
            await Swal.fire({
                title: 'Cancelado',
                text: 'El formulario de cuenta de email ha sido cancelado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('cuentas-email-list');
            } else {
                contentArea.innerHTML = `<p>Por favor, navega manualmente a la lista.</p>`;
            }
        });
    } catch (error) {
        showCuentaEmailFormError(error.message, 'cargar');
    }
}

async function handleCuentaEmailFormSubmit(event, editingId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const cuentaData = {};
    for (let [key, value] of formData.entries()) {
        if (['id_empleado', 'id_status'].includes(key)) {
            cuentaData[key] = value ? parseInt(value, 10) : null;
        } else {
            cuentaData[key] = value.trim() === '' ? null : value;
        }
    }
    if (!cuentaData.email || !cuentaData.id_status) {
        document.getElementById('form-error-message').textContent = 'Correo y Estado son obligatorios.';
        return;
    }
    document.getElementById('form-error-message').textContent = '';
    try {
        let responseMessage = '';
        if (editingId) {
            await updateCuentaEmail(editingId, cuentaData);
            responseMessage = `Cuenta email "${cuentaData.email}" actualizada exitosamente en el sistema.`;
        } else {
            const nuevaCuenta = await createCuentaEmail(cuentaData);
            responseMessage = `Cuenta email "${nuevaCuenta.email}" registrada exitosamente en el sistema.`;
        }
        await Swal.fire({
            title: editingId ? 'Cuenta Email Actualizada Exitosamente' : 'Cuenta Email Registrada Exitosamente',
            text: responseMessage,
            icon: 'success',
            confirmButtonText: 'Entendido'
        });
        if (typeof window.navigateTo === 'function') window.navigateTo('cuentas-email-list');
    } catch (error) {
        document.getElementById('form-error-message').textContent = error.message || 'Ocurrió un error desconocido.';
    }
}

async function showCuentaEmailForm(params = null) {
    const cuentaId = typeof params === 'string' ? params : (params && params.id);
    await renderCuentaEmailForm(cuentaId);
}

export { showCuentaEmailForm }; 