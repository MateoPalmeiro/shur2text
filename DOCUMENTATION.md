# Documentación Técnica - Shur2Text

## Descripción General

Shur2Text es un UserScript diseñado específicamente para mejorar la experiencia de publicación en el foro Forocoches mediante dos modos de edición complementarios: un modo técnico para edición directa de BBCode y un modo visual WYSIWYG con conversión automática a BBCode.

## Características Técnicas

### 1. Metadatos del UserScript

```javascript
// @name         shur2text - Forocoches Text Helper
// @version      0.4.9
// @match        https://forocoches.com/foro/*
// @run-at       document-end
// @noframes
// @license      AGPL-3.0-or-later
```

- **Compatibilidad**: Forocoches.com (solo páginas del foro)
- **Permisos**: Ningún permiso especial requerido (usa APIs estándar del navegador)
- **Licencia**: AGPL-3.0-or-later

### 2. Funcionalidades Principales

#### A. Interfaz Flotante Dual-Mode

El script proporciona dos modos de edición complementarios:

**Modo Técnico (BBCode) - [T]**
- Editor de texto plano con botones BBCode
- Vista previa en vivo opcional (panel lateral)
- Transformaciones de texto (mayúsculas, minúsculas, alternancia)
- Edición directa del BBCode generado

**Modo Visual (WYSIWYG) - [V]**
- Editor contentEditable con formateo visual
- Barra de herramientas con botones de estilo
- Conversión automática a BBCode en segundo plano
- Reflejo de estado de formateo en la barra de herramientas

Ambos modos comparten:
- Popup movible con posición recordada entre sesiones
- Estado minimizado/maximizado persistente
- Diseño responsive y moderno
- Botones "Copiar" e "Insertar" para interactuar con el editor de Forocoches

#### B. Formatos BBCode Soportados

| Formato | Sintaxis BBCode | Disponible en |
|---------|----------------|---------------|
| Negrita | `[b]texto[/b]` | Ambos modos |
| Cursiva | `[i]texto[/i]` | Ambos modos |
| Subrayado | `[u]texto[/u]` | Ambos modos |
| Tachado | `[s]texto[/s]` | Ambos modos |
| Cita | `[quote]texto[/quote]` | Ambos modos |
| Código | `[code]texto[/code]` | Ambos modos |
| Spoiler | `[spoiler]texto[/spoiler]` | Ambos modos |
| Color | `[color=red]texto[/color]` | Ambos modos |
| Tamaño | `[size=1-7]texto[/size]` | Ambos modos |
| Alineación Izq. | `[left]texto[/left]` | Ambos modos |
| Alineación Centro | `[center]texto[/center]` | Ambos modos |
| Alineación Der. | `[right]texto[/right]` | Ambos modos |
| URL | `[url=http://...]texto[/url]` | Ambos modos |
| Lista | `[list][*]item1[*]item2[/list]` | Ambos modos |
| Lista Numerada | `[list=1][*]item1[*]item2[/list=1]` | Ambos modos |

#### C. Selector de Colores

- Paleta predefinida con 9 colores comunes (blanco, gris, negro, rojo, amarillo, verde, cian, azul, magenta)
- Selector de color nativo del navegador para colores personalizados
- Integración directa con BBCode color en Modo Técnico
- Aplicación mediante `foreColor` en Modo Visual (luego convertido a BBCode)

#### D. Vista Previa en Vivo (Solo Modo Técnico)

- Panel lateral opcional activable con el botón `[<>]`
- Renderizado en tiempo real del BBCode a HTML
- Conversión de todos los tags BBCode soportados
- Manejo especial para `[code]` (monoespaciado, fondo oscuro) y `[spoiler]` (texto oculto)
- Limpieza automática de artefactos de formato

#### E. Transformaciones de Texto

Disponibles en ambos modos:
- **Mayúsculas**: Convierte todo el texto a MAYÚSCULAS
- **Minúsculas**: Convierte todo el texto a minúsculas
- **Alternancia**: Alterna mayúsculas/minúsculas en cada letra (eFeCto AlTeRnAdO)

#### F. Acciones de Salida

1. **Copiar**: Copia el BBCode generado al portapapeles usando la API Clipboard
2. **Insertar**: Inserta el BBCode directamente en el editor de Forocoches:
   - Detecta automáticamente si se usa el modo WYSIWYG (iframe) o textarea
   - Maneja la inserción de forma apropiada para cada tipo de editor
3. **Usar ↑** (Solo Modo Técnico): Copia el resultado actual al campo de entrada para encadenar transformaciones

### 3. Almacenamiento Persistente

El script utiliza localStorage para almacenar preferencias del usuario:

- `fc_popup_pos_v2`: Posición del popup (JSON con x, y)
- `fc_popup_min_v2`: Estado minimizado del popup (true/false)
- `fc_popup_mode_v2`: Modo activo ('tech' o 'visual')
- `fc_popup_preview_v1`: Visibilidad de la vista previa (true/false)

```javascript
localStorage.setItem('fc_popup_pos_v2', JSON.stringify({x: value1, y: value2}))
var pos = JSON.parse(localStorage.getItem('fc_popup_pos_v2') || '{}')
```

### 4. Selectores de Elementos del Foro

El script busca el editor de respuesta rápida de Forocoches usando múltiples selectores:

```javascript
// Para el modo WYSIWYG (iframe)
var iframe = document.getElementById('vB_Editor_QR_iframe');

// Para el modo textarea
var textarea = document.getElementById('vB_Editor_QR_textarea');
```

El script detecta automáticamente qué modo está activo y maneja la inserción de texto de forma apropiada.

### 5. Arquitectura del Código

```
shur2text.user.js
├── Metadatos UserScript
├── Estilos CSS (inyectados vía <style>)
├── ICONS (objeto con SVG icons)
├── Funciones de formato BBCode
│   ├── fnBold, fnItalic, fnUnderline, fnStrike
│   ├── fnQuote, fnCode, fnSpoiler
│   ├── fnLeft, fnCenter, fnRight
│   ├── fnUpper, fnLower, fnAlternating
│   ├── fnList, fnListNum
│   ├── fnUrl, fnNoFormat
│   └── makeList (helper)
├── Conversores HTML ↔ BBCode
│   ├── bbcodeToHtml() - Para vista previa
│   ├── htmlToBBCode() - Para Modo Visual
│   └── conversions[] - Array de reglas de conversión
├── Utilidades
│   ├── setupIframeCleaner() - Limpieza de clones
│   ├── showErrorToast() - Notificaciones de error
│   └── insertIntoEditor() - Inserción en editor de FC
├── Modo Técnico
│   ├── createTechModeContainer() - UI del modo técnico
│   ├── applyFormat() - Aplicar formato BBCode
│   └── updatePreview() - Actualizar vista previa
├── Modo Visual
│   ├── createVisualModeContainer() - UI del modo visual
│   ├── getVisualSelection() - Obtener selección
│   ├── createVisualToolButton() - Crear botones de toolbar
│   ├── syncVisualToOutput() - Convertir HTML a BBCode
│   ├── updateVisualToolbarState() - Actualizar estado de botones
│   └── Comandos personalizados (quote, code, spoiler, transformaciones)
├── Selector de Color
│   └── createColorPicker() - Dialog de selección de color
├── Vista Previa
│   └── createPreviewPanel() - Panel lateral de vista previa
├── createPopup() - Creación del DOM principal
├── makeDraggable() - Sistema de arrastre
├── toggleMode() - Cambio entre modos
└── init() - Inicialización y event listeners
```

### 6. Flujo de Ejecución

1. **Inicialización**:
   - Verificar que no estamos en un iframe (`window.top === window.self`)
   - Inyectar estilos CSS
   - Esperar a que el DOM esté listo

2. **Creación de UI**:
   - Crear popup principal con header, content y controles
   - Crear contenedores para Modo Técnico y Modo Visual
   - Crear panel de vista previa (oculto por defecto)
   - Crear selector de color (oculto por defecto)
   - Crear elemento toast para notificaciones

3. **Restaurar Estado**:
   - Cargar posición, estado de minimizado, modo activo y vista previa desde localStorage
   - Aplicar configuración guardada

4. **Limpieza Periódica**:
   - Configurar limpiador de clones dentro del iframe de Forocoches
   - Ejecutar cada 1.5 segundos

5. **Interacción**:
   - Responder a clics en botones de formato
   - Actualizar vista previa en tiempo real (Modo Técnico)
   - Actualizar estado de toolbar (Modo Visual)
   - Manejar arrastre del popup
   - Guardar estado en localStorage al cambiar

## Compatibilidad

### Navegadores Soportados
- ✅ Chrome/Chromium (con Tampermonkey/Violentmonkey)
- ✅ Firefox (con Tampermonkey/Greasemonkey/Violentmonkey)
- ✅ Edge (con Tampermonkey/Violentmonkey)
- ✅ Safari (con Tampermonkey)
- ✅ Opera (con Tampermonkey/Violentmonkey)

### Gestores de UserScript Recomendados
1. **Tampermonkey** - La opción más completa y compatible
2. **Violentmonkey** - Alternativa open-source ligera
3. **Greasemonkey** - Solo Firefox

**Nota**: El script no requiere permisos especiales de GM_* API. Usa solo APIs estándar del navegador (localStorage, Clipboard API).

## Desarrollo y Contribución

### Requisitos
- Editor de código con soporte JavaScript
- Navegador con gestor de userscripts
- Conocimientos básicos de:
  - JavaScript ES5 (el script no usa ES6+ para máxima compatibilidad)
  - DOM manipulation
  - CSS3
  - BBCode syntax
  - contentEditable API (para Modo Visual)

### Testing Local
1. Clonar el repositorio
2. Instalar el script en tu gestor de userscripts
3. Visitar https://forocoches.com/foro/ o usar test.html localmente
4. Verificar funcionalidad del popup en ambos modos
5. Probar vista previa, selector de color y transformaciones
6. Verificar que la posición y estado se persisten al recargar

### Estructura de Commits
- `feat:` Nuevas características
- `fix:` Corrección de bugs
- `docs:` Documentación
- `style:` Formato de código
- `refactor:` Refactorización
- `test:` Añadir o modificar tests

## Solución de Problemas

### El popup no aparece
- Verificar que estás en `https://forocoches.com/foro/*` (el script solo se activa en páginas del foro)
- Comprobar que el script está activado en tu gestor
- Revisar la consola del navegador para errores
- Verificar que no estás dentro de un iframe (el script tiene `@noframes`)

### El botón "Insertar" no funciona
- Asegurarse de que estás en una página de Forocoches con editor de respuesta rápida visible
- El script busca `vB_Editor_QR_iframe` (modo WYSIWYG) o `vB_Editor_QR_textarea`
- Como alternativa, usar el botón "Copiar" y pegar manualmente

### La posición/estado no se guarda
- Verificar que localStorage está habilitado en tu navegador
- Comprobar que no estás en modo incógnito/privado (localStorage puede estar deshabilitado)
- Revisar la consola para errores de localStorage

### El Modo Visual no funciona correctamente
- El Modo Visual usa `document.execCommand` que está deprecated pero aún funciona
- Algunos navegadores pueden tener comportamientos ligeramente diferentes
- Si hay problemas, usar el Modo Técnico como alternativa

### La vista previa no se actualiza
- La vista previa solo está disponible en Modo Técnico
- Verificar que el botón `[<>]` está activado (debe aparecer azul)
- Revisar la consola para errores en la conversión BBCode→HTML

## Seguridad

- ✅ No recopila datos personales
- ✅ No realiza peticiones externas
- ✅ Código 100% open source
- ✅ Sin dependencias externas
- ✅ No requiere permisos especiales (solo APIs estándar del navegador)
- ✅ Todas las operaciones son locales (localStorage, DOM manipulation)

## Licencia

AGPL-3.0-or-later - Ver [LICENSE](LICENSE) para detalles completos.

## Enlaces

- **Repositorio**: https://github.com/MateoPalmeiro/shur2text
- **Issues**: https://github.com/MateoPalmeiro/shur2text/issues
- **Greasyfork**: https://greasyfork.org/es/scripts/556100-shur2text-forocoches-helper

---

*Documentación actualizada para v0.4.9: 2025-11-17*
