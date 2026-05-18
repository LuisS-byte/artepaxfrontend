(function () {
    const config = window.APP_CONFIG;

    window.requireAuth = function requireAuth() {
        if (!localStorage.getItem(config.TOKEN_KEY)) {
            window.location.href = config.LOGIN_PATH;
        }
    };

    window.logout = function logout() {
        localStorage.removeItem(config.TOKEN_KEY);
        window.location.href = config.LOGIN_PATH;
    };
})();
