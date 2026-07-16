# Design — VisionExtract

A locked design system for this app. Every route shares this system; functional OCR, authentication, and export behavior stays independent from the visual layer.

## Genre

Playful — a warm paper workbench: friendly and tactile, but exact enough for dense OCR tables.

## Macrostructure family

- App pages: **Workbench**. Input and image context live beside the working table; the table is always the primary surface.
- Authentication: **Workbench entry**. A compact explanation and the access form share one panel.
- Navigation: **N1b adapted for an app**, with four real tool destinations and no dropdowns.
- Footer: **Ft5 Statement**, restrained to a single functional closing line.

## Theme

- Warm cream paper provides the canvas.
- Deep plum ink and indigo carry controls and focus.
- Pear, cyan, coral, and mint are role-specific utility accents; they never blend into gradients.
- Borders are quiet. Depth comes from compact shadows and offset button edges.

## Typography

- Display: Hanken Grotesk, weight 700, normal style.
- Body: Inter, weights 400–600.
- Mono: JetBrains Mono, weight 500, reserved for IDs, confidence, and timing.
- Display tracking: `-0.035em`.
- Long-form measure: `65ch` maximum.

## Spacing

The source is the 4-point named scale in `tokens.css`. App code uses named tokens or Tailwind utilities mapped to those tokens.

## Motion

- CSS transitions only; no motion dependency.
- Hover feedback is pointer-gated and uses transform only.
- Button presses move inward for immediate physical feedback.
- Focus rings appear instantly.
- Reduced motion removes spatial transforms and keeps short opacity feedback.

## Microinteractions stance

- Silent success for edits and exports; copy feedback changes the button label.
- Loading stays inline with honest labels.
- Reversible row deletion remains immediate; session replacement keeps its existing confirmation because it removes the whole workbook.
- Touch targets are at least 44 × 44 CSS pixels.

## CTA voice

- Primary: indigo fill, cream text, small physical edge, action-first labels.
- Secondary: paper surface with an ink border and compact shadow.
- Destructive: quiet text treatment until hover/focus, always paired with an icon or label.

## Per-page allowances

- App pages use no decorative imagery. Uploaded documents and tables are the visual content.
- Accent colours identify states and zones, not decoration for its own sake.
- Tables collapse into labelled record cards below 640 px.

## What pages MUST share

- Wordmark, palette, typography, button shape, focus treatment, panel depth, and heading rhythm.
- The same upload → review → export mental model.

## What pages MAY differ on

- Engine-specific labels and loading messages.
- AI Native session controls and metrics.
- Table column count and review warnings.

## Exports

### tokens.css

`tokens.css` at the project root is the canonical source and is imported by `app/globals.css`.

### Tailwind v4 `@theme`

`app/globals.css` maps the canonical roles to the existing semantic utility names (`primary`, `surface`, `outline`, and related roles) using `var(...)` references.

### DTCG `tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(97% 0.018 95)", "$type": "color" },
    "ink": { "$value": "oklch(22% 0.03 275)", "$type": "color" },
    "accent": { "$value": "oklch(52% 0.2 287)", "$type": "color" },
    "focus": { "$value": "oklch(8% 0.03 275)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "body": { "$value": "Inter, ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "outlier": { "$value": "JetBrains Mono, ui-monospace, monospace", "$type": "fontFamily" }
  },
  "space": {
    "3xs": { "$value": "0.25rem", "$type": "dimension" },
    "sm": { "$value": "1rem", "$type": "dimension" },
    "md": { "$value": "1.5rem", "$type": "dimension" },
    "xl": { "$value": "3rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 97% 0.018 95;
  --foreground: 22% 0.03 275;
  --card: 94% 0.028 95;
  --card-foreground: 22% 0.03 275;
  --primary: 52% 0.2 287;
  --primary-foreground: 98% 0.012 95;
  --secondary: 90% 0.036 95;
  --secondary-foreground: 40% 0.045 275;
  --muted: 84% 0.035 92;
  --muted-foreground: 49% 0.035 275;
  --destructive: 55% 0.2 25;
  --destructive-foreground: 98% 0.012 95;
  --border: 84% 0.035 92;
  --input: 84% 0.035 92;
  --ring: 8% 0.03 275;
  --radius: 0.75rem;
}
```
