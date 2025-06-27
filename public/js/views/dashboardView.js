//public/js/views/dashboardView.js
// * Dashboard principal con contadores y accesos rápidos

import { getEquipos, getEmpleados, getAsignaciones, getMantenimientos } from '../api.js';
import { showLoadingSpinner } from '../utils/loading.js';

const contentArea = document.getElementById('content-area');

//* Función para cargar los datos del dashboard
async function loadDashboardData() {
    let equiposCount = 0;
    let empleadosCount = 0;
    let asignacionesCount = 0;
    let mantenimientosCount = 0;

    try {
        // Cargar datos en paralelo para mejor rendimiento
        const [equipos, empleados, asignaciones, mantenimientos] = await Promise.all([
            getEquipos().catch(() => []),
            getEmpleados().catch(() => []),
            getAsignaciones().catch(() => []),
            getMantenimientos().catch(() => [])
        ]);

        equiposCount = equipos.length;
        empleadosCount = empleados.length;
        asignacionesCount = asignaciones.filter(a => !a.fecha_fin_asignacion).length; // Solo asignaciones activas
        mantenimientosCount = mantenimientos.length;

    } catch (error) {
        console.error('Error al cargar datos para el dashboard:', error);
    }

    return { equiposCount, empleadosCount, asignacionesCount, mantenimientosCount };
}

//* Función para renderizar el dashboard
async function renderDashboard() {
    showLoadingSpinner(contentArea, 'Cargando panel de control...');
    const userData = JSON.parse(localStorage.getItem('userData'));

    // Cargar datos para los contadores
    const { equiposCount, empleadosCount, asignacionesCount, mantenimientosCount } = await loadDashboardData();

    contentArea.innerHTML = `
        <div class="row">
            <div class="col-xl-12">
                <div class="row">
                    <div class="col-xl-12">
                        <div class="row">
                            <div class="col-xl-12">
                                <div class="card">
                                    <div class="card-header border-0 flex-wrap">
                                        <div>
                                            <h4 class="fs-20 font-w700 text">Bienvenido${userData ? `, ${userData.username}` : ''}</h4>
                                            <p class="mb-0 fs-14 text-muted">Panel de Control - Sistema de Inventario y Soporte Técnico</p>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="tab-content">
                                            <div class="tab-pane fade show active" id="overview" role="tabpanel">
                                                <div class="row">
                                                    <div class="col-xl-3 col-lg-6 col-sm-6">
                                                        <div class="widget-stat card">
                                                            <div class="card-body p-4">
                                                                <div class="media ai-icon">
                                                                    <span class="mr-3 bgl-primary">
                                                                        <i class="d-flex justify-center items-center flaticon-monitor text-primary"></i>
                                                                    </span>
                                                                    <div class="media-body">
                                                                        <h3 class="mb-0 text"><span class="counter ml-0">${equiposCount}</span></h3>
                                                                        <p class="mb-0 text-body">Equipos Registrados</p>
                                                                        <small class="text-primary">Inventario Activo</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-xl-3 col-lg-6 col-sm-6">
                                                        <div class="widget-stat card">
                                                            <div class="card-body p-4">
                                                                <div class="media ai-icon">
                                                                    <span class="mr-3 bgl-warning">
                                                                        <i class="d-flex justify-center items-center flaticon-user text-warning"></i>
                                                                    </span>
                                                                    <div class="media-body">
                                                                        <h3 class="mb-0 text"><span class="counter ml-0">${empleadosCount}</span></h3>
                                                                        <p class="mb-0 text-body">Empleados Activos</p>
                                                                        <small class="text-warning">Personal Registrado</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-xl-3 col-lg-6 col-sm-6">
                                                        <div class="widget-stat card">
                                                            <div class="card-body p-4">
                                                                <div class="media ai-icon">
                                                                    <span class="mr-3 bgl-success">
                                                                        <i class="d-flex justify-center items-center flaticon-381-link text-success"></i>
                                                                    </span>
                                                                    <div class="media-body">
                                                                        <h3 class="mb-0 text"><span class="counter ml-0">${asignacionesCount}</span></h3>
                                                                        <p class="mb-0 text-body">
                                                                           Asig. Activas
                                                                        </p>
                                                                        <small class="text-success">Recursos Asignados</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-xl-3 col-lg-6 col-sm-6">
                                                        <div class="widget-stat card">
                                                            <div class="card-body p-4">
                                                                <div class="media ai-icon">
                                                                    <span class="mr-3 bgl-info">
                                                                        <i class="d-flex justify-center items-center flaticon-settings text-info"></i>
                                                                    </span>
                                                                    <div class="media-body">
                                                                        <h3 class="mb-0 text"><span class="counter ml-0">${mantenimientosCount}</span></h3>
                                                                        <p class="mb-0 text-body">Mantenimientos</p>
                                                                        <small class="text-info">Técnico Activo</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="row">
                                                    <div class="col-xl-8">
                                                        <div class="card">
                                                            <div class="card-header">
                                                                <h4 class="card-title text">Accesos Rápidos</h4>
                                                            </div>
                                                            <div class="card-body">
                                                                <div class="row">
                                                                    <div class="col-xl-4 col-lg-6 col-sm-6">
                                                                        <div class="card bg-primary text-white quick-access-card" data-view="equipos-list" style="cursor: pointer;">
                                                                            <div class="card-body">
                                                                                <div class="d-flex align-items-center">
                                                                                    <div class="me-3">
                                                                                        <i class="flaticon-monitor fs-1"></i>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 class="mb-1">Gestionar Equipos</h5>
                                                                                        <p class="mb-0">Inventario y registro de equipos</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-xl-4 col-lg-6 col-sm-6">
                                                                        <div class="card bg-warning text-white quick-access-card" data-view="empleados-list" style="cursor: pointer;">
                                                                            <div class="card-body">
                                                                                <div class="d-flex align-items-center">
                                                                                    <div class="me-3">
                                                                                        <i class="flaticon-user fs-1"></i>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 class="mb-1">Gestionar Personal</h5>
                                                                                        <p class="mb-0">Empleados y usuarios del sistema</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-xl-4 col-lg-6 col-sm-6">
                                                                        <div class="card bg-success text-white quick-access-card" data-view="asignaciones-list" style="cursor: pointer;">
                                                                            <div class="card-body">
                                                                                <div class="d-flex align-items-center">
                                                                                    <div class="me-3">
                                                                                        <i class="flaticon-381-link fs-1"></i>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 class="mb-1">Asignar Recursos</h5>
                                                                                        <p class="mb-0">Asignación de equipos e IPs</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-xl-4 col-lg-6 col-sm-6">
                                                                        <div class="card bg-info text-white quick-access-card" data-view="cuentas-email-list" style="cursor: pointer;">
                                                                            <div class="card-body">
                                                                                <div class="d-flex align-items-center">
                                                                                    <div class="me-3">
                                                                                        <i class="flaticon-email fs-1"></i>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 class="mb-1">Correo Corporativo</h5>
                                                                                        <p class="mb-0">Gestión de cuentas de email</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-xl-4 col-lg-6 col-sm-6">
                                                                        <div class="card bg-secondary text-white quick-access-card" data-view="mantenimientos-list" style="cursor: pointer;">
                                                                            <div class="card-body">
                                                                                <div class="d-flex align-items-center">
                                                                                    <div class="me-3">
                                                                                        <i class="flaticon-settings fs-1"></i>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 class="mb-1">Mantenimientos</h5>
                                                                                        <p class="mb-0">Registro de mantenimiento técnico</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-xl-4 col-lg-6 col-sm-6">
                                                                        <div class="card bg-dark text-white quick-access-card" data-view="notas-list" style="cursor: pointer;">
                                                                            <div class="card-body">
                                                                                <div class="d-flex align-items-center">
                                                                                    <div class="me-3">
                                                                                        <i class="flaticon-381-notebook fs-1"></i>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 class="mb-1">Documentación</h5>
                                                                                        <p class="mb-0">Notas y documentación del sistema</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-xl-4">
                                                        <div class="card">
                                                            <div class="card-header">
                                                                <h4 class="card-title text">Información del Usuario</h4>
                                                            </div>
                                                            <div class="card-body">
                                                                ${userData ? `
                                                                    <div class="text-center mb-4">
                                                                        <div class="mb-3" style="display: inline-block;">
                                                                            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #007bff; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; margin: 0 auto;">
                                                                                ${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
                                                                            </div>
                                                                        </div>
                                                                        <h5 class="mb-1 text-body">${userData.username}</h5>
                                                                    </div>
                                                                    <div class="d-flex justify-content-between mb-2">
                                                                        <span>Usuario:</span>
                                                                        <span class="font-weight-bold text-body">${userData.username}</span>
                                                                    </div>
                                                                    <div class="d-flex justify-content-between mb-2">
                                                                        <span>Rol:</span>
                                                                        <span class="font-weight-bold text-body">${userData.roleName}</span>
                                                                    </div>
                                                                    <div class="d-flex justify-content-between">
                                                                        <span>Estado:</span>
                                                                        <span class="badge badge-success">Activo</span>
                                                                    </div>
                                                                ` : `
                                                                    <div class="text-center">
                                                                        <p class="text-muted">No hay información de usuario disponible</p>
                                                                    </div>
                                                                `}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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

    // Agregar efectos hover a las tarjetas de acceso rápido
    const quickAccessCards = document.querySelectorAll('.quick-access-card');
    quickAccessCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
            this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });

        // Agregar funcionalidad de navegación
        card.addEventListener('click', function () {
            const viewName = this.getAttribute('data-view');
            if (viewName) {
                // Usar la función navigateTo global
                if (window.navigateTo) {
                    window.navigateTo(viewName);
                } else {
                    console.error('Función navigateTo no disponible');
                }
            }
        });
    });
}

//* Función principal para cargar el dashboard
async function loadDashboard() {
    await renderDashboard();
}

export { loadDashboard }; 