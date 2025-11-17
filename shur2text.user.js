// ==UserScript==
// @name         shur2text – Forocoches Helper
// @namespace    https://github.com/MateoPalmeiro/shur2text
// @version      0.0.1
// @description  Popup flotante con editor de texto avanzado para Forocoches: BBCode, plantillas, movible y persistente.
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

  // No ejecutar en iframes (se la pela igual)
  if (window.top !== window.self) return;

  const STORAGE_KEY_POS = 'fc_popup_pos_v1';
  const STORAGE_KEY_MIN = 'fc_popup_min_v1';

  // --- Limpia copias fantasma del popup dentro del iframe del editor, no se porque pasa, pero esto funciona ---
  function setupIframeCleaner() {
    const iframe = document.getElementById('vB_Editor_QR_iframe');
    if (!iframe) return;

    const removeDup = () => {
      let doc;
      try {
        doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      } catch (e) {
        return;
      }
      if (!doc) return;
      const ghost = doc.getElementById('fc-helper-popup');
      if (ghost && ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    };

    iframe.addEventListener('load', removeDup);
    removeDup();

    const intervalId = setInterval(() => {
      if (!document.body.contains(iframe)) {
        clearInterval(intervalId);
        return;
      }
      removeDup();
    }, 1500);
  }

  // Inserta texto en el editor de respuesta
  function insertIntoEditor(text) {
    const iframe = document.getElementById('vB_Editor_QR_iframe');
    const textarea = document.getElementById('vB_Editor_QR_textarea');

    if (!iframe && !textarea) {
      alert('No se ha encontrado el editor de respuesta rápida.');
      return;
    }

    // Modo WYSIWYG (iframe)
    if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
      const body = iframe.contentDocument.body;
      iframe.contentWindow.focus();

      try {
        if (iframe.contentDocument.execCommand) {
          const toInsert = (body.innerHTML.trim() ? '\n' : '') + text;
          iframe.contentDocument.execCommand('insertText', false, toInsert);
        } else {
          const extra = (body.innerHTML.trim() ? '\n' : '') + text;
          const escaped = extra
            .split('\n')
            .map(line => line === '' ? '<br>' : line.replace(/</g, '&lt;'))
            .join('<br>');
          body.innerHTML += escaped;
        }
      } catch (e) {
        console.error('Error insertando en iframe, usando fallback:', e);
        const extra = (body.innerHTML.trim() ? '\n' : '') + text;
        const escaped = extra
          .split('\n')
          .map(line => line === '' ? '<br>' : line.replace(/</g, '&lt;'))
          .join('<br>');
        body.innerHTML += escaped;
      }

      // Mantener sincronizado el textarea oculto si existe
      if (textarea) {
        const current = textarea.value || '';
        textarea.value = current + (current ? '\n' : '') + text;
      }

      return;
    }

    // Modo solo textarea
    if (textarea) {
      const current = textarea.value || '';
      textarea.value = current + (current ? '\n' : '') + text;
      textarea.focus();
      return;
    }

    alert('No se pudo insertar en el editor.');
  }

  // --- Crear popup principal ---
  function createPopup() {
    if (document.getElementById('fc-helper-popup')) return;

    const savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY_POS) || 'null');
    const savedMin = localStorage.getItem(STORAGE_KEY_MIN);

    const popup = document.createElement('div');
    popup.id = 'fc-helper-popup';

    Object.assign(popup.style, {
      position: 'fixed',
      top: (savedPos && typeof savedPos.top === 'number') ? savedPos.top + 'px' : '80px',
      left: (savedPos && typeof savedPos.left === 'number') ? savedPos.left + 'px' : 'calc(100% - 340px)',
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

    // Cabecera
    const header = document.createElement('div');
    header.textContent = 'Forocoches Helper';
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

    const btnMinimize = document.createElement('button');
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

    // Contenido
    const content = document.createElement('div');
    Object.assign(content.style, {
      padding: '6px',
      display: (savedMin === 'true') ? 'none' : 'block'
    });

    // --- Barra de herramientas de formato ---
    const toolbar = document.createElement('div');
    Object.assign(toolbar.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginBottom: '4px'
    });

    function createToolButton(label, title, transformFn) {
      const btn = document.createElement('button');
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
      btn.addEventListener('click', () => transformAndShow(transformFn));
      toolbar.appendChild(btn);
      return btn;
    }

    // Se crean después de definir las áreas de texto,
    // pero las funciones necesitan una referencia, así que
    // declaramos aquí y asignamos luego
    let inputArea, outputArea;

    function transformAndShow(transformFn) {
      const text = (inputArea && inputArea.value) ? inputArea.value : '';
      if (!text) {
        alert('Escribe algo en el "Texto base" primero.');
        return;
      }
      const result = transformFn(text);
      if (result == null) return;
      if (outputArea) outputArea.value = result;
    }

    // Funciones concretas
    const fnBold = t => `[b]${t}[/b]`;
    const fnItalic = t => `[i]${t}[/i]`;
    const fnUnderline = t => `[u]${t}[/u]`;
    const fnStrike = t => `[s]${t}[/s]`;
    const fnQuote = t => `[quote]${t}[/quote]`;
    const fnCode = t => `[code]${t}[/code]`;
    const fnSpoiler = t => `[spoiler]${t}[/spoiler]`;
    const fnLeft = t => `[left]${t}[/left]`;
    const fnCenter = t => `[center]${t}[/center]`;
    const fnRight = t => `[right]${t}[/right]`;
    const fnUpper = t => t.toUpperCase();
    const fnLower = t => t.toLowerCase();

    function fnColor(t) {
      const color = prompt('Color (nombre o hex, ej: red o #ff0000):', 'red');
      if (!color) return null;
      return `[color=${color}]${t}[/color]`;
    }

    function fnSize(t) {
      const size = prompt('Tamaño (1-7):', '4');
      if (!size) return null;
      return `[size=${size}]${t}[/size]`;
    }

    function makeList(text, ordered) {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      if (!lines.length) return '';
      const tag = ordered ? 'list=1' : 'list';
      return `[${tag}]\n` + lines.map(l => `[*]${l}`).join('\n') + `\n[/${tag}]`;
    }

    function fnList(t) {
      return makeList(t, false);
    }

    function fnListNum(t) {
      return makeList(t, true);
    }

    function fnUrl(t) {
      const url = prompt('Introduce la URL (deja vacío para usar el propio texto):', 'https://');
      if (url === null) return null;
      const trimmed = url.trim();
      if (trimmed === '') return `[url]${t}[/url]`;
      return `[url=${trimmed}]${t}[/url]`;
    }

    function fnNoFormat(t) {
      return t;
    }

    // Crear botones de la toolbar
    createToolButton('B', 'Negrita', fnBold);
    createToolButton('I', 'Itálica', fnItalic);
    createToolButton('U', 'Subrayado', fnUnderline);
    createToolButton('S', 'Tachado', fnStrike);
    createToolButton('Clr', 'Color', fnColor);
    createToolButton('Sz', 'Tamaño', fnSize);
    createToolButton('Q', 'Cita', fnQuote);
    createToolButton('Code', 'Código', fnCode);
    createToolButton('Sp', 'Spoiler', fnSpoiler);
    createToolButton('L', 'Alinear izquierda', fnLeft);
    createToolButton('C', 'Centrar', fnCenter);
    createToolButton('R', 'Alinear derecha', fnRight);
    createToolButton('•', 'Lista con viñetas', fnList);
    createToolButton('1.', 'Lista numerada', fnListNum);
    createToolButton('URL', 'Enlace [url]', fnUrl);
    createToolButton('MAY', 'Convertir a MAYÚSCULAS', fnUpper);
    createToolButton('min', 'Convertir a minúsculas', fnLower);
    createToolButton('Raw', 'Sin formato (copiar tal cual)', fnNoFormat);

    // --- Áreas de texto ---
    const labelIn = document.createElement('div');
    labelIn.textContent = 'Texto base';
    Object.assign(labelIn.style, {
      marginBottom: '2px',
      fontSize: '11px',
      opacity: '0.8'
    });

    inputArea = document.createElement('textarea');
    inputArea.placeholder = 'Escribe aquí tu texto en plano...';
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

    const labelOut = document.createElement('div');
    labelOut.textContent = 'Resultado (BBCode)';
    Object.assign(labelOut.style, {
      marginTop: '4px',
      marginBottom: '2px',
      fontSize: '11px',
      opacity: '0.8'
    });

    outputArea = document.createElement('textarea');
    outputArea.placeholder = 'Aquí aparecerá el texto formateado...';
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

    // Sincronizar salida por defecto: texto base tal cual
    inputArea.addEventListener('input', () => {
      if (!outputArea.value) {
        outputArea.value = inputArea.value;
      }
    });

    // --- Botones inferiores ---
    const buttonsRow = document.createElement('div');
    Object.assign(buttonsRow.style, {
      marginTop: '4px',
      display: 'flex',
      gap: '6px',
      justifyContent: 'space-between'
    });

    const btnCopy = document.createElement('button');
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

    const btnInsert = document.createElement('button');
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

    const btnUseResult = document.createElement('button');
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

    // Copiar
    btnCopy.addEventListener('click', function() {
      const primary = (outputArea && outputArea.value) ? outputArea.value : '';
      const secondary = (inputArea && inputArea.value) ? inputArea.value : '';
      const text = primary || secondary || '';

      if (!text) {
        alert('No hay texto para copiar.');
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(err => {
          console.error('Error al copiar:', err);
          alert('No se pudo copiar automáticamente. Selecciona y copia manualmente (Ctrl+C).');
        });
      } else {
        if (outputArea && primary) {
          outputArea.select();
        } else if (inputArea && secondary) {
          inputArea.select();
        }
        alert('Tu navegador no permite copiar automáticamente. Pulsa Ctrl+C para copiar.');
      }
    });

    // Insertar en respuesta
    btnInsert.addEventListener('click', function() {
      const primary = (outputArea && outputArea.value) ? outputArea.value : '';
      const secondary = (inputArea && inputArea.value) ? inputArea.value : '';
      const text = primary || secondary || '';

      if (!text) {
        alert('No hay texto para insertar.');
        return;
      }
      insertIntoEditor(text);
    });

    // Pasar salida arriba
    btnUseResult.addEventListener('click', function() {
      if (!outputArea) return;
      inputArea.value = outputArea.value;
    });

    // Montar contenido
    content.appendChild(toolbar);
    content.appendChild(labelIn);
    content.appendChild(inputArea);
    content.appendChild(labelOut);
    content.appendChild(outputArea);
    content.appendChild(buttonsRow);

    popup.appendChild(header);
    popup.appendChild(content);
    document.body.appendChild(popup);

    // ---- Drag & drop ----
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', function(e) {
      if (e.target === btnMinimize) return;
      isDragging = true;
      const rect = popup.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      popup.style.left = newLeft + 'px';
      popup.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      isDragging = false;
      const rect = popup.getBoundingClientRect();
      const pos = { left: rect.left, top: rect.top };
      localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
    });

    // ---- Minimizar ----
    function setMinimized(isMin) {
      content.style.display = isMin ? 'none' : 'block';
      btnMinimize.textContent = isMin ? '+' : '–';
      localStorage.setItem(STORAGE_KEY_MIN, isMin ? 'true' : 'false');
    }

    setMinimized(savedMin === 'true');

    btnMinimize.addEventListener('click', function(e) {
      e.stopPropagation();
      const currentlyMinimized = content.style.display === 'none';
      setMinimized(!currentlyMinimized);
    });

    // Arrancamos el limpiador del iframe
    setupIframeCleaner();
  }

  // Lanzar popup
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createPopup();
  } else {
    document.addEventListener('DOMContentLoaded', createPopup);
  }

})();
//hay que meter lo de los links que usa forocoches, imagenes,... pero bueno, ya se ira viendo
