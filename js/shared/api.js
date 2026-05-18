/**
 * Definición centralizada de todos los endpoints del sistema.
 * Fuente de verdad: PROYECTO_VERIFICADO.md
 * 
 * ⚠️ ATENCIÓN: Los nombres de campo en los DTOs de respuesta deben
 * validarse contra la respuesta real del backend (network tab / Swagger),
 * no solo contra PROYECTO_VERIFICADO.md. Ejemplo: EventoResponseDTO
 * expone `estadoEventoNombre`, no `estadoNombre`.
 */
const API = {
    auth: {
        loginWithGoogle: (idToken) => window.api.post('/auth/google', { idToken }),
        loginLocal: (email, password) => window.api.post('/auth/login', { email, password })
    },
    clientes: {
        list: () => window.api.get('/api/clientes'),
        get: (id) => window.api.get(`/api/clientes/${id}`),
        crear: (data) => window.api.post('/api/clientes', data),
        actualizar: (id, data) => window.api.put(`/api/clientes/${id}`, data),
        eliminar: (id) => window.api.delete(`/api/clientes/${id}`),
        buscar: (nombre) => window.api.get(`/api/clientes/buscar?nombre=${encodeURIComponent(nombre)}`),
        listarInactivos: () => window.api.get('/api/clientes/inactivos'),
        reactivar: (id) => window.api.patch(`/api/clientes/${id}/reactivar`),
        eventos: (id) => window.api.get(`/api/clientes/${id}/eventos`)
    },
    eventos: {
        list: (params) => {
            const qs = params ? new URLSearchParams(params).toString() : '';
            return window.api.get(`/api/eventos${qs ? '?' + qs : ''}`);
        },
        get: (id) => window.api.get(`/api/eventos/${id}`),
        crear: (data) => window.api.post('/api/eventos', data),
        actualizar: (id, data) => window.api.put(`/api/eventos/${id}`, data),
        programar: (id) => window.api.patch(`/api/eventos/${id}/programar`),
        confirmar: (id) => window.api.patch(`/api/eventos/${id}/confirmar`),
        iniciarMontaje: (id) => window.api.patch(`/api/eventos/${id}/iniciar-montaje`),
        finalizar: (id) => window.api.patch(`/api/eventos/${id}/finalizar`),
        cancelar: (id, motivo) => window.api.patch(`/api/eventos/${id}/cancelar`, { motivo }),
        revertirCancelacion: (id) => window.api.patch(`/api/eventos/${id}/revertir-cancelacion`),
        confirmarCancelacion: (id) => window.api.patch(`/api/eventos/${id}/confirmar-cancelacion`),
        agregarExtras: (id, data) => window.api.patch(`/api/eventos/${id}/extras`, data),
        disponibilidad: (params) => {
            const clean = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v != null && v !== '')
            );
            const qs = new URLSearchParams(clean).toString();
            return window.api.get(`/api/eventos/disponibilidad${qs ? '?' + qs : ''}`);
        },
        calendario: (inicio, fin) => window.api.get(`/api/eventos/calendario?inicio=${inicio}&fin=${fin}`),
        rentabilidad: (id) => window.api.get(`/api/eventos/${id}/rentabilidad`),
        detalle: (id) => window.api.get(`/api/eventos/${id}/detalle`),
        productos: (id) => window.api.get(`/api/eventos/${id}/productos`)
    },
    decoraciones: {
        list: (params) => {
            const qs = new URLSearchParams(params || {});
            return window.api.get(`/api/decoraciones${qs.toString() ? `?${qs}` : ''}`);
        },
        get: (id) => window.api.get(`/api/decoraciones/${id}`),
        crear: (data) => window.api.post('/api/decoraciones', data),
        actualizar: (id, data) => window.api.put(`/api/decoraciones/${id}`, data),
        eliminar: (id) => window.api.delete(`/api/decoraciones/${id}`),
        reactivar: (id) => window.api.patch(`/api/decoraciones/${id}/reactivar`),
        compatibles: (tipoEventoId) => window.api.get(`/api/decoraciones/compatibles?tipoEventoId=${tipoEventoId}`)
    },
    productos: {
        list: () => window.api.get('/api/productos'),
        get: (id) => window.api.get(`/api/productos/${id}`),
        crear: (data) => window.api.post('/api/productos', data),
        actualizar: (id, data) => window.api.put(`/api/productos/${id}`, data),
        eliminar: (id) => window.api.delete(`/api/productos/${id}`),
        buscar: (nombre) => window.api.get(`/api/productos/buscar?nombre=${encodeURIComponent(nombre)}`),
        reactivar: (id) => window.api.patch(`/api/productos/${id}/reactivar`)
    },
    inventario: {
        entrada: (data) => window.api.post('/api/inventario/entrada', data),
        salida: (data) => window.api.post('/api/inventario/salida', data),
        ajuste: (productoId, data) => window.api.post(`/api/inventario/ajuste/${productoId}`, data),
        stockProducto: (id) => window.api.get(`/api/inventario/productos/${id}/stock`),
        movimientosProducto: (id, params) => {
            const qs = params ? new URLSearchParams(params).toString() : '';
            return window.api.get(`/api/inventario/productos/${id}/movimientos${qs ? '?' + qs : ''}`);
        },
        movimientos: (params) => window.api.get(`/api/inventario/movimientos?${new URLSearchParams(params || {})}`)
    },
    cronogramas: {
        list: (params) => window.api.get(`/api/cronogramas?${new URLSearchParams(params || {})}`),
        porEvento: (eventoId) => window.api.get(`/api/cronogramas/evento/${eventoId}`),
        get: (id) => window.api.get(`/api/cronogramas/${id}`),
        crear: (data) => window.api.post('/api/cronogramas', data),
        actualizar: (id, data) => window.api.put(`/api/cronogramas/${id}`, data),
        cambiarEstado: (id, estado) => window.api.patch(`/api/cronogramas/${id}/estado`, { estado }),
        cancelar: (id) => window.api.patch(`/api/cronogramas/${id}/cancelar`),
        asignarUsuario: (id, data) => window.api.post(`/api/cronogramas/${id}/usuarios`, data),
        listarUsuarios: (id) => window.api.get(`/api/cronogramas/${id}/usuarios`),
        quitarUsuario: (id, usuarioId) => window.api.delete(`/api/cronogramas/${id}/usuarios/${usuarioId}`)
    },
    pagos: {
        list: (params) => window.api.get(`/api/pagos?${new URLSearchParams(params || {})}`),
        eventosCobranza: (params) => window.api.get(`/api/pagos/eventos-cobranza?${new URLSearchParams(params || {})}`),
        porEvento: (eventoId) => window.api.get(`/api/pagos/evento/${eventoId}`),
        crear: (data) => window.api.post('/api/pagos', data),
        confirmar: (id) => window.api.patch(`/api/pagos/${id}/confirmar`),
        anular: (id) => window.api.patch(`/api/pagos/${id}/anular`),
        resumen: (eventoId) => window.api.get(`/api/pagos/evento/${eventoId}/resumen`)
    },
    documentos: {
        list: (params) => window.api.get(`/api/documentos?${new URLSearchParams(params || {})}`),
        porEvento: (eventoId) => window.api.get(`/api/documentos/evento/${eventoId}`),
        get: (id) => window.api.get(`/api/documentos/${id}`),
        generar: (eventoId, tipo) => window.api.post(`/api/documentos/evento/${eventoId}/generar?tipo=${encodeURIComponent(tipo)}`),
        avisoSaldoPendiente: (eventoId) => window.api.post(`/api/documentos/evento/${eventoId}/aviso-saldo-pendiente`),
        reenviar: (id) => window.api.post(`/api/documentos/${id}/reenviar`),
        plantillas: {
            list: () => window.api.get('/api/documentos/plantillas'),
            get: (id) => window.api.get(`/api/documentos/plantillas/${id}`),
            actualizar: (id, data) => window.api.put(`/api/documentos/plantillas/${id}`, data)
        }
    },
    tiposEvento: {
        list: () => window.api.get('/api/tipos-evento'),
        get: (id) => window.api.get(`/api/tipos-evento/${id}`),
        crear: (data) => window.api.post('/api/tipos-evento', data),
        actualizar: (id, data) => window.api.put(`/api/tipos-evento/${id}`, data),
        toggle: (id) => window.api.patch(`/api/tipos-evento/${id}/toggle`)
    },
    catalogosPago: {
        estados: () => window.api.get('/api/catalogos/estados-pago'),
        conceptos: () => window.api.get('/api/catalogos/conceptos-pago'),
        metodos: () => window.api.get('/api/catalogos/metodos-pago'),
        crearMetodo: (data) => window.api.post('/api/catalogos/metodos-pago', data),
        toggleMetodo: (id) => window.api.patch(`/api/catalogos/metodos-pago/${id}/toggle`)
    },
    configuracion: {
        list: () => window.api.get('/api/configuracion'),
        get: (clave) => window.api.get(`/api/configuracion/${encodeURIComponent(clave)}`),
        actualizar: (clave, valor) => window.api.request(`/api/configuracion/${encodeURIComponent(clave)}`, {
            method: 'PUT',
            body: String(valor ?? ''),
            headers: {
                'Content-Type': 'text/plain'
            }
        })
    },
    usuarios: {
        list: () => window.api.get('/api/usuarios'),
        get: (id) => window.api.get(`/api/usuarios/${id}`),
        crear: (data) => window.api.post('/api/usuarios', data),
        cambiarEstado: (id, activo) => window.api.patch(`/api/usuarios/${id}/estado`, { activo }),
        me: () => window.api.get('/api/usuarios/me')
    },
    gastos: {
        list: (params) => window.api.get(`/api/gastos?${new URLSearchParams(params || {})}`),
        porEvento: (eventoId) => window.api.get(`/api/gastos/evento/${eventoId}`),
        resumen: (eventoId) => window.api.get(`/api/gastos/evento/${eventoId}/resumen`),
        get: (id) => window.api.get(`/api/gastos/${id}`),
        crear: (data) => window.api.post('/api/gastos', data),
        desembolsar: (id) => window.api.patch(`/api/gastos/${id}/desembolsar`),
        eliminar: (id) => window.api.delete(`/api/gastos/${id}`),
        eventosControl: () => window.api.get('/api/gastos/eventos-control')
    },
    notificaciones: {
        mias: () => window.api.get('/api/notificaciones/mias'),
        leer: (id) => window.api.patch(`/api/notificaciones/${id}/leer`)
    },
    auditoria: {
        list: (params) => window.api.get(`/api/auditoria?${new URLSearchParams(params || {})}`),
        porTabla: (tabla, params) => window.api.get(`/api/auditoria/tabla/${tabla}?${new URLSearchParams(params || {})}`),
        porRegistro: (tabla, id) => window.api.get(`/api/auditoria/tabla/${tabla}/registro/${id}`)
    }
};

window.API = API;
