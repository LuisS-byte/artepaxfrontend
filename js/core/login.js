/**
 * Lógica específica de la pantalla de Login.
 */
(function () {
    const config = window.APP_CONFIG;
    const errorMsg = document.getElementById('error-msg');

    /**
     * Callback global requerido por Google Identity Services
     */
    window.handleGoogleLogin = async function (googleResponse) {
        limpiarError();
        mostrarCargando();

        try {
            // Usamos la capa API centralizada
            const data = await window.API.auth.loginWithGoogle(googleResponse.credential);
            
            // Guardar token y redireccionar
            localStorage.setItem(config.TOKEN_KEY, data.token);
            window.location.href = config.DASHBOARD_PATH;
            
        } catch (err) {
            mostrarError(err.message || 'Error al iniciar sesión con Google.');
            ocultarCargando();
        }
    };

    if (!config.GOOGLE_CLIENT_ID) {
        mostrarError('Falta configurar GOOGLE_CLIENT_ID para iniciar sesión.');
    }

    function mostrarError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function limpiarError() {
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
    }

    function mostrarCargando() {
        const btn = document.querySelector('.g_id_signin');
        if (btn) btn.style.opacity = '0.5';
        if (btn) btn.style.pointerEvents = 'none';
    }

    function ocultarCargando() {
        const btn = document.querySelector('.g_id_signin');
        if (btn) btn.style.opacity = '1';
        if (btn) btn.style.pointerEvents = 'auto';
    }

    // ── Login Local ─────────────────────────────────────
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('btn-login');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const fieldErrors = document.getElementById('field-errors');

    if (loginForm) {
        loginForm.addEventListener('submit', handleSubmit);

        function limpiarErroresCampo() {
            fieldErrors.innerHTML = '';
            fieldErrors.classList.add('hidden');
            [emailInput, passwordInput].forEach(function (el) {
                if (el) el.classList.remove('input-error');
            });
        }

        function mostrarErroresCampo(errors) {
            limpiarErroresCampo();
            var html = '';
            if (errors.email) {
                html += '<div class="field-error">' + escapeHtml(errors.email) + '</div>';
                if (emailInput) emailInput.classList.add('input-error');
            }
            if (errors.password) {
                html += '<div class="field-error">' + escapeHtml(errors.password) + '</div>';
                if (passwordInput) passwordInput.classList.add('input-error');
            }
            if (html) {
                fieldErrors.innerHTML = html;
                fieldErrors.classList.remove('hidden');
            }
        }

        function setLoading(loading) {
            loginBtn.disabled = loading;
            loginBtn.classList.toggle('loading', loading);
            if (emailInput) emailInput.disabled = loading;
            if (passwordInput) passwordInput.disabled = loading;
        }

        function validarEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function handleSubmit(e) {
            e.preventDefault();
            limpiarError();
            limpiarErroresCampo();

            var email = emailInput ? emailInput.value.trim() : '';
            var password = passwordInput ? passwordInput.value : '';

            var errors = {};
            if (!email) {
                errors.email = 'El correo electrónico es obligatorio';
            } else if (!validarEmail(email)) {
                errors.email = 'El formato del correo electrónico no es válido';
            }
            if (!password) {
                errors.password = 'La contraseña es obligatoria';
            }

            if (Object.keys(errors).length > 0) {
                mostrarErroresCampo(errors);
                return;
            }

            handleLocalLogin(email, password);
        }

        async function handleLocalLogin(email, password) {
            setLoading(true);
            limpiarError();

            try {
                var url = config.API_URL + '/auth/login';
                var res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                if (res.ok) {
                    var data = await res.json();
                    localStorage.setItem(config.TOKEN_KEY, data.token);
                    window.location.href = config.DASHBOARD_PATH;
                    return;
                }

                if (res.status === 400) {
                    var errData = await res.json().catch(function () { return {}; });
                    if (typeof errData === 'object' && errData !== null && !errData.error) {
                        mostrarErroresCampo(errData);
                    } else {
                        mostrarError('Datos inválidos. Verifique los campos.');
                    }
                    setLoading(false);
                    return;
                }

                if (res.status === 401) {
                    mostrarError('Credenciales inválidas');
                    setLoading(false);
                    return;
                }

                if (res.status === 403) {
                    var errData403 = await res.json().catch(function () { return {}; });
                    mostrarError(errData403.error || 'No tiene permisos');
                    setLoading(false);
                    return;
                }

                mostrarError('Error inesperado. Intente nuevamente.');
                setLoading(false);

            } catch (err) {
                mostrarError('Error de conexión. Verifique que el servidor esté funcionando.');
                setLoading(false);
            }
        }

        function escapeHtml(str) {
            var div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    }

    // Redirección si ya está logueado
    if (localStorage.getItem(config.TOKEN_KEY)) {
        window.location.href = config.DASHBOARD_PATH;
    }
})();
