# AI Prompt Archive: UI/UX Design & Visual Restoration

This document archives the design prompts, aesthetic requirements, and accessibility guidelines utilized during the creation, refinement, and visual restoration of the ClearDoc user interface.

---

## 1. Visual Identity & Design System Formulation

### Prompt: Editorial Healthcare & Civic Accessibility Palette
```text
Act as a Creative Director and Design Systems Lead.

Establish an editorial, human-centered design token system for ClearDoc. The platform simplifies complex civic, utility, medical, and legal paperwork for everyday citizens.

Aesthetic Objectives:
- Avoid generic AI SaaS aesthetics (neon purple gradients, dark floating glass cards, ungrounded glow effects).
- Create a trustworthy, civic-grade visual language reminiscent of premium editorial publications and Scandinavian public healthcare services.
- Define a strict color palette:
  - Deep Teal (#003135): Primary brand anchor, headers, and high-emphasis typography.
  - Ocean Teal (#024950): Secondary surfaces, badge borders, and card headers.
  - Terracotta (#964734): Urgent action indicators, impending deadline warnings, and alert highlights.
  - Bright Cyan (#0FA4AF): Interactive focal points, upload dropzones, and active states.
  - Light Cyan (#AFDDE5): Soft tint fills, active pill tags, and secondary backgrounds.
  - Soft Canvas (#F5F7F5): Low-strain natural background surface.
  - Pure White (#FFFFFF): Card foregrounds and high-contrast containers.

Deliver Tailwind CSS configuration extending colors, typography, borders, and shadows to enforce this identity across all components.
```

---

## 2. Inclusive Accessibility & Universal Design

### Prompt: WCAG AAA Accessibility Controls & High-Contrast Mode
```text
Act as a Senior Accessibility (a11y) Engineer and UI Specialist.

Design an Accessibility Settings suite for ClearDoc that satisfies WCAG 2.1 AAA criteria:
1. High-Contrast Mode:
   - Provide an instant toggle transforming the canvas into stark black, deep navy, and crisp white borders with minimum 7:1 contrast ratios.
2. Dynamic Font Scaling:
   - Implement three reading tiers: Normal (100%), Large (112.5%), and Extra Large (125%) without breaking responsive flex and grid layouts.
3. Dyslexia-Friendly & Legible Typography:
   - Ensure clean sans-serif type hierarchy with elevated line heights (1.6 to 1.8), generous character tracking, and clear paragraph separation.
4. Reduced Motion Support:
   - Respect `prefers-reduced-motion` media queries and provide an in-app toggle to disable micro-animations for neurodivergent or vestibular-sensitive users.
5. Screen Reader & Keyboard Navigation:
   - Implement semantic ARIA landmarks, logical tab indexing, focus visible outlines, and skip-to-content anchors.
```

---

## 3. Core Interface & Document Breakdown Architecture

### Prompt: Results Dashboard Layout & Priority Hierarchy
```text
Act as a Principal Product Designer.

Design the ClearDoc Document Explanation Dashboard. When a user uploads a confusing document, the resulting breakdown must answer three primary questions in under 5 seconds:
1. "What is this document?" (Document Type & Simple Summary)
2. "Do I owe anything or have a deadline?" (Deadline & Financial Alert Card)
3. "What exactly do I need to do next?" (Step-by-step Action Checklist)

Layout Requirements:
- Executive Summary Banner: Key takeaway presented in one or two plain-English sentences.
- Priority Metadata Bar: Category badge, confidence level, date identified, and total amount due (highlighted with Terracotta badges if critical).
- Action Items List: Interactive task list allowing users to check off required steps (e.g., "Pay bill before March 15", "Call clinic for follow-up").
- Audio Read-Aloud Toolbar: Accessible Web Speech synthesis player with play, pause, stop, speed rate controls (0.75x to 1.5x), and progress indicators.
- Interactive Grounded Q&A: A conversation module where users can ask questions strictly grounded in the document contents, complete with suggested starter chips ("What happens if I miss the deadline?", "Are there penalty fees?").
```

---

## 4. Visual Recovery & Polish Prompt

### Prompt: Restoring Premium Aesthetics & Eliminating CSS Regressions
```text
Act as a Senior React Engineer and CSS Specialist.

Our ClearDoc frontend experienced a visual regression where dark-mode utilities (e.g., bg-noir, dark: classes) leaked into the clean editorial theme, causing missing utility classes, broken Tailwind layers, and muddy contrast.

Audit and restore the application:
1. Remove all undefined custom classes (such as `bg-noir`) and replace them with design system tokens (`bg-brand-deep-teal`, `bg-brand-canvas`).
2. Clean up `@apply` statements in `apps/frontend/src/index.css` to prevent PostCSS build failures.
3. Restore polished shadows (`shadow-sm`, `shadow-md` with subtle border rings `ring-1 ring-black/5`).
4. Ensure all modal overlays, sticky navigation bars, and drag-and-drop file zones maintain smooth transition curves (`transition-all duration-200 ease-in-out`).
5. Verify zero layout shifting (CLS) across mobile (375px), tablet (768px), and desktop (1280px) breakpoints.
```
