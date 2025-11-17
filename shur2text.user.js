// ==UserScript==
// @name         Shur2Text - BBCode Helper for Forocoches
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  UserScript para Forocoches que añade un popup de ayuda flotante y movible. Facilita la creación de posts con formato BBCode: escribe texto plano, aplica formatos (Negrita, Cita, Spoiler, Color, Listas) y obtén el código.
// @author       MateoPalmeiro
// @match        https://forocoches.com/*
// @match        https://www.forocoches.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @license      GPL-3.0-or-later
// @homepage     https://github.com/MateoPalmeiro/shur2text
// @supportURL   https://github.com/MateoPalmeiro/shur2text/issues
// ==/UserScript==

(function() {
    'use strict';

    // Add CSS styles
    GM_addStyle(`
        #shur2text-popup {
            position: fixed;
            width: 400px;
            background: #ffffff;
            border: 2px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            font-family: Arial, sans-serif;
        }

        #shur2text-header {
            background: #333;
            color: #fff;
            padding: 10px;
            cursor: move;
            border-radius: 6px 6px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #shur2text-header h3 {
            margin: 0;
            font-size: 16px;
        }

        #shur2text-minimize {
            background: #555;
            color: #fff;
            border: none;
            padding: 2px 8px;
            cursor: pointer;
            border-radius: 3px;
        }

        #shur2text-minimize:hover {
            background: #777;
        }

        #shur2text-content {
            padding: 15px;
        }

        #shur2text-content.minimized {
            display: none;
        }

        #shur2text-textarea {
            width: 100%;
            min-height: 100px;
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-family: monospace;
            resize: vertical;
            box-sizing: border-box;
        }

        .shur2text-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 10px;
        }

        .shur2text-btn {
            padding: 6px 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .shur2text-btn:hover {
            background: #45a049;
        }

        .shur2text-btn.secondary {
            background: #008CBA;
        }

        .shur2text-btn.secondary:hover {
            background: #007399;
        }

        #shur2text-output {
            width: 100%;
            min-height: 80px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-family: monospace;
            resize: vertical;
            box-sizing: border-box;
            background: #f9f9f9;
        }

        .shur2text-action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .shur2text-action-btn {
            flex: 1;
            padding: 10px;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }

        .shur2text-action-btn:hover {
            background: #e68900;
        }

        .shur2text-action-btn.copy {
            background: #2196F3;
        }

        .shur2text-action-btn.copy:hover {
            background: #0b7dda;
        }

        .shur2text-color-picker {
            display: none;
            margin-top: 5px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 4px;
        }

        .shur2text-color-picker.active {
            display: block;
        }

        .shur2text-color-option {
            display: inline-block;
            width: 30px;
            height: 30px;
            margin: 3px;
            border: 2px solid #333;
            cursor: pointer;
            border-radius: 3px;
        }

        .shur2text-color-option:hover {
            border-color: #000;
            transform: scale(1.1);
        }
    `);

    // BBCode formatting functions
    const BBCodeFormatter = {
        bold: (text) => `[b]${text}[/b]`,
        italic: (text) => `[i]${text}[/i]`,
        underline: (text) => `[u]${text}[/u]`,
        quote: (text) => `[quote]${text}[/quote]`,
        spoiler: (text) => `[spoiler]${text}[/spoiler]`,
        color: (text, color) => `[color=${color}]${text}[/color]`,
        url: (text, url) => `[url=${url}]${text}[/url]`,
        list: (items) => {
            const listItems = items.split('\n').filter(item => item.trim()).map(item => `[*]${item.trim()}`).join('\n');
            return `[list]\n${listItems}\n[/list]`;
        }
    };

    // Create popup
    function createPopup() {
        const popup = document.createElement('div');
        popup.id = 'shur2text-popup';
        
        // Restore position or use default
        const savedX = GM_getValue('popupX', window.innerWidth - 450);
        const savedY = GM_getValue('popupY', 100);
        const isMinimized = GM_getValue('isMinimized', false);
        
        popup.style.left = savedX + 'px';
        popup.style.top = savedY + 'px';

        popup.innerHTML = `
            <div id="shur2text-header">
                <h3>Shur2Text - BBCode Helper</h3>
                <button id="shur2text-minimize">${isMinimized ? '▢' : '_'}</button>
            </div>
            <div id="shur2text-content" ${isMinimized ? 'class="minimized"' : ''}>
                <textarea id="shur2text-textarea" placeholder="Escribe tu texto aquí..."></textarea>
                
                <div class="shur2text-buttons">
                    <button class="shur2text-btn" data-format="bold">Negrita</button>
                    <button class="shur2text-btn" data-format="italic">Cursiva</button>
                    <button class="shur2text-btn" data-format="underline">Subrayado</button>
                    <button class="shur2text-btn" data-format="quote">Cita</button>
                    <button class="shur2text-btn" data-format="spoiler">Spoiler</button>
                    <button class="shur2text-btn secondary" data-format="color">Color</button>
                    <button class="shur2text-btn secondary" data-format="url">URL</button>
                    <button class="shur2text-btn secondary" data-format="list">Lista</button>
                </div>

                <div id="shur2text-color-picker" class="shur2text-color-picker">
                    <div>Selecciona un color:</div>
                    <div style="margin-top: 5px;">
                        <span class="shur2text-color-option" data-color="red" style="background: red;"></span>
                        <span class="shur2text-color-option" data-color="blue" style="background: blue;"></span>
                        <span class="shur2text-color-option" data-color="green" style="background: green;"></span>
                        <span class="shur2text-color-option" data-color="yellow" style="background: yellow;"></span>
                        <span class="shur2text-color-option" data-color="orange" style="background: orange;"></span>
                        <span class="shur2text-color-option" data-color="purple" style="background: purple;"></span>
                        <span class="shur2text-color-option" data-color="black" style="background: black;"></span>
                        <span class="shur2text-color-option" data-color="white" style="background: white;"></span>
                    </div>
                </div>

                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Resultado BBCode:</label>
                <textarea id="shur2text-output" readonly></textarea>

                <div class="shur2text-action-buttons">
                    <button class="shur2text-action-btn copy">Copiar</button>
                    <button class="shur2text-action-btn insert">Insertar</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        return popup;
    }

    // Make popup draggable
    function makeDraggable(popup) {
        const header = popup.querySelector('#shur2text-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.id === 'shur2text-minimize') return;
            isDragging = true;
            initialX = e.clientX - popup.offsetLeft;
            initialY = e.clientY - popup.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                popup.style.left = currentX + 'px';
                popup.style.top = currentY + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                GM_setValue('popupX', popup.offsetLeft);
                GM_setValue('popupY', popup.offsetTop);
            }
        });
    }

    // Initialize the script
    function init() {
        const popup = createPopup();
        makeDraggable(popup);

        const textarea = document.getElementById('shur2text-textarea');
        const output = document.getElementById('shur2text-output');
        const minimizeBtn = document.getElementById('shur2text-minimize');
        const content = document.getElementById('shur2text-content');
        const colorPicker = document.getElementById('shur2text-color-picker');

        // Minimize/Maximize functionality
        minimizeBtn.addEventListener('click', () => {
            const isMinimized = content.classList.toggle('minimized');
            minimizeBtn.textContent = isMinimized ? '▢' : '_';
            GM_setValue('isMinimized', isMinimized);
        });

        // Format buttons
        document.querySelectorAll('.shur2text-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                const text = textarea.value;
                
                if (!text.trim()) {
                    alert('Por favor, escribe algo de texto primero');
                    return;
                }

                let formatted;
                
                switch(format) {
                    case 'bold':
                        formatted = BBCodeFormatter.bold(text);
                        break;
                    case 'italic':
                        formatted = BBCodeFormatter.italic(text);
                        break;
                    case 'underline':
                        formatted = BBCodeFormatter.underline(text);
                        break;
                    case 'quote':
                        formatted = BBCodeFormatter.quote(text);
                        break;
                    case 'spoiler':
                        formatted = BBCodeFormatter.spoiler(text);
                        break;
                    case 'color':
                        colorPicker.classList.toggle('active');
                        return;
                    case 'url':
                        const url = prompt('Introduce la URL:');
                        if (url) {
                            formatted = BBCodeFormatter.url(text, url);
                        } else {
                            return;
                        }
                        break;
                    case 'list':
                        formatted = BBCodeFormatter.list(text);
                        break;
                }

                output.value = formatted;
            });
        });

        // Color picker
        document.querySelectorAll('.shur2text-color-option').forEach(colorOption => {
            colorOption.addEventListener('click', () => {
                const color = colorOption.dataset.color;
                const text = textarea.value;
                
                if (!text.trim()) {
                    alert('Por favor, escribe algo de texto primero');
                    return;
                }

                output.value = BBCodeFormatter.color(text, color);
                colorPicker.classList.remove('active');
            });
        });

        // Copy button
        document.querySelector('.shur2text-action-btn.copy').addEventListener('click', () => {
            if (!output.value) {
                alert('No hay código BBCode para copiar');
                return;
            }
            
            output.select();
            document.execCommand('copy');
            alert('¡Código BBCode copiado al portapapeles!');
        });

        // Insert button
        document.querySelector('.shur2text-action-btn.insert').addEventListener('click', () => {
            if (!output.value) {
                alert('No hay código BBCode para insertar');
                return;
            }

            // Try to find the quick reply textarea
            const quickReply = document.querySelector('textarea[name="message"]') || 
                              document.querySelector('#vB_Editor_001_textarea') ||
                              document.querySelector('textarea.editor');
            
            if (quickReply) {
                const cursorPos = quickReply.selectionStart;
                const textBefore = quickReply.value.substring(0, cursorPos);
                const textAfter = quickReply.value.substring(cursorPos);
                quickReply.value = textBefore + output.value + textAfter;
                quickReply.focus();
                quickReply.selectionStart = quickReply.selectionEnd = cursorPos + output.value.length;
                alert('¡Código BBCode insertado en la respuesta rápida!');
            } else {
                alert('No se encontró el área de respuesta rápida. Usa el botón Copiar en su lugar.');
            }
        });

        // Auto-update output when typing
        textarea.addEventListener('input', () => {
            // Clear output when input changes
            if (output.value && textarea.value !== textarea.dataset.lastValue) {
                output.value = '';
            }
            textarea.dataset.lastValue = textarea.value;
        });
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
