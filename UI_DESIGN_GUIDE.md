# Project Management - UI Design Guide

This document serves as the primary reference for the design system, typography, color tokens, and motion patterns used throughout the application.

---

## 🎨 Color Palette

The project uses a CSS-first token system (Tailwind v4) with full Light and Dark mode support.

### Core Tokens
| Token | Variable | Value (HEX) | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary` | `#5f72ea` | Buttons, Active states, Links |
| **Background (L)** | `--color-bg-light` | `#FFFFFF` | Main page background (Light) |
| **Background (D)** | `--color-bg-dark` | `#0F1115` | Main page background (Dark) |
| **Sidebar (D)** | `--color-sidebar-dark` | `#151821` | Navigation sidebar background |
| **Card (D)** | `--color-card-dark` | `#1C1F2B` | Surface components (Dark) |
| **Border (D)** | `--color-border-dark` | `#2A2F3A` | Dividers and Borders (Dark) |

### Status Colors
- **Success**: `text-green-500` / `bg-green-500/10`
- **Warning**: `text-orange-500` / `bg-orange-500/10`
- **Error/Danger**: `text-red-500` / `bg-red-500/10`
- **Info**: `text-blue-500` / `bg-blue-500/10`

---

## 🔡 Typography

- **Font Family**: `Inter`, sans-serif (Custom defined as `--font-sans`)
- **Default Weight**: `font-medium` (400/500)
- **Header Weight**: `font-bold` (700)
- **Extreme Weight**: `font-black` (900) - *Used for branding and major titles.*

### Sizing Scale
- **xs**: 12px (Captions, Metadata)
- **sm**: 14px (Body text, Buttons)
- **base**: 16px (Standard text)
- **lg**: 18px (H3 / Component titles)
- **xl**: 20px (H2 / Section titles)
- **2xl**: 24px (H1 / Page titles)

---

## 📐 Layout & Spacing

### Structure
- **Sidebar Width**: `256px` (expanded) / `64px` (collapsed).
- **Page Outer Padding**: `p-8` or `px-6 pt-6`.
- **Max Content Width**: `max-w-6xl` (approx 1152px) for detail pages.
- **Header Height**: Variable, but usually `h-16` or `pt-6`.

### Spacing Patterns
- **Section Gaps**: `space-y-8` or `gap-8`.
- **Card Padding**: `p-6` or `p-8`.
- **Grid Gutters**: `gap-6`.

---

## 🧱 Components

### 1. Cards
- **Corners**: `rounded-2xl` (16px) or `rounded-xl`.
- **Border**: `border border-gray-200` (Light) / `border-border-dark` (Dark).
- **Shadow**: `shadow-sm` for standard cards, `shadow-xl shadow-primary/20` for active/floating elements.

### 2. Buttons
- **Primary**: `bg-primary font-bold text-white shadow-lg shadow-primary/25`.
- **Secondary/Outline**: `border-gray-200 hover:bg-gray-50`.
- **Icon Buttons**: `p-2 rounded-lg transition-all active:scale-95`.

### 3. Inputs & Selects
- **Styling**: `bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent`.
- **States**: `focus:ring-2 focus:ring-primary/20`.

---

## ✨ Motion & Animations

The app uses `motion` (framer-motion) for all interactive states.

### Tab Underline Transition
Used in `ProjectDetailPage` and `DepartmentDetailPage`.
```tsx
<motion.div 
  layoutId="activeTab" 
  className="absolute bottom-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(95,114,234,0.5)]" 
/>
```

### Page & Content Entrance
Applied to tab content and page transitions.
- **Initial**: `{ opacity: 0, y: 10 }`
- **Animate**: `{ opacity: 1, y: 0 }`
- **Transition**: `{ duration: 0.2, ease: "easeOut" }`

### Hover Effects
- **Card Hover**: `hover:border-primary/50 hover:shadow-md transition-all`.
- **Icon Hover**: `hover:scale-110 active:scale-95`.

---

## 🌙 Theme Implementation

Themes are handled via a `.dark` class on a parent container (usually `html` or `body`).

> [!TIP]
> Always use semantic colors like `@apply text-gray-400 dark:text-gray-500` to ensure readability across themes.

---

## 🔍 Visual Reference Examples
- **Breadcrumbs**: `ChevronRight` (size 12), text-gray-400.
- **Avatar Stacks**: `-space-x-2`, borders matching the card background.
- **Progress Bars**: `h-1.5 rounded-full overflow-hidden`.
