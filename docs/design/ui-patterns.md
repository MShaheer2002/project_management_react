# Trussen UI Design System & Patterns

> This document defines the exact UI patterns, design tokens, component styles, and conventions used across the Trussen application. Follow this guide when building new features, reviewing PRs, or onboarding new developers/designers.

---

## 1. Design Tokens

### Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `primary` | `#5f72ea` | `#5f72ea` | Buttons, links, active states, accents |
| `bg` | `#FFFFFF` | `#0F1115` | Page background |
| `card` | `#FFFFFF` | `#1C1F2B` | Cards, panels, modals |
| `sidebar` | `#F9FAFB` (gray-50) | `#151821` | Sidebar background |
| `border` | `#E5E7EB` (gray-200) | `#2A2F3A` | All borders |
| `text-primary` | `#1E1E1E` | `#E5E7EB` | Headings, primary text |
| `text-secondary` | `#6B7280` | `#9CA3AF` | Descriptions, labels |

### Gray Scale (used everywhere)

```
gray-50   → Subtle backgrounds, hover states (light)
gray-100  → Input backgrounds, badges, dividers
gray-200  → Borders, separators
gray-300  → Placeholder text, disabled states
gray-400  → Labels, hints, icons
gray-500  → Secondary text, descriptions
gray-600  → Body text
gray-700  → Strong body text
gray-800  → Headings
gray-900  → Primary headings
```

### Dark Mode Pattern

Every element uses the `dark:` prefix. Standard mappings:

```
bg-white                → dark:bg-bg-dark          (page)
bg-white                → dark:bg-card-dark         (cards)
bg-gray-50              → dark:bg-white/5           (subtle bg)
border-gray-200         → dark:border-border-dark   (borders)
text-gray-800           → dark:text-gray-200        (text)
text-gray-400           → dark:text-gray-500        (labels)
hover:bg-gray-100       → dark:hover:bg-white/5     (hover)
hover:bg-gray-50        → dark:hover:bg-white/[0.03](subtle hover)
```

### Font

```
Font family: "Inter", ui-sans-serif, system-ui, sans-serif
```

---

## 2. Typography

| Element | Classes | Example |
|---|---|---|
| Page heading | `text-lg font-semibold` | "Integrations", "Dashboard" |
| Section heading | `text-sm font-bold uppercase tracking-wider text-gray-400` | "ATTACHMENTS", "SUBTASKS" |
| Card title | `text-sm font-semibold text-gray-800 dark:text-gray-100` | Issue title in list |
| Body text | `text-sm text-gray-600 dark:text-gray-300` | Descriptions |
| Label | `text-[11px] font-semibold uppercase tracking-wider text-gray-400` | Form labels |
| Tiny label | `text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400` | Field labels |
| Hint text | `text-xs text-gray-400` | "Only images and videos" |
| Badge text | `text-[10px] font-bold uppercase tracking-wider` | "Connected", "Bug" |
| Code/mono | `font-mono text-[10px]` | "@name", keyboard shortcuts |

### Weights

- `font-medium` (500) — body text, nav links
- `font-semibold` (600) — headings, emphasized text, buttons
- `font-bold` (700) — page titles, important labels, badges

---

## 3. Layout Structure

### Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (w-60 / w-14)  │  TopNavbar (h-14)                     │
│                         │─────────────────────────────────────── │
│  Workspace selector     │  Main Content (flex-1)                │
│  Search trigger         │                                       │
│  Navigation links       │  <Outlet /> — page content            │
│  Teams (expandable)     │                                       │
│  Organization           │                                       │
│  Theme toggle           │                                       │
│  User profile           │                         ContextPanel  │
│                         │                         (w-[450px])   │
│                         │                         or            │
│                         │                         TrussenAiPanel│
│                         │                         (w-[360px])   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Dimensions

| Element | Width/Height | Class |
|---|---|---|
| Sidebar (expanded) | 240px | `w-60` |
| Sidebar (collapsed) | 56px | `w-14` |
| TopNavbar | 56px | `h-14` |
| ContextPanel | 450px | `w-[450px]` (fixed overlay) |
| Trussen AI Panel | 360px (resizable 300-600px) | `w-[360px]` (flex child) |
| Page content max-width | varies | `max-w-3xl` to `max-w-4xl` |

### Spacing Scale

```
p-1.5   (6px)   — icon buttons, tiny padding
p-2     (8px)   — small buttons, compact cards
p-3     (12px)  — input padding, card inner spacing
p-4     (16px)  — standard card/section padding
p-5     (20px)  — medium card padding
p-6     (24px)  — large card/panel padding
p-8     (32px)  — page-level padding (desktop)
p-10    (40px)  — wide page padding
```

### Gap Scale

```
gap-1     (4px)   — tight inline elements
gap-1.5   (6px)   — badges, chips
gap-2     (8px)   — form fields, small lists
gap-3     (12px)  — card contents
gap-4     (16px)  — sections, form groups
gap-6     (24px)  — major sections
```

---

## 4. Component Patterns

### Buttons

**Primary (CTA)**
```html
<button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
  text-sm font-semibold text-white hover:bg-primary/90 transition-all
  disabled:opacity-50 active:scale-[0.98]">
```

**Secondary (outline)**
```html
<button className="rounded-lg border border-gray-200 bg-white px-3 py-2
  text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300
  dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300
  dark:hover:bg-white/5 transition-all">
```

**Icon button**
```html
<button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100
  hover:text-gray-600 dark:hover:bg-white/5 transition-colors">
```

**Destructive**
```html
<button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold
  text-white hover:bg-red-600 disabled:opacity-50">
```

**Pill/chip button**
```html
<button className="rounded-full border border-gray-200 px-2.5 py-1
  text-[10px] font-medium text-gray-500 hover:border-primary/30
  hover:bg-primary/5 hover:text-primary dark:border-border-dark">
```

### Form Inputs

**Text input**
```html
<input className="w-full rounded-lg border border-gray-200 bg-transparent
  px-3 py-2 text-sm outline-none transition-all placeholder:text-gray-400
  focus:border-primary/40 focus:ring-1 focus:ring-primary/10
  dark:border-border-dark dark:focus:border-primary/40" />
```

**Select**
```html
<div className="relative">
  <select className="w-full border border-gray-200 bg-transparent px-3 py-2
    text-sm rounded-lg outline-none appearance-none transition-all
    focus:border-primary/40 focus:ring-1 focus:ring-primary/10
    dark:border-border-dark">
  </select>
  <ChevronDown size={12} className="absolute right-3 top-1/2
    -translate-y-1/2 text-gray-400 pointer-events-none" />
</div>
```

**Textarea**
```html
<textarea className="w-full rounded-lg border border-gray-200 bg-transparent
  px-3 py-2.5 text-sm outline-none transition-all resize-none
  placeholder:text-gray-400 focus:border-primary/40 focus:ring-1
  focus:ring-primary/10 dark:border-border-dark min-h-[80px]" />
```

**Form label**
```html
<label className="text-[11px] font-semibold uppercase tracking-wider
  text-gray-400 flex items-center gap-2">
  <Icon size={12} className="text-gray-400" /> Label
</label>
```

### Cards

**Standard card**
```html
<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm
  dark:border-border-dark dark:bg-card-dark">
```

**Integration card (with hover)**
```html
<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm
  hover:border-primary/50 transition-all group
  dark:bg-card-dark dark:border-border-dark">
```

**Card with sections**
```html
<div className="rounded-2xl border border-gray-200 bg-white shadow-sm
  dark:border-border-dark dark:bg-card-dark">
  <div className="px-6 pt-6 pb-4">Header content</div>
  <div className="border-t border-gray-100 dark:border-border-dark" />
  <div className="px-6 py-4">Body content</div>
</div>
```

### Badges

**Status badge**
```html
<span className="rounded-full bg-green-500/10 text-green-500
  px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
  Connected
</span>
```

**Priority badge colors:**
```
urgent  → text-red-500 bg-red-500/10
high    → text-orange-500 bg-orange-500/10
medium  → text-blue-500 bg-blue-500/10
low     → text-gray-500 bg-gray-500/10
```

**Type badge colors:**
```
bug     → text-red-500 bg-red-500/10
task    → text-gray-600 bg-gray-500/10
issue   → text-purple-500 bg-purple-500/10
```

### Modals

```html
<!-- Backdrop -->
<div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />

<!-- Dialog -->
<div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm
  -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200
  bg-white p-6 shadow-2xl dark:border-border-dark dark:bg-bg-dark">
```

### Dropdown Menu

```html
<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-sidebar-dark
  border border-gray-200 dark:border-border-dark rounded-xl shadow-2xl
  z-50 overflow-hidden">
  <div className="p-1">
    <button className="w-full flex items-center gap-3 px-3 py-2
      rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm
      text-left transition-colors">
```

---

## 5. Page Patterns

### Page Header

```html
<header className="flex items-center justify-between px-6 py-4
  border-b border-gray-200 dark:border-border-dark">
  <div className="flex items-center gap-4">
    <h1 className="text-lg font-semibold">Page Title</h1>
    <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded
      bg-gray-100 dark:bg-gray-800">Count</span>
  </div>
  <div className="flex items-center gap-2">
    <!-- Actions -->
  </div>
</header>
```

### Page Content with Sidebar

```html
<div className="flex-1 flex overflow-hidden">
  <div className="flex-1 overflow-y-auto scrollbar-hide">
    <div className="max-w-3xl mx-auto px-8 py-6 space-y-6 pb-32">
      <!-- Content -->
    </div>
  </div>
  <div className="w-[340px] border-l border-gray-200 bg-white px-6 py-6
    dark:border-border-dark dark:bg-card-dark overflow-y-auto scrollbar-hide">
    <!-- Sidebar properties -->
  </div>
</div>
```

### Settings Item

```html
<div className="flex flex-col sm:flex-row sm:items-start justify-between
  gap-4 p-4 bg-white dark:bg-card-dark border border-gray-200
  dark:border-border-dark rounded-xl shadow-sm">
  <div className="space-y-1">
    <h4 className="text-sm font-semibold">Label</h4>
    <p className="text-xs text-gray-400 max-w-md">Description</p>
  </div>
  <div><!-- Control --></div>
</div>
```

---

## 6. Animation Patterns

### Motion Library (motion/react)

**Page entrance:**
```tsx
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.2, ease: "easeOut" }}
```

**Modal entrance:**
```tsx
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 10 }}
```

**Slide-in panel:**
```tsx
initial={{ x: "100%" }}
animate={{ x: 0 }}
exit={{ x: "100%" }}
transition={{ type: "spring", damping: 30, stiffness: 300 }}
```

**Height expand:**
```tsx
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: "auto" }}
exit={{ opacity: 0, height: 0 }}
```

### CSS Transitions

```
transition-colors    → hover color changes (fast)
transition-all       → general changes (all properties)
active:scale-95      → button press feedback
active:scale-[0.98]  → subtle press feedback
```

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Usage |
|---|---|---|
| Default | <640px | Mobile — single column, compact |
| `sm:` | 640px+ | Tablet — wider padding |
| `md:` | 768px+ | 2-column grids |
| `lg:` | 1024px+ | 3-4 column grids, full sidebar |
| `xl:` | 1280px+ | Extra wide layouts |

### Common Responsive Patterns

```
px-4 sm:px-6 lg:px-8          → Page padding
grid-cols-1 md:grid-cols-2    → Form fields
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 → Cards
hidden sm:inline              → Show on desktop only
```

---

## 8. Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-700 rounded-full; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-600; }
```

Use `scrollbar-hide` utility class to hide scrollbar completely.

---

## 9. Z-Index Layers

| Layer | Z-Index | Usage |
|---|---|---|
| Content | `z-0` | Normal page content |
| Sticky headers | `z-30` | Page headers, floating buttons |
| Panels | `z-40` | Context panel, backdrop |
| Modals | `z-50` | Modals, dropdowns, AI panel |
| Flyouts | `z-60` | Sidebar flyout menus |
| Command palette | `z-[100]` | Global command palette |
| Toast | `z-[110]` | Toast notifications |

---

## 10. AI Component Patterns

### AI Badge
```html
<div className="flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1">
  <Sparkles size={11} className="text-primary" />
  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
    Trussen AI
  </span>
</div>
```

### AI Send Button
```html
<button className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
  hasInput
    ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
    : 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600'
}`}>
  <ArrowUp size={14} />
</button>
```

### Chat Bubble (User)
```html
<div className="flex justify-end">
  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2
    text-[12px] leading-[1.6] text-white">
    User message
  </div>
</div>
```

### Chat Bubble (AI)
```html
<div className="flex justify-start">
  <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2
    text-[12px] leading-[1.6] text-gray-800
    dark:bg-white/[0.05] dark:text-gray-200">
    AI response
  </div>
</div>
```

### Suggestion Chips
```html
<div className="flex flex-wrap gap-1.5">
  <button className="rounded-full border border-gray-200 px-2.5 py-1
    text-[10px] font-medium text-gray-500 hover:border-primary/30
    hover:bg-primary/5 hover:text-primary
    dark:border-border-dark dark:hover:border-primary/30">
    Suggestion text
  </button>
</div>
```

### @ Mention Dropdown
```html
<div className="absolute left-0 top-full z-50 mt-1 w-[280px] max-h-56
  overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl
  dark:border-border-dark dark:bg-card-dark">
  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5
    text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]">
    <div className="flex h-5 w-5 items-center justify-center rounded-md
      text-primary bg-primary/10 text-[9px] font-bold">A</div>
    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
      Member Name
    </span>
  </button>
</div>
```

---

## 11. Do's and Don'ts

### Do
- Use `dark:` variant for every visual element
- Use `transition-all` or `transition-colors` on interactive elements
- Use `text-gray-400` for labels/hints, `text-gray-800` for content
- Use `border-gray-200 dark:border-border-dark` for all borders
- Use `rounded-lg` for inputs/buttons, `rounded-xl` for cards, `rounded-2xl` for panels
- Use `text-[10px]` to `text-sm` range — never `text-base` or larger in forms
- Use `font-semibold` for headings, `font-medium` for body
- Use `disabled:opacity-50` for disabled states
- Use `active:scale-[0.98]` or `active:scale-95` for button press feedback

### Don't
- Don't use gradients (except the primary button shadow `shadow-primary/20`)
- Don't use emojis in the UI
- Don't use `text-base` or `text-lg` for form elements
- Don't use `shadow-md` or `shadow-lg` on cards — use `shadow-sm` or none
- Don't use `ring-2` — use `ring-1 ring-primary/10` for focus states
- Don't use bright/saturated colors — use `/10` or `/20` opacity variants
- Don't use `fixed` positioning for panels that should push content (use flex)
- Don't add loading spinners larger than 16px
- Don't use custom fonts — stick to Inter
