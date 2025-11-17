// ==UserScript==
// @name         shur2text - Forocoches Helper
// @namespace    https://github.com/MateoPalmeiro/shur2text
// @version      0.0.2
// @description  Popup flotante con editor de texto para Forocoches: BBCode, movible, minimizable y con posicion recordada.
// @author       MateoPalmeiro
// @match        https://forocoches.com/foro/*
// @run-at       document-end
// @noframes
// @license      MIT
// @downloadURL  https://github.com/MateoPalmeiro/shur2text/raw/main/shur2text.user.js
// @updateURL    https://github.com/MateoPalmeiro/shur2text/raw/main/shur2text.user.js
// ==/UserScript==

(function() {
    'use strict';

    // No ejecutar dentro de iframes (por si acaso, aunque @noframes ya lo evita)
    if (window.top !== window.self) {
        return;
    }

    // Claves de localStorage para guardar posicion y estado minimizado
    var STORAGE_KEY_POS = 'fc_popup_pos_v1';
    var STORAGE_KEY_MIN = 'fc_popup_min_v1';

    // ------------------------------------------------------------
    // Utilidad: limpiar copias fantasma del popup dentro del iframe
    // (Forocoches mete el editor en un iframe y a veces clona cosas)
    // ------------------------------------------------------------
    function setupIframeCleaner() {
        var iframe = document.getElementById('vB_Editor_QR_iframe');
        if (!iframe) return;

        var removeDup = function() {
            var doc;
            try {
                doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            } catch (e) {
                // Si el navegador no deja tocar el iframe, paso
                return;
            }
            if (!doc) return;

            var ghost = doc.getElementById('fc-helper-popup');
            if (ghost && ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
            }
        };

        // Limpiar cuando el iframe cargue
        iframe.addEventListener('load', removeDup);

        // Limpiar ahora por si ya está cargado
        removeDup();

        // Y cada X tiempo, por si FC hace cosas raras
        var intervalId = setInterval(function() {
            if (!document.body.contains(iframe)) {
                clearInterval(intervalId);
                return;
            }
            removeDup();
        }, 1500);
    }

    // ------------------------------------------------------------
    // Utilidad: insertar texto en el editor de respuesta rapida
    // Soporta tanto el modo WYSIWYG (iframe) como el textarea plano
    // ------------------------------------------------------------
    function insertIntoEditor(text) {
        var iframe = document.getElementById('vB_Editor_QR_iframe');
        var textarea = document.getElementById('vB_Editor_QR_textarea');

        if (!iframe && !textarea) {
            alert('No se ha encontrado el editor de respuesta rapida.');
            return;
        }

        // Si existe iframe con document.body, intentamos WYSIWYG
        if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
            var body = iframe.contentDocument.body;

            try {
                iframe.contentWindow.focus();

                if (iframe.contentDocument.execCommand) {
                    // insertText respeta la posicion del cursor, si la hay
                    var toInsert = (body.innerHTML.trim() ? '\n' : '') + text;
                    iframe.contentDocument.execCommand('insertText', false, toInsert);
                } else {
                    // Fallback tonto: añadimos al final
                    var extra = (body.innerHTML.trim() ? '\n' : '') + text;
                    var escaped = extra
                        .split('\n')
                        .map(function(line) {
                            return line === '' ? '<br>' : line.replace(/</g, '&lt;');
                        })
                        .join('<br>');
                    body.innerHTML += escaped;
                }
            } catch (e) {
                // Si peta algo en el iframe, probamos el fallback
                console.error('Error insertando en iframe, usando fallback:', e);
                var extra2 = (body.innerHTML.trim() ? '\n' : '') + text;
                var escaped2 = extra2
                    .split('\n')
                    .map(function(line) {
                        return line === '' ? '<br>' : line.replace(/</g, '&lt;');
                    })
                    .join('<br>');
                body.innerHTML += escaped2;
            }

            // Si existe textarea oculto, lo sincronizamos por si acaso
            if (textarea) {
                var current = textarea.value || '';
                textarea.value = current + (current ? '\n' : '') + text;
            }

            return;
        }

        // Si no hay iframe o no va, usamos el textarea clasico
        if (textarea) {
            var current2 = textarea.value || '';
            textarea.value = current2 + (current2 ? '\n' : '') + text;
            textarea.focus();
            return;
        }

        alert('No se pudo insertar en el editor.');
    }

    // ------------------------------------------------------------
    // Creacion del popup principal
    // ------------------------------------------------------------
    function createPopup() {
        // No crear dos veces
        if (document.getElementById('fc-helper-popup')) {
            return;
        }

        // Recupero posicion guardada (si la hay)
        var savedPos = null;
        try {
            savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY_POS) || 'null');
        } catch (e) {
            savedPos = null;
        }
        var savedMin = localStorage.getItem(STORAGE_KEY_MIN);

        // Calculo posicion inicial por defecto
        var defaultTop = 80;
        var defaultLeft = window.innerWidth - 340;

        var top = defaultTop;
        var left = defaultLeft;

        if (savedPos && typeof savedPos.top === 'number' && typeof savedPos.left === 'number') {
            top = savedPos.top;
            left = savedPos.left;
        }

        // Pequeño clamp para que no se quede fuera de la pantalla
        var margin = 20;
        var maxLeft = window.innerWidth - 200;
        var maxTop = window.innerHeight - 80;

        if (left < margin) left = margin;
        if (top < margin) top = margin;
        if (left > maxLeft) left = maxLeft;
        if (top > maxTop) top = maxTop;

        // Contenedor del popup
        var popup = document.createElement('div');
        popup.id = 'fc-helper-popup';

        // Estilos basicos del popup
        Object.assign(popup.style, {
            position: 'fixed',
            top: top + 'px',
            left: left + 'px',
            width: '320px',
            background: 'rgba(20, 20, 20, 0.95)',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '6px',
            padding: '0',
            zIndex: '99999',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.6)'
        });

        // --------------------------------------------------------
        // Cabecera del popup: titulo + boton de minimizar
        // --------------------------------------------------------
        var header = document.createElement('div');
        header.textContent = 'shur2text';
        Object.assign(header.style, {
            padding: '4px 8px',
            cursor: 'move',
            background: '#333',
            borderBottom: '1px solid #555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
        });

        var btnMinimize = document.createElement('button');
        btnMinimize.textContent = '–';
        Object.assign(btnMinimize.style, {
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 4px',
            marginLeft: '8px'
        });

        header.appendChild(btnMinimize);

        // --------------------------------------------------------
        // Cuerpo del popup (contenedor del editor)
        // --------------------------------------------------------
        var content = document.createElement('div');
        Object.assign(content.style, {
            padding: '6px',
            display: (savedMin === 'true') ? 'none' : 'block'
        });

        // --------------------------------------------------------
        // Barra de herramientas de formato (botones BBCode)
        // --------------------------------------------------------
        var toolbar = document.createElement('div');
        Object.assign(toolbar.style, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '4px'
        });

        // Referencias a las areas de texto para que las funciones las usen
        var inputArea = null;
        var outputArea = null;

        // Funcion generica que aplica una transformacion al texto
        function transformAndShow(transformFn) {
            var text = (inputArea && inputArea.value) ? inputArea.value : '';
            if (!text) {
                alert('Escribe algo en "Texto base" primero.');
                return;
            }
            var result = transformFn(text);
            if (result == null) return;
            if (outputArea) {
                outputArea.value = result;
            }
        }

        // Crea un boton de la toolbar y le asigna la funcion de formato
        function createToolButton(label, title, transformFn) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.title = title;
            Object.assign(btn.style, {
                padding: '2px 4px',
                borderRadius: '3px',
                border: '1px solid #555',
                background: '#444',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px'
            });
            btn.addEventListener('click', function() {
                transformAndShow(transformFn);
            });
            toolbar.appendChild(btn);
            return btn;
        }

        // --------------------------------------------------------
        // Funciones concretas de formato (BBCode tipico de Forocoches)
        // --------------------------------------------------------
        function fnBold(t)      { return '[b]' + t + '[/b]'; }
        function fnItalic(t)    { return '[i]' + t + '[/i]'; }
        function fnUnderline(t) { return '[u]' + t + '[/u]'; }
        function fnStrike(t)    { return '[s]' + t + '[/s]'; }

        function fnQuote(t)     { return '[quote]' + t + '[/quote]'; }
        function fnCode(t)      { return '[code]' + t + '[/code]'; }
        function fnSpoiler(t)   { return '[spoiler]' + t + '[/spoiler]'; }

        function fnLeft(t)      { return '[left]' + t + '[/left]'; }
        function fnCenter(t)    { return '[center]' + t + '[/center]'; }
        function fnRight(t)     { return '[right]' + t + '[/right]'; }

        function fnUpper(t)     { return t.toUpperCase(); }
        function fnLower(t)     { return t.toLowerCase(); }

        // Color personalizado
        function fnColor(t) {
            var color = prompt('Color (nombre o hex, ej: red o #ff0000):', 'red');
            if (!color) return null;
            return '[color=' + color + ']' + t + '[/color]';
        }

        // Tamaño de letra
        function fnSize(t) {
            var size = prompt('Tamano (1-7):', '4');
            if (!size) return null;
            return '[size=' + size + ']' + t + '[/size]';
        }

        // Construye listas con [list] y [*]
        function makeList(text, ordered) {
            var lines = text
                .split(/\r?\n/)
                .map(function(l) { return l.trim(); })
                .filter(function(l) { return l; });

            if (!lines.length) return '';

            var tag = ordered ? 'list=1' : 'list';
            return '[' + tag + ']\n' +
                lines.map(function(l) { return '[*]' + l; }).join('\n') +
                '\n[/' + tag + ']';
        }

        function fnList(t)    { return makeList(t, false); }
        function fnListNum(t) { return makeList(t, true); }

        // Enlaces
        function fnUrl(t) {
            var url = prompt('Introduce la URL (deja vacio para usar el propio texto):', 'https://');
            if (url === null) return null;
            var trimmed = url.trim();
            if (trimmed === '') return '[url]' + t + '[/url]';
            return '[url=' + trimmed + ']' + t + '[/url]';
        }

        // Dejar tal cual (por si quiero solo copiar)
        function fnNoFormat(t) {
            return t;
        }

        // --------------------------------------------------------
        // Botones de formato (toolbar)
        // --------------------------------------------------------
        createToolButton('B',   'Negrita',                 fnBold);
        createToolButton('I',   'Italica',                 fnItalic);
        createToolButton('U',   'Subrayado',               fnUnderline);
        createToolButton('S',   'Tachado',                 fnStrike);

        createToolButton('Clr', 'Color [color]',           fnColor);
        createToolButton('Sz',  'Tamano [size]',           fnSize);

        createToolButton('Q',   'Cita [quote]',            fnQuote);
        createToolButton('Code','Codigo [code]',           fnCode);
        createToolButton('Sp',  'Spoiler [spoiler]',       fnSpoiler);

        createToolButton('L',   'Alinear izquierda',       fnLeft);
        createToolButton('C',   'Centrar',                 fnCenter);
        createToolButton('R',   'Alinear derecha',         fnRight);

        createToolButton('•',   'Lista con vinetas',       fnList);
        createToolButton('1.',  'Lista numerada',          fnListNum);

        createToolButton('URL', 'Enlace [url]',            fnUrl);

        createToolButton('MAY', 'Convertir a MAYUSCULAS',  fnUpper);
        createToolButton('min', 'Convertir a minusculas',  fnLower);

        createToolButton('Raw', 'Sin formato (copiar tal cual)', fnNoFormat);

        // --------------------------------------------------------
        // Area de texto de entrada (texto base)
        // --------------------------------------------------------
        var labelIn = document.createElement('div');
        labelIn.textContent = 'Texto base';
        Object.assign(labelIn.style, {
            marginBottom: '2px',
            fontSize: '11px',
            opacity: '0.8'
        });

        inputArea = document.createElement('textarea');
        inputArea.placeholder = 'Escribe aqui tu texto en plano...';
        Object.assign(inputArea.style, {
            width: '100%',
            height: '70px',
            boxSizing: 'border-box',
            resize: 'vertical',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#111',
            color: '#eee',
            padding: '4px',
            marginBottom: '4px'
        });

        // --------------------------------------------------------
        // Area de texto de salida (resultado formateado)
        // --------------------------------------------------------
        var labelOut = document.createElement('div');
        labelOut.textContent = 'Resultado (BBCode)';
        Object.assign(labelOut.style, {
            marginTop: '4px',
            marginBottom: '2px',
            fontSize: '11px',
            opacity: '0.8'
        });

        outputArea = document.createElement('textarea');
        outputArea.placeholder = 'Aqui aparecera el texto formateado...';
        Object.assign(outputArea.style, {
            width: '100%',
            height: '80px',
            boxSizing: 'border-box',
            resize: 'vertical',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#111',
            color: '#eee',
            padding: '4px',
            marginBottom: '4px'
        });
        outputArea.spellcheck = false;

        // Si el usuario escribe y la salida esta vacia, copio tal cual
        inputArea.addEventListener('input', function() {
            if (!outputArea.value) {
                outputArea.value = inputArea.value;
            }
        });

        // --------------------------------------------------------
        // Botones inferiores: copiar, insertar, pasar salida arriba
        // --------------------------------------------------------
        var buttonsRow = document.createElement('div');
        Object.assign(buttonsRow.style, {
            marginTop: '4px',
            display: 'flex',
            gap: '6px',
            justifyContent: 'space-between'
        });

        var btnCopy = document.createElement('button');
        btnCopy.textContent = 'Copiar';
        Object.assign(btnCopy.style, {
            flex: '1',
            padding: '4px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#444',
            color: '#fff',
            cursor: 'pointer'
        });

        var btnInsert = document.createElement('button');
        btnInsert.textContent = 'Insertar en respuesta';
        Object.assign(btnInsert.style, {
            flex: '1',
            padding: '4px',
            borderRadius: '4px',
            border: '1px solid #0077ff',
            background: '#0a84ff',
            color: '#fff',
            cursor: 'pointer'
        });

        var btnUseResult = document.createElement('button');
        btnUseResult.textContent = '↑ Pasar salida arriba';
        Object.assign(btnUseResult.style, {
            flex: '0 0 auto',
            padding: '4px',
            borderRadius: '4px',
            border: '1px solid #666',
            background: '#222',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            whiteSpace: 'nowrap'
        });

        buttonsRow.appendChild(btnCopy);
        buttonsRow.appendChild(btnInsert);
        buttonsRow.appendChild(btnUseResult);

        // Copiar al portapapeles
        btnCopy.addEventListener('click', function() {
            var primary = (outputArea && outputArea.value) ? outputArea.value : '';
            var secondary = (inputArea && inputArea.value) ? inputArea.value : '';
            var text = primary || secondary || '';

            if (!text) {
                alert('No hay texto para copiar.');
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(function(err) {
                    console.error('Error al copiar:', err);
                    alert('No se pudo copiar automaticamente. Selecciona y copia manualmente (Ctrl+C).');
                });
            } else {
                if (outputArea && primary) {
                    outputArea.select();
                } else if (inputArea && secondary) {
                    inputArea.select();
                }
                alert('Tu navegador no permite copiar automaticamente. Pulsa Ctrl+C para copiar.');
            }
        });

        // Insertar en el editor de FC
        btnInsert.addEventListener('click', function() {
            var primary = (outputArea && outputArea.value) ? outputArea.value : '';
            var secondary = (inputArea && inputArea.value) ? inputArea.value : '';
            var text = primary || secondary || '';

            if (!text) {
                alert('No hay texto para insertar.');
                return;
            }
            insertIntoEditor(text);
        });

        // Pasar el resultado formateado al cuadro de arriba (para seguir encadenando formatos si se quiere)
        btnUseResult.addEventListener('click', function() {
            if (!outputArea) return;
            inputArea.value = outputArea.value;
        });

        // Montar todo el contenido del popup
        content.appendChild(toolbar);
        content.appendChild(labelIn);
        content.appendChild(inputArea);
        content.appendChild(labelOut);
        content.appendChild(outputArea);
        content.appendChild(buttonsRow);

        popup.appendChild(header);
        popup.appendChild(content);
        document.body.appendChild(popup);

        // --------------------------------------------------------
        // Drag & drop de la ventana (para mover el popup)
        // --------------------------------------------------------
        var isDragging = false;
        var offsetX = 0;
        var offsetY = 0;

        header.addEventListener('mousedown', function(e) {
            // Si se hace click en el boton de minimizar, no empezamos a arrastrar
            if (e.target === btnMinimize) return;
            isDragging = true;
            var rect = popup.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            var newLeft = e.clientX - offsetX;
            var newTop = e.clientY - offsetY;

            popup.style.left = newLeft + 'px';
            popup.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            isDragging = false;

            // Guardamos la posicion final en localStorage
            var rect = popup.getBoundingClientRect();
            var pos = { left: rect.left, top: rect.top };
            try {
                localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
            } catch (e) {
                // Si localStorage peta, tampoco pasa nada
                console.error('No se pudo guardar la posicion del popup:', e);
            }
        });

        // --------------------------------------------------------
        // Minimizar / restaurar el contenido del popup
        // --------------------------------------------------------
        function setMinimized(isMin) {
            content.style.display = isMin ? 'none' : 'block';
            btnMinimize.textContent = isMin ? '+' : '–';
            try {
                localStorage.setItem(STORAGE_KEY_MIN, isMin ? 'true' : 'false');
            } catch (e) {
                console.error('No se pudo guardar el estado minimizado:', e);
            }
        }

        setMinimized(savedMin === 'true');

        btnMinimize.addEventListener('click', function(e) {
            e.stopPropagation();
            var currentlyMinimized = content.style.display === 'none';
            setMinimized(!currentlyMinimized);
        });

        // Arrancamos el limpiador del iframe del editor
        setupIframeCleaner();
    }

    // ------------------------------------------------------------
    // Lanzar el popup cuando el DOM este listo
    // ------------------------------------------------------------
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // La pagina ya esta lista o casi
        createPopup();
    } else {
        document.addEventListener('DOMContentLoaded', createPopup);
    }

    // Fin del IIFE
})();
