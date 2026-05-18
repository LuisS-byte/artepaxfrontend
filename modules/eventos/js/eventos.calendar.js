(function () {
    let _calAnio = new Date().getFullYear();
    let _calMes  = new Date().getMonth();
    let _calDatosActuales = [];

    function cambiarVista(vista) {
        const sLista = document.getElementById('vista-lista');
        const sCal   = document.getElementById('vista-calendario');
        const tLista = document.getElementById('tab-lista');
        const tCal   = document.getElementById('tab-calendario');

        if (vista === 'lista') {
            sLista.classList.remove('hidden');
            sCal.classList.add('hidden');
            tLista.classList.add('tab-btn--active');
            tLista.setAttribute('aria-selected', 'true');
            tCal.classList.remove('tab-btn--active');
            tCal.setAttribute('aria-selected', 'false');
        } else {
            sLista.classList.add('hidden');
            sCal.classList.remove('hidden');
            tCal.classList.add('tab-btn--active');
            tCal.setAttribute('aria-selected', 'true');
            tLista.classList.remove('tab-btn--active');
            tLista.setAttribute('aria-selected', 'false');
            cargarCalendario();
        }
    }

    async function cargarCalendario() {
        const grid = document.getElementById('cal-grid');
        grid.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';
        cerrarDetalleDia();

        const inicio = new Date(_calAnio, _calMes, 1);
        const fin    = new Date(_calAnio, _calMes + 1, 0);
        const fmt = d => d.toISOString().split('T')[0];

        try {
            _calDatosActuales = await API.eventos.calendario(fmt(inicio), fmt(fin));
        } catch (err) {
            grid.innerHTML = `<div class="empty-state">Error al cargar: ${err.message}</div>`;
            mostrarAlerta('error', 'No se pudo cargar el calendario.');
            return;
        }

        actualizarTituloMes();
        renderCalendario();
    }

    function actualizarTituloMes() {
        const titulo = new Date(_calAnio, _calMes, 1)
            .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        document.getElementById('cal-mes-titulo').textContent = titulo;
    }

    function renderCalendario() {
        const grid = document.getElementById('cal-grid');
        const primerDia  = new Date(_calAnio, _calMes, 1);
        const ultimoDia  = new Date(_calAnio, _calMes + 1, 0);
        const hoy        = new Date();
        const hoyStr     = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
        let inicioOffset = (primerDia.getDay() + 6) % 7;

        const porFecha = {};
        _calDatosActuales.forEach(ev => {
            const fecha = ev.fechaEvento;
            if (!porFecha[fecha]) porFecha[fecha] = [];
            porFecha[fecha].push(ev);
        });

        let celdas = '';
        const diasMesAnterior = new Date(_calAnio, _calMes, 0).getDate();
        for (let i = inicioOffset - 1; i >= 0; i--) {
            const dia = diasMesAnterior - i;
            celdas += `<div class="cal-cel cal-cel--fuera"><div class="cal-cel-num">${dia}</div></div>`;
        }

        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            const fechaStr = `${_calAnio}-${String(_calMes + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const evsDelDia = porFecha[fechaStr] || [];
            const esHoy = fechaStr === hoyStr;
            let clases = 'cal-cel';
            if (esHoy) clases += ' cal-cel--hoy';
            if (evsDelDia.length > 0) clases += ' cal-cel--con-eventos';

            const attrs = evsDelDia.length > 0
                ? `onclick="abrirDetalleDia('${fechaStr}', ${d})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirDetalleDia('${fechaStr}',${d})}" tabindex="0" role="button"`
                : '';

            const MAX_CHIPS = 3;
            const chips = evsDelDia.slice(0, MAX_CHIPS).map(ev => {
                const estado = ev.estado || 'COTIZACION';
                const label = ev.clienteNombre || `#${ev.idEvento}`;
                return `<div class="cal-evento-chip cal-chip--${estado}" title="${escapeHtml(label)}">${escapeHtml(label)}</div>`;
            }).join('');

            const masText = evsDelDia.length > MAX_CHIPS
                ? `<div class="cal-mas">+${evsDelDia.length - MAX_CHIPS} más</div>`
                : '';

            celdas += `<div class="${clases}" ${attrs}><div class="cal-cel-num">${d}</div><div class="cal-eventos-lista">${chips}${masText}</div></div>`;
        }

        const totalCeldas = inicioOffset + ultimoDia.getDate();
        const resto = totalCeldas % 7 === 0 ? 0 : 7 - (totalCeldas % 7);
        for (let d = 1; d <= resto; d++) {
            celdas += `<div class="cal-cel cal-cel--fuera"><div class="cal-cel-num">${d}</div></div>`;
        }

        grid.innerHTML = celdas;
    }

    function abrirDetalleDia(fechaStr, numDia) {
        const evsDelDia = _calDatosActuales.filter(ev => ev.fechaEvento === fechaStr);
        if (evsDelDia.length === 0) return;

        const titulo = new Date(_calAnio, _calMes, numDia)
            .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        document.getElementById('cal-detalle-titulo').textContent = titulo;

        document.getElementById('cal-detalle-contenido').innerHTML = evsDelDia.map(ev => {
            const estado = ev.estado || 'COTIZACION';
            const hora = [ev.horaInicio, ev.horaFin].filter(Boolean).join(' - ') || '—';
            return `
                <div class="cal-detalle-evento">
                    <span class="cal-dot cal-dot--${estado}" style="margin-top:4px; flex-shrink:0"></span>
                    <div class="cal-detalle-evento-body">
                        <div class="cal-detalle-evento-titulo">${escapeHtml(ev.clienteNombre || `Evento #${ev.idEvento}`)}</div>
                        <div class="cal-detalle-evento-meta">
                            <span>${escapeHtml(ev.tipoEvento || '—')}</span>
                            <span><i data-lucide="clock"></i> ${hora}</span>
                            ${ev.ubicacion ? `<span><i data-lucide="map-pin"></i> ${escapeHtml(ev.ubicacion)}</span>` : ''}
                            <span>${modulos.badgeEstado(estado)}</span>
                        </div>
                    </div>
                </div>`;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        const panel = document.getElementById('cal-detalle-dia');
        panel.classList.remove('hidden');
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }

    function cerrarDetalleDia() {
        document.getElementById('cal-detalle-dia').classList.add('hidden');
    }

    function mesAnterior() {
        if (_calMes === 0) { _calMes = 11; _calAnio--; }
        else _calMes--;
        cargarCalendario();
    }

    function mesSiguiente() {
        if (_calMes === 11) { _calMes = 0; _calAnio++; }
        else _calMes++;
        cargarCalendario();
    }

    function irAHoy() {
        const hoy = new Date();
        _calAnio = hoy.getFullYear();
        _calMes = hoy.getMonth();
        cargarCalendario();
    }

    document.addEventListener('keydown', (e) => {
        const cel = e.target.closest('.cal-cel--con-eventos');
        if (!cel) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cel.click();
        }
    });

    window.EventosCalendar = Object.freeze({
        cambiarVista,
        cargarCalendario,
        mesAnterior,
        mesSiguiente,
        irAHoy,
        abrirDetalleDia,
        cerrarDetalleDia
    });
})();
