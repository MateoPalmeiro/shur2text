# Documentación Técnica - Shur2Text

## Descripción General

Shur2Text es un UserScript para Greasyfork diseñado específicamente para mejorar la experiencia de publicación en el foro Forocoches mediante la automatización de la generación de código BBCode.

## Características Técnicas

### 1. Metadatos del UserScript

```javascript
// @name         Shur2Text - BBCode Helper for Forocoches
// @version      1.0.0
// @match        https://forocoches.com/*
// @match        https://www.forocoches.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
```

- **Compatibilidad**: Forocoches.com (HTTP y HTTPS)
- **Permisos**: Estilos personalizados y almacenamiento persistente
- **Licencia**: GPL-3.0-or-later

### 2. Funcionalidades Principales

#### A. Interfaz Flotante Arrastrable
- Popup movible con posición recordada entre sesiones
- Estado minimizado/maximizado persistente
- Diseño responsive y moderno

#### B. Formatos BBCode Soportados

| Formato | Sintaxis BBCode | Descripción |
|---------|----------------|-------------|
| Negrita | `[b]texto[/b]` | Texto en negrita |
| Cursiva | `[i]texto[/i]` | Texto en cursiva |
| Subrayado | `[u]texto[/u]` | Texto subrayado |
| Cita | `[quote]texto[/quote]` | Bloque de cita |
| Spoiler | `[spoiler]texto[/spoiler]` | Contenido oculto |
| Color | `[color=red]texto[/color]` | Texto con color |
| URL | `[url=http://...]texto[/url]` | Enlace |
| Lista | `[list][*]item1[*]item2[/list]` | Lista de elementos |

#### C. Selector de Colores
- Paleta predefinida con 8 colores comunes
- Interfaz visual para selección rápida
- Integración directa con BBCode color

#### D. Acciones de Salida

1. **Copiar**: Copia el código BBCode al portapapeles
2. **Insertar**: Inserta directamente en el textarea de respuesta rápida

### 3. Almacenamiento Persistente

El script utiliza las APIs de Greasemonkey para almacenar:
- `popupX`: Posición X del popup
- `popupY`: Posición Y del popup
- `isMinimized`: Estado minimizado/maximizado

```javascript
GM_getValue('popupX', defaultValue)
GM_setValue('popupX', value)
```

### 4. Selectores de Elementos del Foro

El script busca el textarea de respuesta rápida usando múltiples selectores para máxima compatibilidad:

```javascript
const quickReply = document.querySelector('textarea[name="message"]') || 
                  document.querySelector('#vB_Editor_001_textarea') ||
                  document.querySelector('textarea.editor');
```

### 5. Arquitectura del Código

```
shur2text.user.js
├── Metadatos UserScript
├── Estilos CSS (GM_addStyle)
├── BBCodeFormatter (objeto con funciones)
│   ├── bold()
│   ├── italic()
│   ├── underline()
│   ├── quote()
│   ├── spoiler()
│   ├── color()
│   ├── url()
│   └── list()
├── createPopup() - Creación del DOM
├── makeDraggable() - Sistema de arrastre
└── init() - Inicialización y event listeners
```

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
3. **Greasemonkey** - Solo Firefox, limitado a GM4+ APIs

## Desarrollo y Contribución

### Requisitos
- Editor de código con soporte JavaScript
- Navegador con gestor de userscripts
- Conocimientos básicos de:
  - JavaScript ES6+
  - DOM manipulation
  - CSS3
  - BBCode syntax

### Testing Local
1. Clonar el repositorio
2. Instalar el script en tu gestor de userscripts
3. Visitar forocoches.com o usar test.html
4. Verificar funcionalidad del popup

### Estructura de Commits
- `feat:` Nuevas características
- `fix:` Corrección de bugs
- `docs:` Documentación
- `style:` Formato de código
- `refactor:` Refactorización

## Solución de Problemas

### El popup no aparece
- Verificar que estás en forocoches.com
- Comprobar que el script está activado en tu gestor
- Revisar la consola del navegador para errores

### El botón "Insertar" no funciona
- Asegurarse de que hay un textarea de respuesta rápida visible
- El script busca varios selectores comunes
- Como alternativa, usar el botón "Copiar"

### La posición no se guarda
- Verificar que los permisos GM_getValue/GM_setValue están otorgados
- Comprobar la configuración del gestor de userscripts

## Seguridad

- ✅ No recopila datos personales
- ✅ No realiza peticiones externas
- ✅ Código 100% open source
- ✅ Sin dependencias externas
- ✅ Permisos mínimos requeridos

## Licencia

GPL-3.0-or-later - Ver [LICENSE](LICENSE) para detalles completos.

## Enlaces

- **Repositorio**: https://github.com/MateoPalmeiro/shur2text
- **Issues**: https://github.com/MateoPalmeiro/shur2text/issues
- **Greasyfork**: (Pendiente de publicación)

---

*Documentación actualizada: 2025-11-17*
