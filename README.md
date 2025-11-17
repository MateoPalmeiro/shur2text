# shur2text – Forocoches Helper

shur2text is a userscript for Forocoches that adds a floating helper window next to the quick reply editor.  
It is designed to make writing and formatting posts more comfortable when working with BBCode-heavy replies.

The script provides two complementary modes:

- **Technical Mode (BBCode)** – direct BBCode editing with a toolbar for common tags and text transforms.
- **Visual Mode (WYSIWYG)** – a contentEditable editor with a visual toolbar, while still emitting valid BBCode for Forocoches.

Position, mode and window state are persisted between page loads so the helper behaves like a small “tool window” for the forum.

---

## Features

### General

- Floating popup attached to `https://forocoches.com/foro/*`.
- Draggable, minimizable, and with last position remembered via `localStorage`.
- Works with both:
  - Forocoches WYSIWYG quick reply editor (iframe).
  - Plain textarea mode.
- Non-intrusive error notifications via a toast instead of blocking `alert()` calls.

### Technical Mode (BBCode)

A low-level BBCode editor intended for users who prefer to see and control the tags explicitly.

- “Base text” textarea (input) and “Result (BBCode)” textarea (output).
- Toolbar with typical Forocoches-style BBCode helpers:
  - `[b]`, `[i]`, `[u]`, `[s]`
  - `[quote]`, `[code]`, `[spoiler]`
  - `[left]`, `[center]`, `[right]`
  - `[list]`, `[list=1]`, `[*]`
  - `[url]`
  - `[color=...]`
  - `[size=1..7]` (via dropdown)
- Behaviour depending on selection:
  - If there is a selection in the input textarea, the tag is applied around the selection.
  - If there is no selection, the transformation is applied to the entire input.
- Text transforms:
  - To upper case.
  - To lower case.
  - Alternating case (“aLtErNaTiNg” style).
- “Raw” button to keep text untouched and use the helper only for copying/inserting.

### Visual Mode (WYSIWYG)

A contentEditable editor for those who prefer to work visually, with BBCode generated under the hood.

- Visual toolbar based on `document.execCommand`:
  - Bold, italic, underline, strike-through.
  - Unordered and ordered lists.
  - Left, center, right alignment.
  - Link insertion.
  - Font size dropdown (mapped to BBCode `[size]`).
  - Font color picker (mapped to `foreColor` and then to `[color]` BBCode).
- Additional “custom” commands implemented directly on the DOM selection:
  - Quote block (maps to `[quote]`).
  - Code block (maps to `[code]`).
  - Spoiler block (maps to `[spoiler]`).
  - Uppercase, lowercase, alternating case transforms.
- Toolbar reflects the current selection state as far as `execCommand` allows:
  - Active buttons are visually highlighted.
  - Alignment buttons stay in sync with the current paragraph alignment.

### Live Preview (Technical Mode)

An optional side panel that renders the current BBCode to HTML.

- Converts typical Forocoches BBCode to HTML:
  - `[b]`, `[i]`, `[u]`, `[s]`, `[quote]`, `[url]`, `[color]`, `[size]`
  - `[left]`, `[center]`, `[right]`
  - `[code]` (rendered as `<pre>` with monospace styling)
  - `[spoiler]` (rendered as a dark span, content hidden by default color)
  - `[list]`, `[list=1]`, `[*]` → `<ul>`, `<ol>`, `<li>`
- Attempts to clean up common artefacts:
  - Unwanted `<br>` around block tags.
  - Minor layout glitches caused by nested tags.
- Preview visibility is configurable and persisted per user:
  - Only available in Technical Mode.
  - Remains in the last chosen state across page loads (unless the popup is minimized).

### Color Picker

Unified color selection used by both modes.

- Small dialog with:
  - A grid of “classic” swatches (white, grey, black, red, yellow, green, cyan, blue, magenta).
  - Native `<input type="color">` for arbitrary colors.
- Technical Mode:
  - Applies `[color=<chosen>]...[/color]` to the current selection or whole text.
- Visual Mode:
  - Applies `foreColor` to the current selection using `execCommand`.

### Copy / Insert helpers

- **Copy**:
  - Prefers the BBCode output textarea if it has content.
  - Falls back to:
    - Technical Mode input, or
    - Visual Mode content converted to BBCode.
  - Uses the Clipboard API when available, with a fallback to manual copy.
- **Insert**:
  - Injects the BBCode into the Forocoches quick reply editor:
    - If the WYSIWYG iframe is available, uses `insertText` when possible.
    - Falls back to appending HTML with `<br>` when required.
    - If only a textarea is present, appends the BBCode there.
- “Use ↑” (Technical Mode):
  - Copies the current output (result) back into the input to chain multiple transformations.

---

## Installation

### From GreasyFork (recommended)

Install the script from GreasyFork:

- https://greasyfork.org/es/scripts/556100-shur2text-forocoches-helper

You will need a userscript manager, e.g.:

- [Tampermonkey](https://www.tampermonkey.net/)
- [Violentmonkey](https://violentmonkey.github.io/)
- [Greasemonkey](https://www.greasespot.net/) (where still supported)

Once installed, the helper will automatically load on any `https://forocoches.com/foro/*` page.

### From GitHub (manual install)

1. Open the raw script file:

   - `https://github.com/MateoPalmeiro/shur2text/raw/main/shur2text.user.js`

2. In your userscript manager, create a new script and paste the contents of `shur2text.user.js`, or use the “Install from URL” option if provided.

Updates will be handled automatically as long as the `@downloadURL` and `@updateURL` headers are preserved.

---

## Usage

1. Open any thread on Forocoches.
2. Scroll down to the quick reply editor; shur2text will appear as a floating window.
3. Drag the header to move it where it is least annoying. The position is remembered.
4. Use the mode toggle in the header:
   - `[T]` → Technical (BBCode).
   - `[V]` → Visual (WYSIWYG).
5. Optionally enable the live preview in Technical Mode using the preview toggle.
6. Write and format your text:
   - Use the toolbar to wrap selections or transform text.
   - Copy the result to the clipboard or insert it into the quick reply box with a single click.
7. Minimize the helper if you do not need it; the minimized state is also remembered.

The script does not send requests, auto-submit forms or modify any server-side behaviour. It only manipulates the DOM on the client side to help with text composition.

---

## Implementation Notes

A few details for anyone reading or modifying the code:

- The script is wrapped in an IIFE with a hard check to skip execution inside iframes.
- Popup and preview state is persisted in `localStorage` under versioned keys:
  - `fc_popup_pos_v2`
  - `fc_popup_min_v2`
  - `fc_popup_mode_v2`
  - `fc_popup_preview_v1`
- There is a small cleaner that periodically removes accidental clones of the popup and preview inside the Forocoches editor iframe.
- Visual Mode uses `document.execCommand` despite its deprecation status; this is sufficient for a userscript targeting current browsers.
- BBCode ↔ HTML conversion is implemented via straightforward regex-based passes:
  - It is not a full parser and may not handle pathological nested tag combinations, but is adequate for normal forum usage.

---

## Development

Basic workflow:

1. Clone the repository:

   ```bash
   git clone https://github.com/MateoPalmeiro/shur2text.git
   cd shur2text
