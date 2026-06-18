# Accessibility Verification (WCAG 2.2 Compliant)

The EcoTrack AI Platform client portal is designed to provide equal access for users with disabilities, meeting standard **Web Content Accessibility Guidelines (WCAG) 2.2** at level AA.

---

## Key Core Pillars

### 1. High Contrast Styling
- Contrast ratios for regular text exceed the minimum target of **4.5:1** against backgrounds.
- High-contrast colors are defined using CSS custom property variables inside [index.css](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/src/index.css), allowing themes to override colors dynamically.
- Interactive controls and states have bright glow outlines (`--primary` and `--border-glow`) to ensure focus outlines are easily visible.

### 2. Screen Reader Compatibility
- Implemented using semantic HTML5 elements: `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`.
- Form inputs have matched label nodes using `htmlFor` properties.
- Dynamic charts (drawn with SVGs) include labels and titles so screen readers can narrate carbon summaries.
- Alerts and error banners include `aria-live="polite"` configurations.

### 3. Keyboard-Only Navigation
- All interactive controls (buttons, inputs, sliders, selects, anchor tags) can be navigated using `Tab` and `Shift+Tab`.
- Action events support `Enter` and `Space` keypresses.
- A logical tab hierarchy matches the visual reading flow.

### 4. Dynamic Text Scaling
- Used relative units (`rem`, `em`, `%`) instead of absolute pixel limits for text and sizes.
- Layouts are built using flex wraps and responsive CSS grids, preventing text truncation when users increase font scaling in browser settings (up to 200%).

---

## Accessibility Verification Matrix

| WCAG 2.2 Criteria | Platform Support | Implementation Details |
| :--- | :--- | :--- |
| **1.1.1 Non-text Content** | Supported | SVGs in charts have descriptive `title` tags. |
| **1.4.3 Contrast (Minimum)** | Supported | Text matches or exceeds 4.5:1 ratio against slate base. |
| **2.1.1 Keyboard** | Supported | Focus states display highlights on tabs and sliders. |
| **2.4.3 Focus Order** | Supported | Sequential tab indices follow top-to-bottom grid blocks. |
| **3.3.2 Labels or Instructions** | Supported | All input forms are accompanied by label blocks. |
| **4.1.2 Name, Role, Value** | Supported | Standard HTML tags define element functions. |
| **1.4.12 Text Spacing** | Supported | Line heights set to 1.6 in root stylesheet. |
