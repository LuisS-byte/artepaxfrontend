/**
 * modules/configuracion/js/configuracion.meta.js
 * Metadatos de configuración — claves, UI, categorías.
 */
(function () {
    'use strict';

    const CLAVES_CONFIGURACION = [
        'PORCENTAJE_ANTICIPO_MINIMO',
        'TIEMPO_GRACIA_CANCELACION_MINUTOS',
        'POLITICA_CANCELACION_MONTAJE',
        'PORCENTAJE_STOCK_MINIMO_GLOBAL',
        'DIAS_EXPIRACION_COTIZACION',
        'MINUTOS_GAP_ENTRE_EVENTOS',
        'INSTRUCCIONES_PAGO',
        'NEGOCIO_NOMBRE',
        'NEGOCIO_CORREO',
        'NEGOCIO_TELEFONO',
        'DIAS_AVISO_SALDO_PENDIENTE',
        'DIAS_RECORDATORIO_EVENTO'
    ];

    const CONFIG_UI = {
        PORCENTAJE_ANTICIPO_MINIMO: {
            label: 'Anticipo mínimo',
            hint: 'Porcentaje mínimo del precio total requerido como anticipo para confirmar un evento',
            icon: 'percent',
            categoria: 'financiera',
            unidad: '%',
            inputType: 'number',
            min: 0,
            max: 100
        },
        DIAS_EXPIRACION_COTIZACION: {
            label: 'Expiración de cotización',
            hint: 'Días máximos que una cotización puede estar sin avanzar antes de notificar o archivar',
            icon: 'clock',
            categoria: 'financiera',
            unidad: 'días',
            inputType: 'number',
            min: 1
        },
        PORCENTAJE_STOCK_MINIMO_GLOBAL: {
            label: 'Stock mínimo global',
            hint: 'Porcentaje sobre cantidad total usado como stock mínimo cuando el producto no tiene uno definido',
            icon: 'package',
            categoria: 'financiera',
            unidad: '%',
            inputType: 'number',
            min: 0,
            max: 100
        },
        TIEMPO_GRACIA_CANCELACION_MINUTOS: {
            label: 'Tiempo de gracia',
            hint: 'Minutos que tiene el admin para revertir una cancelación antes de que se ejecuten los efectos en cascada',
            icon: 'timer',
            categoria: 'cancelacion',
            unidad: 'min',
            inputType: 'number',
            min: 1
        },
        POLITICA_CANCELACION_MONTAJE: {
            label: 'Cancelación en montaje',
            hint: 'Qué hacer con los pagos al cancelar un evento que ya está en montaje',
            icon: 'alert-triangle',
            categoria: 'cancelacion',
            inputType: 'select',
            opciones: [
                { value: 'RETENER_ANTICIPO', label: 'Retener anticipo' },
                { value: 'DEVOLVER_TODO', label: 'Devolver todo' }
            ]
        },
        MINUTOS_GAP_ENTRE_EVENTOS: {
            label: 'GAP entre eventos',
            hint: 'Minutos de separación obligatoria entre eventos en la misma ubicación para despeje y montaje',
            icon: 'calendar-range',
            categoria: 'operativa',
            unidad: 'min',
            inputType: 'number',
            min: 0
        },
        INSTRUCCIONES_PAGO: {
            label: 'Instrucciones de pago',
            hint: 'Texto instructivo general de pago usado en documentos y comunicaciones al cliente',
            icon: 'credit-card',
            categoria: 'financiera',
            inputType: 'textarea'
        },
        NEGOCIO_NOMBRE: {
            label: 'Nombre del negocio',
            hint: 'Aparece en documentos y notificaciones generadas',
            icon: 'building-2',
            categoria: 'negocio',
            inputType: 'text'
        },
        NEGOCIO_CORREO: {
            label: 'Correo del negocio',
            hint: 'Correo remitente para envío de documentos y notificaciones al cliente',
            icon: 'mail',
            categoria: 'negocio',
            inputType: 'email'
        },
        NEGOCIO_TELEFONO: {
            label: 'Teléfono del negocio',
            hint: 'Teléfono de contacto incluido en documentos generados',
            icon: 'phone',
            categoria: 'negocio',
            inputType: 'tel'
        },
        DIAS_AVISO_SALDO_PENDIENTE: {
            label: 'Aviso de saldo pendiente',
            hint: 'Días de anticipación para alertar al cliente sobre saldo pendiente',
            icon: 'alert-circle',
            categoria: 'notificaciones',
            unidad: 'días',
            inputType: 'number',
            min: 1
        },
        DIAS_RECORDATORIO_EVENTO: {
            label: 'Recordatorio de evento',
            hint: 'Días de anticipación para enviar recordatorio del evento al cliente',
            icon: 'bell',
            categoria: 'notificaciones',
            unidad: 'días',
            inputType: 'number',
            min: 1
        }
    };

    const CATEGORIAS = {
        financiera: { label: 'Financiera', icon: 'wallet' },
        cancelacion: { label: 'Cancelación', icon: 'x-circle' },
        negocio: { label: 'Datos del Negocio', icon: 'building-2' },
        operativa: { label: 'Operativa', icon: 'calendar-check' },
        notificaciones: { label: 'Notificaciones', icon: 'bell' },
        otros: { label: 'Otras configuraciones', icon: 'settings' }
    };

    window.ConfiguracionMeta = {
        CLAVES_CONFIGURACION,
        CONFIG_UI,
        CATEGORIAS
    };
})();
