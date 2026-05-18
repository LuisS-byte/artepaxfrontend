/**
 * modules/documentos/js/documentos.editor.js
 * Editor de plantillas — Campos editables (primario), vista previa, Quill técnico (secundario).
 * Fase 4 — Separación desde documentos.js monolítico + mejora UX camposEditables.
 */
(function () {
    'use strict';

    // =========================================================================
    //   ESQUEMA camposEditables — definiciones por tipo documental
    // =========================================================================

    const CAMPOS_POR_TIPO = {
        COTIZACION_EVENTO: [
            { clave: 'encabezado',     etiqueta: 'Encabezado del documento',          tipo: 'texto_corto', valor: 'Cotización del Evento' },
            { clave: 'numero_referencia', etiqueta: 'Número de referencia',            tipo: 'texto_corto', valor: 'COT-{{numero}}' },
            { clave: 'saludo',         etiqueta: 'Saludo al cliente',                  tipo: 'texto_corto', valor: 'Estimado/a {{cliente_nombre}},' },
            { clave: 'cuerpo',         etiqueta: 'Cuerpo del documento',               tipo: 'texto_largo', valor: 'Adjuntamos la cotización de su {{tipo_evento}} programado para el {{fecha_evento}} de {{hora_inicio}} a {{hora_fin}} en {{ubicacion}}.\n\nDecoración seleccionada: {{decoracion}}\n\nPrecio total: ${{precio_total}}' },
            { clave: 'despedida',      etiqueta: 'Despedida',                          tipo: 'texto_largo', valor: 'Quedamos a su disposición para cualquier consulta.\n\nSaludos cordiales,\nArtepax Fiesta' },
            { clave: 'notas',          etiqueta: 'Notas y condiciones',                tipo: 'texto_largo', valor: '{{condiciones_cancelacion}}' }
        ],
        CONFIRMACION_RESERVA: [
            { clave: 'encabezado',     etiqueta: 'Encabezado del documento',          tipo: 'texto_corto', valor: 'Confirmación de Reserva' },
            { clave: 'numero_referencia', etiqueta: 'Número de referencia',            tipo: 'texto_corto', valor: 'CONF-{{numero}}' },
            { clave: 'saludo',         etiqueta: 'Saludo al cliente',                  tipo: 'texto_corto', valor: 'Estimado/a {{cliente_nombre}},' },
            { clave: 'cuerpo',         etiqueta: 'Cuerpo del documento',               tipo: 'texto_largo', valor: 'Nos complace confirmar la reserva de su {{tipo_evento}} para el {{fecha_evento}} de {{hora_inicio}} a {{hora_fin}} en {{ubicacion}}.\n\nDetalles del evento:\n- Decoración: {{decoracion}}\n- Precio total: ${{precio_total}}' },
            { clave: 'despedida',      etiqueta: 'Despedida',                          tipo: 'texto_largo', valor: 'Ante cualquier modificación, no dude en contactarnos.\n\nSaludos cordiales,\nArtepax Fiesta' },
            { clave: 'notas',          etiqueta: 'Notas y condiciones',                tipo: 'texto_largo', valor: '{{condiciones_cancelacion}}' }
        ],
        AVISO_SALDO_PENDIENTE: [
            { clave: 'encabezado',     etiqueta: 'Encabezado del documento',          tipo: 'texto_corto', valor: 'Aviso de Saldo Pendiente' },
            { clave: 'numero_referencia', etiqueta: 'Número de referencia',            tipo: 'texto_corto', valor: 'AVS-{{numero}}' },
            { clave: 'saludo',         etiqueta: 'Saludo al cliente',                  tipo: 'texto_corto', valor: 'Estimado/a {{cliente_nombre}},' },
            { clave: 'cuerpo',         etiqueta: 'Cuerpo del documento',               tipo: 'texto_largo', valor: 'Le recordamos que su evento {{tipo_evento}} del {{fecha_evento}} tiene un saldo pendiente de ${{precio_total}}.\n\nLe solicitamos realizar el pago a la brevedad para evitar contratiempos.' },
            { clave: 'instrucciones',  etiqueta: 'Instrucciones de pago',              tipo: 'texto_largo', valor: 'Puede abonar mediante transferencia bancaria o en nuestras oficinas.\n\nDatos bancarios:\nBanco: ...\nCBU: ...\nTitular: Artepax Fiesta' },
            { clave: 'despedida',      etiqueta: 'Despedida',                          tipo: 'texto_largo', valor: 'Ante cualquier consulta, no dude en comunicarse.\n\nSaludos cordiales,\nArtepax Fiesta' }
        ]
    };

    // Default genérico si no hay definición específica
    const CAMPOS_GENERICOS = [
        { clave: 'encabezado',  etiqueta: 'Encabezado del documento', tipo: 'texto_corto', valor: 'Documento' },
        { clave: 'saludo',      etiqueta: 'Saludo al cliente',        tipo: 'texto_corto', valor: 'Estimado/a {{cliente_nombre}},' },
        { clave: 'cuerpo',      etiqueta: 'Cuerpo del documento',     tipo: 'texto_largo', valor: 'Detalles del evento {{tipo_evento}} - {{fecha_evento}}.' },
        { clave: 'despedida',   etiqueta: 'Despedida',                tipo: 'texto_largo', valor: 'Saludos cordiales,\nArtepax Fiesta' }
    ];

    // Placeholders disponibles agrupados para los chips
    const TODOS_PLACEHOLDERS = {
        '{{negocio_nombre}}': 'Nombre del negocio',
        '{{cliente_nombre}}': 'Nombre del cliente',
        '{{tipo_evento}}': 'Tipo de evento',
        '{{fecha_evento}}': 'Fecha del evento',
        '{{hora_inicio}}': 'Hora de inicio',
        '{{hora_fin}}': 'Hora de fin',
        '{{ubicacion}}': 'Ubicación',
        '{{decoracion}}': 'Decoración',
        '{{precio_total}}': 'Precio total',
        '{{fecha_generacion}}': 'Fecha de generación',
        '{{condiciones_cancelacion}}': 'Condiciones de cancelación',
        '{{numero}}': 'Número de documento'
    };

    // Datos simulados para vista previa
    const MOCK_PLACEHOLDERS = {
        '{{negocio_nombre}}': 'Artepax Fiesta',
        '{{cliente_nombre}}': 'María García',
        '{{tipo_evento}}': 'Casamiento',
        '{{fecha_evento}}': '15/12/2026',
        '{{hora_inicio}}': '18:00',
        '{{hora_fin}}': '02:00',
        '{{ubicacion}}': 'Salón Los Olivos, Av. Principal 1234',
        '{{decoracion}}': 'Estilo romántico con rosas blancas',
        '{{precio_total}}': '450.000',
        '{{fecha_generacion}}': '17/05/2026',
        '{{condiciones_cancelacion}}': 'Cancelación con más de 30 días: sin cargo. Entre 15 y 30 días: 50% del valor. Menos de 15 días: no aplica devolución.',
        '{{numero}}': '001'
    };

    // Placeholders permitidos por campo (heurística por clave de campo)
    const PLACEHOLDERS_POR_CLAVE = {
        encabezado:         ['{{negocio_nombre}}'],
        numero_referencia:  ['{{numero}}'],
        saludo:             ['{{cliente_nombre}}'],
        cuerpo:             ['{{tipo_evento}}', '{{fecha_evento}}', '{{hora_inicio}}', '{{hora_fin}}', '{{ubicacion}}', '{{decoracion}}', '{{precio_total}}', '{{cliente_nombre}}', '{{negocio_nombre}}'],
        despedida:          ['{{negocio_nombre}}'],
        notas:              ['{{condiciones_cancelacion}}', '{{fecha_generacion}}'],
        instrucciones:      ['{{negocio_nombre}}', '{{precio_total}}', '{{fecha_evento}}']
    };

    const TIPOS_CRITICOS = new Set([
        'COTIZACION_EVENTO',
        'CONFIRMACION_RESERVA',
        'AVISO_SALDO_PENDIENTE'
    ]);

    // =========================================================================
    //   Helpers
    // =========================================================================

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function reemplazarPlaceholdersMock(texto) {
        if (!texto) return '';
        let result = String(texto);
        Object.entries(MOCK_PLACEHOLDERS).forEach(([ph, val]) => {
            result = result.replaceAll(ph, val);
        });
        return result;
    }

    function reemplazarPlaceholdersHtml(texto) {
        const reemplazado = reemplazarPlaceholdersMock(texto);
        return escapeHtml(reemplazado).replace(/\n/g, '<br>');
    }

    function normalizarValorCampo(valor) {
        return escapeHtml(valor || '').replace(/\n/g, '<br>');
    }

    function parsearCamposEditables(camposEditables) {
        if (Array.isArray(camposEditables)) return camposEditables;
        if (typeof camposEditables !== 'string') return null;

        const raw = camposEditables.trim();
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Genera contenidoBase HTML desde un array de campos editables.
     */
    function generarContenidoBaseDesdeCampos(campos) {
        if (!Array.isArray(campos) || campos.length === 0) return '<p></p>';

        const mapaRender = {
            encabezado: v => `<h2 style="color:#7d1622; text-align:center; margin-bottom:0.5rem;">${normalizarValorCampo(v)}</h2>`,
            numero_referencia: v => `<p style="font-size:0.85rem; color:#666; text-align:right;">Ref: ${normalizarValorCampo(v)}</p>`,
            saludo: v => `<p>${normalizarValorCampo(v)}</p>`,
            cuerpo: v => `<p>${normalizarValorCampo(v)}</p>`,
            despedida: v => `<p>${normalizarValorCampo(v)}</p>`,
            notas: v => v ? `<hr><p><em>${normalizarValorCampo(v)}</em></p>` : '',
            instrucciones: v => `<div style="background:#f9f9f9; padding:1rem; border-radius:8px; margin:0.5rem 0;"><p>${normalizarValorCampo(v)}</p></div>`
        };

        return campos.map(c => {
            const fn = mapaRender[c.clave];
            return fn ? fn(c.valor || '') : `<p>${normalizarValorCampo(c.valor || '')}</p>`;
        }).filter(Boolean).join('\n');
    }

    /**
     * Obtiene campos editables por defecto para un tipo documental.
     */
    function obtenerCamposDefault(tipoDocumento) {
        const campos = CAMPOS_POR_TIPO[tipoDocumento];
        if (campos) {
            return campos.map(c => ({ ...c, valor: c.valor }));
        }
        return CAMPOS_GENERICOS.map(c => ({ ...c, valor: c.valor }));
    }

    /**
     * Valida y normaliza camposEditables desde backend.
     * Si viene vacío/inválido, genera defaults.
     */
    function normalizarCamposEditables(camposEditables, tipoDocumento) {
        const camposNormalizados = parsearCamposEditables(camposEditables);

        if (Array.isArray(camposNormalizados) && camposNormalizados.length > 0) {
            // Asegurar que cada campo tenga las propiedades mínimas
            return camposNormalizados.map(c => ({
                clave: c.clave || 'campo_' + Math.random().toString(36).slice(2, 6),
                etiqueta: c.etiqueta || c.clave || 'Campo',
                tipo: c.tipo || 'texto_corto',
                valor: typeof c.valor === 'string' ? c.valor : ''
            }));
        }
        return obtenerCamposDefault(tipoDocumento);
    }

    // =========================================================================
    //   Render de campos editables en el DOM
    // =========================================================================

    function renderCamposEditables(campos) {
        const container = document.getElementById('campos-editables-container');
        if (!container) return;

        container.innerHTML = campos.map((campo, index) => {
            const phDisponibles = PLACEHOLDERS_POR_CLAVE[campo.clave] || Object.keys(TODOS_PLACEHOLDERS);
            const chipsHtml = phDisponibles.map(ph => {
                const label = TODOS_PLACEHOLDERS[ph] || ph;
                return `<button type="button" class="placeholder-btn campo-chip" data-campo="${campo.clave}" data-placeholder="${ph}" title="Insertar ${label}">${ph}</button>`;
            }).join('');

            const inputId = `campo-${campo.clave}-${index}`;
            const esLargo = campo.tipo === 'texto_largo';

            return `
                <div class="campo-editable" data-clave="${campo.clave}">
                    <label class="campo-editable-label" for="${inputId}">${escapeHtml(campo.etiqueta)}</label>
                    ${esLargo
                        ? `<textarea id="${inputId}" class="campo-editable-textarea" rows="4" placeholder="${escapeHtml(campo.etiqueta)}">${escapeHtml(campo.valor)}</textarea>`
                        : `<input id="${inputId}" type="text" class="campo-editable-input" value="${escapeHtml(campo.valor)}" placeholder="${escapeHtml(campo.etiqueta)}">`
                    }
                    <div class="campo-editable-chips" data-campo="${campo.clave}">
                        ${chipsHtml}
                    </div>
                </div>`;
        }).join('');

        // Bindear eventos a chips dentro del contenedor
        container.querySelectorAll('.campo-chip').forEach(btn => {
            btn.addEventListener('click', function () {
                const campoClave = this.dataset.campo;
                const placeholder = this.dataset.placeholder;
                const fieldIndex = campos.findIndex(c => c.clave === campoClave);
                if (fieldIndex === -1) return;

                const inputId = `campo-${campoClave}-${fieldIndex}`;
                const input = document.getElementById(inputId);
                if (!input) return;

                const cursorPos = input.selectionStart || input.value.length;
                const before = input.value.slice(0, cursorPos);
                const after = input.value.slice(cursorPos);
                input.value = before + placeholder + after;
                input.focus();
                input.selectionStart = input.selectionEnd = cursorPos + placeholder.length;

                // Marcar formulario como modificado
                DocumentosState.formularioModificado = true;
            });
        });

        // Detectar cambios en tiempo real
        container.querySelectorAll('.campo-editable-input, .campo-editable-textarea').forEach(el => {
            el.addEventListener('input', function () {
                DocumentosState.formularioModificado = true;
            });
        });
    }

    /**
     * Lee los valores actuales del DOM y devuelve array de campos actualizado.
     */
    function leerCamposDelDOM() {
        const campos = DocumentosState.camposEditablesActuales;
        if (!Array.isArray(campos)) return [];

        return campos.map((campo, index) => {
            const inputId = `campo-${campo.clave}-${index}`;
            const input = document.getElementById(inputId);
            return {
                ...campo,
                valor: input ? input.value : campo.valor
            };
        });
    }

    // =========================================================================
    //   Vista previa
    // =========================================================================

    function generarVistaPrevia() {
        const previewContainer = document.getElementById('preview-contenido');
        if (!previewContainer) return;

        const campos = leerCamposDelDOM();
        let html = generarContenidoBaseDesdeCampos(campos);

        // Reemplazar placeholders con datos mock
        html = html.replace(/{{(\w+)}}/g, (match) => {
            return MOCK_PLACEHOLDERS[match] || match;
        });

        // Envolver en HTML básico para estilos
        previewContainer.innerHTML = `
            <div class="preview-paper">
                ${html}
            </div>`;
    }

    // =========================================================================
    //   Quill
    // =========================================================================

    function initQuill() {
        if (DocumentosState.quillEditor) return;
        DocumentosState.quillEditor = new Quill('#plantilla-editor', {
            theme: 'snow',
            placeholder: 'Escribe el contenido de la plantilla. Usa los botones de arriba para insertar campos dinámicos.',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ align: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ color: [] }, { background: [] }],
                    ['link'],
                    ['clean']
                ]
            }
        });

        DocumentosState.quillEditor.on('text-change', () => {
            DocumentosState.formularioModificado = true;
        });
    }

    function insertarPlaceholder(placeholder) {
        if (!DocumentosState.quillEditor) return;
        const range = DocumentosState.quillEditor.getSelection(true);
        DocumentosState.quillEditor.insertText(range.index, placeholder, 'user');
        DocumentosState.quillEditor.setSelection(range.index + placeholder.length);
    }

    // =========================================================================
    //   Cambio de modo editor
    // =========================================================================

    function cambiarModoEditor(modo) {
        DocumentosState.modoEditorActual = modo;

        // Actualizar tabs
        document.querySelectorAll('.editor-mode-btn').forEach(btn => {
            const isActive = btn.dataset.mode === modo;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });

        // Mostrar/ocultar paneles
        ['campos', 'preview', 'tecnico'].forEach(p => {
            const panel = document.getElementById('editor-' + p);
            if (panel) panel.classList.toggle('hidden', p !== modo);
        });

        // Si vamos a preview, regenerar
        if (modo === 'preview') {
            generarVistaPrevia();
        }
    }

    // =========================================================================
    //   Carga y edición de plantillas
    // =========================================================================

    async function abrirEditarPlantilla(id) {
        try {
            DocumentosState.plantillaEditando = await DocumentosAPI.obtenerPlantilla(id);
            const plantilla = DocumentosState.plantillaEditando;

            document.getElementById('plantilla-tipo').textContent = plantilla.tipoDocumento;
            document.getElementById('plantilla-activo').checked = !!plantilla.activo;

            // Inicializar camposEditables
            const campos = normalizarCamposEditables(plantilla.camposEditables, plantilla.tipoDocumento);
            DocumentosState.camposEditablesActuales = campos;

            // Abrir modal y renderizar campos
            modulos.abrirModal('modal-plantilla');
            DocumentosState.modoEditorActual = 'campos';
            cambiarModoEditor('campos');
            renderCamposEditables(campos);

            // Inicializar Quill (técnico) con el contenidoBase
            initQuill();
            DocumentosState.quillEditor.clipboard.dangerouslyPasteHTML(plantilla.contenidoBase || '<p></p>');

            setTimeout(() => {
                DocumentosState.formularioModificado = false;
            }, 150);

            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        } catch (err) {
            mostrarAlerta('error', 'Error al cargar plantilla: ' + err.message);
        }
    }

    function cerrarModalPlantilla() {
        if (DocumentosState.formularioModificado) {
            modulos.abrirModal('modal-descartar-cambios');
            return;
        }
        limpiarEstadoEditor();
        modulos.cerrarModal('modal-plantilla');
    }

    function limpiarEstadoEditor() {
        DocumentosState.plantillaEditando = null;
        DocumentosState.camposEditablesActuales = null;
        DocumentosState.formularioModificado = false;
        DocumentosState.modoEditorActual = 'campos';
    }

    function confirmarDescartePlantilla() {
        modulos.cerrarModal('modal-descartar-cambios');
        DocumentosState.formularioModificado = false;
        cerrarModalPlantilla();
    }

    function cancelarDescartePlantilla() {
        modulos.cerrarModal('modal-descartar-cambios');
    }

    // =========================================================================
    //   Manejo de desactivación de plantilla crítica
    // =========================================================================

    let desactivacionPendiente = false;

    function manejarToggleActivo() {
        const checkbox = document.getElementById('plantilla-activo');
        if (!checkbox) return;

        // Si está desmarcando (desactivando) y la plantilla está actualmente activa
        if (!checkbox.checked && DocumentosState.plantillaEditando?.activo && TIPOS_CRITICOS.has(DocumentosState.plantillaEditando?.tipoDocumento)) {
            // Mostrar advertencia
            desactivacionPendiente = true;
            modulos.abrirModal('modal-desactivar-plantilla');
            // No cambiar el checkbox aún — si confirma se desmarca, si cancela se vuelve a marcar
            checkbox.checked = true;
        }
    }

    function confirmarDesactivarPlantilla() {
        modulos.cerrarModal('modal-desactivar-plantilla');
        const checkbox = document.getElementById('plantilla-activo');
        if (checkbox) {
            checkbox.checked = false;
            DocumentosState.formularioModificado = true;
        }
        desactivacionPendiente = false;
    }

    function cancelarDesactivarPlantilla() {
        modulos.cerrarModal('modal-desactivar-plantilla');
        desactivacionPendiente = false;
    }

    // =========================================================================
    //   Guardado
    // =========================================================================

    async function guardarPlantilla() {
        if (!DocumentosState.plantillaEditando) return;
        const btn = document.getElementById('btn-guardar-plantilla');
        btn.disabled = true;

        try {
            const activo = document.getElementById('plantilla-activo').checked;
            let contenidoBase;
            let camposEditables;

            if (DocumentosState.modoEditorActual === 'tecnico' && DocumentosState.quillEditor) {
                // Modo técnico: tomar HTML del Quill, regenerar campos desde HTML (no podemos revertir bien)
                contenidoBase = DocumentosState.quillEditor.root.innerHTML.trim();
                if (!contenidoBase || contenidoBase === '<p><br></p>') {
                    mostrarAlerta('error', 'El contenido HTML de la plantilla no puede estar vacío.');
                    btn.disabled = false;
                    return;
                }
                // En modo técnico, preservar camposEditables actuales pero actualizar contenidoBase
                camposEditables = DocumentosState.camposEditablesActuales;
            } else {
                // Modo campos o preview: leer campos del DOM y generar contenidoBase
                camposEditables = leerCamposDelDOM();
                DocumentosState.camposEditablesActuales = camposEditables;
                contenidoBase = generarContenidoBaseDesdeCampos(camposEditables);

                if (!contenidoBase || contenidoBase === '<p></p>') {
                    mostrarAlerta('error', 'Los campos de la plantilla no pueden estar vacíos.');
                    btn.disabled = false;
                    return;
                }

                // Sincronizar Quill con el nuevo contenidoBase (por si cambia a modo técnico después)
                if (DocumentosState.quillEditor) {
                    DocumentosState.quillEditor.clipboard.dangerouslyPasteHTML(contenidoBase);
                }
            }

            await DocumentosAPI.actualizarPlantilla(DocumentosState.plantillaEditando.idPlantilla, {
                contenidoBase,
                camposEditables: JSON.stringify(camposEditables),
                activo
            });

            DocumentosState.formularioModificado = false;
            mostrarAlerta('success', 'Plantilla actualizada correctamente.');
            limpiarEstadoEditor();
            modulos.cerrarModal('modal-plantilla');
            cargarPlantillas();
        } catch (err) {
            mostrarAlerta('error', 'Error al guardar plantilla: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    }

    // =========================================================================
    //   Inicialización: bindear evento al checkbox de activo
    // =========================================================================

    function initEditorEvents() {
        const checkbox = document.getElementById('plantilla-activo');
        if (checkbox) {
            checkbox.addEventListener('change', manejarToggleActivo);
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditorEvents);
    } else {
        initEditorEvents();
    }

    // =========================================================================
    //   Namespace + window.* exports para handlers inline
    // =========================================================================

    window.DocumentosEditor = {
        initQuill,
        insertarPlaceholder,
        abrirEditarPlantilla,
        cerrarModalPlantilla,
        guardarPlantilla,
        confirmarDescartePlantilla,
        cancelarDescartePlantilla,
        cambiarModoEditor,
        generarVistaPrevia,
        confirmarDesactivarPlantilla,
        cancelarDesactivarPlantilla,
        // Helpers públicos (para debugging o tests manuales)
        generarContenidoBaseDesdeCampos,
        obtenerCamposDefault,
        normalizarCamposEditables
    };

    window.insertarPlaceholder = insertarPlaceholder;
    window.cerrarModalPlantilla = cerrarModalPlantilla;
    window.guardarPlantilla = guardarPlantilla;
    window.abrirEditarPlantilla = abrirEditarPlantilla;
    window.confirmarDescartePlantilla = confirmarDescartePlantilla;
    window.cancelarDescartePlantilla = cancelarDescartePlantilla;
    window.cambiarModoEditor = cambiarModoEditor;
    window.confirmarDesactivarPlantilla = confirmarDesactivarPlantilla;
    window.cancelarDesactivarPlantilla = cancelarDesactivarPlantilla;
})();
