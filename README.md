# shur2text

UserScript para Forocoches que añade un popup de ayuda flotante y movible. Facilita la creación de posts con formato BBCode: escribe texto plano, aplica formatos (Negrita, Cita, Spoiler, Color, Listas) y obtén el código. Recuerda su posición y estado (minimizado). Incluye botones para Copiar o Insertar el resultado en la respuesta rápida.

## Características

- 🎨 **Formatos BBCode**: Negrita, Cursiva, Subrayado, Cita, Spoiler, Color, URL y Listas
- 📍 **Posición recordada**: El popup mantiene su posición entre sesiones
- 🔽 **Minimizable**: Guarda el estado minimizado/maximizado
- 📋 **Copiar al portapapeles**: Copia el código BBCode generado
- ✏️ **Insertar directo**: Inserta el código en la respuesta rápida de Forocoches
- 🎯 **Arrastrable**: Mueve el popup a donde prefieras

## Instalación

1. Instala un gestor de userscripts en tu navegador:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari, Opera)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)

2. Haz clic en el siguiente enlace para instalar el script:
   - [Instalar shur2text.user.js](https://github.com/MateoPalmeiro/shur2text/raw/main/shur2text.user.js)

3. Confirma la instalación en tu gestor de userscripts

4. Visita [Forocoches](https://forocoches.com) y verás el popup flotante

## Uso

1. **Escribe tu texto** en el área de texto del popup
2. **Selecciona un formato** haciendo clic en uno de los botones (Negrita, Cita, etc.)
3. **Revisa el resultado** en el área "Resultado BBCode"
4. **Copia o Inserta** el código usando los botones de acción

### Formatos disponibles

- **Negrita**: Convierte el texto a `[b]texto[/b]`
- **Cursiva**: Convierte el texto a `[i]texto[/i]`
- **Subrayado**: Convierte el texto a `[u]texto[/u]`
- **Cita**: Envuelve el texto en `[quote]texto[/quote]`
- **Spoiler**: Oculta el texto con `[spoiler]texto[/spoiler]`
- **Color**: Permite elegir un color para el texto `[color=red]texto[/color]`
- **URL**: Solicita una URL y crea un enlace `[url=...]texto[/url]`
- **Lista**: Convierte líneas de texto en una lista BBCode (una línea = un item)

## Licencia

Este proyecto está bajo la licencia GPL-3.0 - ver el archivo [LICENSE](LICENSE) para más detalles.
