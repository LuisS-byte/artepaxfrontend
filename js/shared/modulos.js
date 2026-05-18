/**
 * js/shared/modulos.js
 * Utilidades CRUD genéricas para módulos frontend.
 */

window.modulos = {

  // ── RENDER TABLA GENÉRICO ───────────────────────────────
  renderTabla(datos, tbodyId, columns) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (!datos || datos.length === 0) {
      const colCount = columns.length || 1;
      tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; color:var(--text-light);">No hay registros.</td></tr>`;
      return;
    }

    tbody.innerHTML = datos.map((row, i) => {
      const cells = columns.map(col => {
        if (typeof col === 'string') {
          return `<td>${row[col] ?? '—'}</td>`;
        }
        return col.render ? col.render(row, i) : '<td>—</td>';
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
  },

  // ── FORMULARIO ─────────────────────────────────────────
  limpiarForm(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el._flatpickr) {
          el._flatpickr.clear();
        } else {
          el.value = '';
        }
      }
    });
  },

  limpiarSelect(selectId, opciones, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = placeholder
      ? `<option value="">${placeholder}</option>`
      : '';

    if (opciones && opciones.length > 0) {
      opciones.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.label;
        if (opt.dataset) {
          Object.entries(opt.dataset).forEach(([k, v]) => {
            el.dataset[k] = v;
          });
        }
        select.appendChild(el);
      });
    }
  },

  // ── MODALES / DRAWERS ───────────────────────────────────
  abrirModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;

    document.body.style.overflow = 'hidden';
    overlay._triggerEl = document.activeElement;
    overlay.classList.add('active');

    const dialog = overlay.querySelector('.modal, .drawer');
    if (dialog) {
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      const heading = dialog.querySelector('h2, h3');
      if (heading && !dialog.getAttribute('aria-labelledby')) {
        if (!heading.id) heading.id = `${overlayId}-title`;
        dialog.setAttribute('aria-labelledby', heading.id);
      }
    }

    requestAnimationFrame(() => {
      const focusable = overlay.querySelector(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    });
  },

  cerrarModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;

    overlay.classList.remove('active');
    // Solo restaurar scroll si no hay otros modales abiertos
    if (!document.querySelector('.modal-overlay.active, .drawer-overlay.active')) {
      document.body.style.overflow = '';
    }

    const trigger = overlay._triggerEl;
    if (trigger && typeof trigger.focus === 'function') {
      trigger.focus();
      overlay._triggerEl = null;
    }
  },

  toggleModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    if (overlay.classList.contains('active')) {
      this.cerrarModal(overlayId);
    } else {
      this.abrirModal(overlayId);
    }
  },

  // ── BÚSQUEDA LOCAL ─────────────────────────────────────
  bindSearch(inputId, datos, filterFn, renderFn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', function () {
      const q = this.value.toLowerCase();
      const filtrados = datos.filter(d => filterFn(d, q));
      renderFn(filtrados);
    });
  },

  // ── BADGES DE ESTADO ────────────────────────────────────
  badgeEstado(estado, map) {
    if (!map) {
      map = {
        ACTIVO: { clase: 'badge-finalizado', label: 'Activo' },
        INACTIVO: { clase: 'badge-danger', label: 'Inactivo' },
        COTIZACION: { clase: 'badge-cotizacion', label: 'Cotización' },
        PROGRAMADO: { clase: 'badge-programado', label: 'Programado' },
        CONFIRMADO: { clase: 'badge-confirmado', label: 'Confirmado' },
        EN_MONTAJE: { clase: 'badge-en-montaje', label: 'En Montaje' },
        PENDIENTE_COBRO: { clase: 'badge-pendiente-cobro', label: 'Pend. Cobro' },
        FINALIZADO: { clase: 'badge-finalizado', label: 'Finalizado' },
        CANCELACION_PENDIENTE: { clase: 'badge-cancelacion-pendiente', label: 'Canc. Pendiente' },
        CANCELADO: { clase: 'badge-danger', label: 'Cancelado' }
      };
    }
    const entry = map[estado];
    if (!entry) return estado || '—';
    return `<span class="badge ${entry.clase}">${entry.label}</span>`;
  },

  // ── CACHE DE CATÁLOGOS ──────────────────────────────────
  cache: {
    store: new Map(),

    async get(key, fetchFn, ttlMs = 5 * 60 * 1000) {
      const cached = this.store.get(key);
      const now = Date.now();

      if (cached && now - cached.timestamp < ttlMs) {
        return cached.data;
      }

      const data = await fetchFn();
      this.store.set(key, { data, timestamp: now });
      return data;
    },

    invalidate(key) {
      this.store.delete(key);
    },

    clear() {
      this.store.clear();
    }
  },

  // ── ESTADOS DE TABLA ────────────────────────────────────
  setTableLoading(tbodyId, columnas, mensaje = 'Cargando...') {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${columnas}" class="loading-state"><div class="spinner"></div> ${window.escapeHtml(mensaje)}</td></tr>`;
  },

  setTableSkeleton(tbodyId, columnas, filas = 5) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = Array.from({ length: filas }, () => `
      <tr>${'<td><div class="skeleton-bar"></div></td>'.repeat(columnas)}</tr>
    `).join('');
    tbody.innerHTML = rows;
  },

  setTableEmpty(tbodyId, columnas, mensaje = 'No hay registros.') {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${columnas}" class="empty-state">${window.escapeHtml(mensaje)}</td></tr>`;
  },

  renderEmpty(tbodyId, columnas, opts = {}) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const icon = opts.icon || 'search-x';
    const title = opts.title || 'Sin resultados';
    const message = opts.message || '';
    tbody.innerHTML = `
      <tr><td colspan="${columnas}">
        <div class="empty-state-card">
          <div class="empty-icon"><i data-lucide="${icon}"></i></div>
          <h3>${window.escapeHtml(title)}</h3>
          ${message ? `<p>${window.escapeHtml(message)}</p>` : ''}
        </div>
      </td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  setTableError(tbodyId, columnas, mensaje = 'No se pudieron cargar los datos.') {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${columnas}" class="error-state">${window.escapeHtml(mensaje)}</td></tr>`;
  },

  // ── CRONOGRAMA ──────────────────────────────────────────
  formatearFecha(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' });
  },

  toDatetimeLocal(str) {
    if (!str) return '';
    return str.substring(0, 16);
  },

  // ── PAGINACIÓN ──────────────────────────────────────────
  renderPaginacion({ containerId, page, totalPages, totalElements, onPageChange }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const hayAnterior = page > 0;
    const haySiguiente = totalPages != null
      ? page < totalPages - 1
      : true;

    const infoTexto = totalElements != null
      ? `Página ${page + 1}${totalPages ? ' de ' + totalPages : ''} — ${totalElements} registros`
      : `Página ${page + 1}`;

    container.innerHTML = `
      <div class="pagination">
        <button class="btn btn-secondary btn-sm" data-page="${page - 1}" ${hayAnterior ? '' : 'disabled'}>
          Anterior
        </button>
        <span class="pagination-info">${infoTexto}</span>
        <button class="btn btn-secondary btn-sm" data-page="${page + 1}" ${haySiguiente ? '' : 'disabled'}>
          Siguiente
        </button>
      </div>`;

    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = Number(btn.dataset.page);
        onPageChange(next);
      });
    });
  },

  // ── FLATPICKR (UX CALENDARIOS) ──────────────────────────
  initFechas() {
    if (typeof flatpickr === 'undefined') return;
    
    const localeEs = window.flatpickr.l10ns ? window.flatpickr.l10ns.es : null;

    // Inputs de solo fecha (Filtros, Fecha de Evento)
    flatpickr('.date-picker', {
      locale: localeEs,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "j F, Y",
      allowInput: false,
      disableMobile: true,
      onChange: function(selectedDates, dateStr, instance) {
        // Disparar evento change nativo para que onchange="cargarDatos()" de los filtros funcione
        instance.element.dispatchEvent(new Event('change', { 'bubbles': true }));
      }
    });

    // Inputs de solo hora (Hora Inicio, Hora Fin en Eventos)
    flatpickr('.time-picker', {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: false, // Solicitado por el usuario: AM/PM
      onChange: function(selectedDates, dateStr, instance) {
        instance.element.dispatchEvent(new Event('change', { 'bubbles': true }));
      }
    });

    // Inputs de Fecha y Hora (Cronograma Modal)
    flatpickr('.datetime-picker', {
      enableTime: true,
      locale: localeEs,
      dateFormat: "Y-m-d H:i",
      altInput: true,
      altFormat: "j F, Y h:i K", // Formato AM/PM visible
      time_24hr: false, // AM/PM
      onChange: function(selectedDates, dateStr, instance) {
        instance.element.dispatchEvent(new Event('change', { 'bubbles': true }));
      }
    });
  }

}; // fin window.modulos

// ── ESCAPE GLOBAL ─────────────────────────────────────────
// Cierra el diálogo activo más reciente al presionar Escape.
document.addEventListener('keydown', function escapeHandler(e) {
  if (e.key !== 'Escape') return;
  const activos = document.querySelectorAll('.modal-overlay.active, .drawer-overlay.active');
  if (!activos.length) return;
  const ultimo = activos[activos.length - 1];
  if (ultimo?.id) modulos.cerrarModal(ultimo.id);
});
