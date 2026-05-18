/**
 * Núcleo de peticiones HTTP con manejo centralizado de errores y tokens.
 */
const api = {
    async request(path, options = {}) {
        const config = window.APP_CONFIG;
        const token = localStorage.getItem(config.TOKEN_KEY);

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const url = `${config.API_URL}${path}`;
        const finalOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);

            if (response.status === 401 || response.status === 403) {
                // Si estamos en login y falla el 401/403, es error de credenciales
                if (window.location.pathname.includes('login.html')) {
                    throw new Error('No autorizado. Verifica que tu cuenta tenga acceso de administrador.');
                }
                // Si estamos en otra página, sesión expirada
                localStorage.removeItem(config.TOKEN_KEY);
                window.location.href = config.LOGIN_PATH;
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const mensaje = errorData.mensaje || errorData.message || 'Ocurrió un error en la petición';
                const prefix = response.status === 409 ? 'Conflicto: ' : '';
                throw new Error(prefix + mensaje);
            }

            // Manejo de respuestas vacías (204)
            if (response.status === 204) return null;

            return await response.json();
        } catch (error) {
            console.error('HTTP Error:', error);
            throw error;
        }
    },

    get(path) { return this.request(path, { method: 'GET' }); },
    post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
    put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
    patch(path, body) { return this.request(path, { method: 'PATCH', body: JSON.stringify(body) }); },
    delete(path) { return this.request(path, { method: 'DELETE' }); }
};

window.api = api;
