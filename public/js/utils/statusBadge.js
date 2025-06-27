export function getStatusBadge(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'activo') return '<span class="badge badge-success">' + status + '</span>';
    if (s === 'disponible') return '<span class="badge badge-primary">' + status + '</span>';
    if (s === 'asignado') return '<span class="badge badge-secondary">' + status + '</span>';
    if (s === 'en mantenimiento') return '<span class="badge badge-warning">' + status + '</span>';
    if (s === 'finalizado') return '<span class="badge badge-danger">' + status + '</span>';
    if (s === 'cancelado' || s === 'baja' || s === 'bloqueado') return '<span class="badge badge-dark">' + status + '</span>';
    if (s === 'inactivo') return '<span class="badge badge-light text-dark">' + status + '</span>';
    if (s === 'reservada' || s === 'pendiente') return '<span class="badge badge-info">' + status + '</span>';
    return '<span class="badge badge-info">' + status + '</span>';
} 