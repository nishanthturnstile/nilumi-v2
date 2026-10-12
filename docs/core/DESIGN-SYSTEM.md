# Nilumi design system — standalone reproduction guide

**Version:** Pastel Rooms v1. **Prepared:** 11 October 2026. **Audience:** designers, developers, and coding agents reproducing this system in another application, including Expo on Android and iOS.

This is the complete portable visual specification. Copy this Markdown file into your other project and use its values and recipes to build your own components. Essential tokens, measurements, behavior, and adaptation rules are embedded here; no other Nilumi file or screenshot is required to understand the specification. Font and icon assets must still be obtained and bundled in the receiving app.

## Contents

- [Authority and interpretation](#authority-and-interpretation)
- [Visual principles](#visual-principles)
- [Color system](#color-system)
- [Typography](#typography)
- [Geometry and responsive layout](#geometry-and-responsive-layout)
- [Elevation and layers](#elevation-and-layers)
- [Icons](#icons)
- [Motion](#motion)
- [Component recipes](#component-recipes)
- [Theme and environment behavior](#theme-and-environment-behavior)
- [Accessibility contract](#accessibility-contract)
- [Expo Android and iOS adaptation](#expo-android-and-ios-adaptation)
- [Optional Nilumi experience patterns](#optional-nilumi-experience-patterns)
- [Adoption and reproduction checklists](#adoption-and-reproduction-checklists)
- [Validation and provenance](#validation-and-provenance)

## Authority and interpretation

**Nilumi v2 adoption decision (11 October 2026; core baseline v2.2):** build the new app from the **catalogue/reference recipes** for buttons, circular task ticks, cards, fields, sheets and feedback, completing the documented accessible behavior. The older implemented controls remain provenance/reference and are not the new app's baseline; do not mix their geometry or states into the catalogue controls. Foundations and token values stay Pastel Rooms v1. Use Tamagui unstyled primitives beneath a Nilumi-owned component library for Expo Android and responsive iOS web/PWA, with the optional compiler introduced after compatibility and real-device checks. The [core architecture](architecture.md#section-11-13) governs this app's scope: P1 has only `household`/`self` visibility, bounded voice capture and deterministic mandatory panels; visual examples of an extra Shared tier, continuous voice or alternative feed/navigation patterns do not introduce features or alter permissions.

The extracted `ui/src/styles/globals.css` is the authority for foundations. Actual `ui/src/components` implementations determine the implemented controls. The specimen kit and phone/catalogue screens describe additional reference recipes. Historical design prose supplies intended behavior where code is absent; its approximate hex colors and stale statements about component availability do not override the captured source.

Throughout this guide:

| Label | Meaning |
|---|---|
| **Foundation** | Present in the source stylesheet, font helpers, or theme helpers. |
| **Implemented** | Present in the extracted React component source; reproduce these details when matching that control. |
| **Reference recipe** | Present in static catalogue/phone markup; a visual recipe, with demonstration behavior rather than a production component. |
| **Design requirement** | Intended interaction/accessibility behavior in design prose, sometimes beyond the existing implementation. |
| **Native adaptation** | A recommendation translating the system into Android/iOS capabilities; not evidence that a native implementation exists. |

Button recipes and checkbox recipes differ from the implemented primitives. Both are documented without combining their geometry or states into an invented control. No recipe implies that speech, persistence, focus management, or backend operations have already been implemented.

Token names below omit the source's leading `--`. `card`, `room-floor`, and `voice` describe roles, not a requirement to use CSS, Tailwind, shadcn, or a particular component library. Keep token definitions centralized and consume semantic roles in components.

## Visual principles

1. **Context is pastel.** Large backgrounds identify context; small source-context badges identify where an item belongs. Context hue never means success, danger, permission, or ownership.
2. **Readable surfaces are solid.** Light cards are white. Dark cards are a lighter, dusky version of the surrounding context. Avoid glass, translucent reading surfaces, and backdrop blur.
3. **Ink carries hierarchy.** Primary text is navy in light mode and warm white in dark mode; secondary text stays contrast-safe. Coral identifies voice capture/listening/speaking, with a dark glyph.
4. **Geometry is generous.** Rounded cards, pill buttons, large targets, and consistent spacing make everyday controls approachable. Shadows are subtle and contextual; dark elevation relies mainly on surfaces.
5. **Type remains readable.** Nunito provides rounded Latin forms; Noto Sans Tamil preserves Tamil legibility. Text grows and wraps independently from the spacing scale.
6. **Motion explains state.** Use one brief authored moment per interaction. No page-load choreography, unrelated bouncing, or motion-only status.
7. **Meaning has redundant cues.** Selected, checked, error, loading, and visibility states use text, icons, and/or shape alongside color.

## Color system

### Conversion and precision

The OKLCH columns retain the exact stylesheet declarations. The native columns are computed from those declarations using Culori 4.0.2: convert OKLCH through OKLab to sRGB, clamp each sRGB channel to `[0, 1]`, multiply by 255, and round to the nearest integer. Opaque results use `#RRGGBB`; translucent results use `rgba(R, G, B, alpha)` with the source alpha preserved, rather than rounding alpha to an 8-bit hex suffix.

OKLCH remains the canonical design value; native sRGB is a deliberately quantized representation. Channel clipping can differ from a browser's gamut mapping on out-of-gamut colors. Native rendering, antialiasing, and display profiles can also differ. The receiving app should use the supplied native values consistently and compare actual devices rather than promise pixel-identical rendering across platforms. React Native accepts the supplied hex/RGBA forms; CSS `oklch()`, CSS custom properties, and `color-mix()` are not prerequisites. [React Native color reference](https://reactnative.dev/docs/colors).

### Context roles

| Context identifier | Color family | Example use, not mandatory navigation |
|---|---|---|
| `today` | Peach | Overview / resting Home |
| `lists` | Mint | Collections / shopping |
| `talk` | Lilac | Conversation / drafting |
| `tasks` | Butter | Schedule / tasks |
| `memory` | Sky | Reference / evidence |
| `linen` | Warm neutral | Settings / administration / unclassified context |

Every context has six roles in each theme:

| Suffix | Purpose | Allowed use |
|---|---|---|
| `floor` | Page/screen background | Large contextual background; not a component surface or chart series. |
| `tint` | Soft contextual accent | Selected pills, hover backgrounds, chips, category badges. |
| `strong` | Decorative contextual fill | Duotone second path, selection background, nonessential accents; not default body text. |
| `ink` | Contrast-safe contextual ink | Text/icons on its tint, the floor, or component surfaces. |
| `surface` | Card/control/overlay background | White in light mode, contextual dark surface in dark mode. |
| `shadow` | Elevation color source | Context ink in light mode; black in dark mode. Use at the shadow alpha values below. |

### Peach / today

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `today-floor` | `oklch(0.944 0.032 52.3)` | `#FFE7D9` | `oklch(0.262 0.022 40)` | `#2E211C` |
| `today-tint` | `oklch(0.899 0.058 48.1)` | `#FFD3BD` | `oklch(0.368 0.036 40)` | `#503931` |
| `today-strong` | `oklch(0.824 0.106 46.5)` | `#FFB08A` | `oklch(0.45 0.06 42)` | `#724A3B` |
| `today-ink` | `oklch(0.479 0.136 39.3)` | `#9A3B17` | `oklch(0.841 0.095 46.6)` | `#FFB896` |
| `today-surface` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.313 0.026 40)` | `#3D2D27` |
| `today-shadow` | `oklch(0.479 0.136 39.3)` | `#9A3B17` | `oklch(0 0 0)` | `#000000` |

### Mint / lists

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `lists-floor` | `oklch(0.94 0.031 165.3)` | `#D9F2E6` | `oklch(0.274 0.022 166.5)` | `#1D2B25` |
| `lists-tint` | `oklch(0.893 0.051 164.2)` | `#BEE7D3` | `oklch(0.404 0.041 164.7)` | `#335043` |
| `lists-strong` | `oklch(0.813 0.088 162.5)` | `#8CD4B1` | `oklch(0.48 0.06 163)` | `#3C6854` |
| `lists-ink` | `oklch(0.468 0.094 160.4)` | `#1A6A48` | `oklch(0.837 0.094 163)` | `#8FDDB8` |
| `lists-surface` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.33 0.027 165.6)` | `#283A32` |
| `lists-shadow` | `oklch(0.468 0.094 160.4)` | `#1A6A48` | `oklch(0 0 0)` | `#000000` |

### Lilac / talk

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `talk-floor` | `oklch(0.932 0.037 295.9)` | `#EAE4FF` | `oklch(0.257 0.039 289.9)` | `#232035` |
| `talk-tint` | `oklch(0.875 0.068 294.3)` | `#D8CEFF` | `oklch(0.37 0.069 289.3)` | `#3F3962` |
| `talk-strong` | `oklch(0.776 0.125 292.1)` | `#B8A7FF` | `oklch(0.46 0.09 290)` | `#584E87` |
| `talk-ink` | `oklch(0.47 0.189 282.8)` | `#5240BF` | `oklch(0.817 0.099 291.1)` | `#C3B8FF` |
| `talk-surface` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.306 0.046 290.4)` | `#2F2B45` |
| `talk-shadow` | `oklch(0.47 0.189 282.8)` | `#5240BF` | `oklch(0 0 0)` | `#000000` |

### Butter / tasks

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `tasks-floor` | `oklch(0.958 0.06 92.8)` | `#FFF1C4` | `oklch(0.269 0.023 93)` | `#2A2619` |
| `tasks-tint` | `oklch(0.921 0.106 91.3)` | `#FFE391` | `oklch(0.389 0.043 91.7)` | `#4D4429` |
| `tasks-strong` | `oklch(0.877 0.144 87.2)` | `#FFD059` | `oklch(0.47 0.06 90)` | `#685932` |
| `tasks-ink` | `oklch(0.468 0.097 80.4)` | `#765300` | `oklch(0.875 0.126 91.6)` | `#F4D36E` |
| `tasks-surface` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.319 0.026 88.8)` | `#383223` |
| `tasks-shadow` | `oklch(0.468 0.097 80.4)` | `#765300` | `oklch(0 0 0)` | `#000000` |

### Sky / memory

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `memory-floor` | `oklch(0.938 0.03 256)` | `#DEECFF` | `oklch(0.263 0.029 259.1)` | `#1C2533` |
| `memory-tint` | `oklch(0.889 0.054 258.7)` | `#C5DCFF` | `oklch(0.384 0.05 258.7)` | `#33445E` |
| `memory-strong` | `oklch(0.802 0.1 258.8)` | `#97C0FF` | `oklch(0.47 0.07 259)` | `#435B82` |
| `memory-ink` | `oklch(0.467 0.126 257.2)` | `#26599F` | `oklch(0.822 0.089 260)` | `#A3C6FF` |
| `memory-surface` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.315 0.036 260.1)` | `#273244` |
| `memory-shadow` | `oklch(0.467 0.126 257.2)` | `#26599F` | `oklch(0 0 0)` | `#000000` |

### Warm neutral / linen

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `linen-floor` | `oklch(0.96 0.006 59.7)` | `#F5F1EE` | `oklch(0.255 0.006 60)` | `#252220` |
| `linen-tint` | `oklch(0.92 0.01 58.2)` | `#EAE3DE` | `oklch(0.369 0.01 60)` | `#443E3A` |
| `linen-strong` | `oklch(0.849 0.017 58.6)` | `#D6CBC3` | `oklch(0.45 0.012 60)` | `#5A544F` |
| `linen-ink` | `oklch(0.451 0.015 63.6)` | `#5C544D` | `oklch(0.864 0.013 60)` | `#D9D0CA` |
| `linen-surface` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.305 0.008 60)` | `#322E2B` |
| `linen-shadow` | `oklch(0.451 0.015 63.6)` | `#5C544D` | `oklch(0 0 0)` | `#000000` |

### Core ink, surfaces, action, focus, and scrim

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `ink` | `oklch(0.296 0.041 291.6)` | `#2D2940` | `oklch(0.974 0.014 50.8)` | `#FFF4EE` |
| `ink-2` | `oklch(0.462 0.042 295.3)` | `#5A546E` | `oklch(0.85 0.017 337.7)` | `#D6CAD2` |
| `ink-inverse` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.296 0.041 291.6)` | `#2D2940` |
| `hairline` | `oklch(0.296 0.041 291.6 / 0.1)` | `rgba(45, 41, 64, 0.1)` | `oklch(1 0 0 / 0.1)` | `rgba(255, 255, 255, 0.1)` |
| `control-border` | `oklch(0.57 0.04 295.7)` | `#79738D` | `oklch(0.7 0.021 320.6)` | `#A59AA7` |
| `focus` | `oklch(0.296 0.041 291.6)` | `#2D2940` | `oklch(0.974 0.014 50.8)` | `#FFF4EE` |
| `focus-inverse` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.296 0.041 291.6)` | `#2D2940` |
| `scrim` | `oklch(0.296 0.041 291.6 / 0.45)` | `rgba(45, 41, 64, 0.45)` | `oklch(0.12 0.02 300 / 0.62)` | `rgba(7, 4, 12, 0.62)` |
| `surface-neutral` | `oklch(0.97 0.004 325)` | `#F6F4F7` | `oklch(0.34 0.01 320)` | `#3A363B` |
| `action` | `oklch(0.296 0.041 291.6)` | `#2D2940` | `oklch(0.967 0.019 55.2)` | `#FFF1E8` |
| `action-foreground` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.296 0.041 291.6)` | `#2D2940` |

`ink` is primary text and `ink-2` is metadata, helper text, and placeholder text at full opacity. `ink-inverse` is an explicit inverse color; primary-action text must use `action-foreground`. `hairline` is a decorative separator at 10% opacity, not an interactive control boundary. `control-border` identifies controls. `focus` and `focus-inverse` identify keyboard focus on normal and inverse surfaces. `scrim` dims the screen behind a modal; content inside the modal remains opaque. `surface-neutral` is for neutral secondary/code containers, distinct from contextual `room-surface`.

### Voice

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `voice` | `oklch(0.723 0.174 34.1)` | `#FF7657` | `oklch(0.763 0.143 34.9)` | `#FF8E72` |
| `voice-foreground` | `oklch(0.296 0.041 291.6)` | `#2D2940` | `oklch(0.243 0.025 357.4)` | `#2A1B20` |
| `voice-soft` | `oklch(0.934 0.034 38)` | `#FFE2D9` | `oklch(0.34 0.05 35)` | `#4F2E26` |
| `voice-on-action` | `oklch(0.834 0.094 36.1)` | `#FFB39E` | `oklch(0.52 0.16 33)` | `#B23A23` |

Use `voice` for real record controls and listening/speaking indicators, with `voice-foreground` for the mic glyph. Do not put white text on light coral. `voice-soft` is a softer voice-related container color; it is not an independently validated permission/status color. `voice-on-action` is contrast-safe text for an Undo action on the primary-action toast surface.

### Semantic status

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `success` | `oklch(0.589 0.126 157.7)` | `#24935F` | `oklch(0.745 0.142 158.3)` | `#4CC78A` |
| `success-soft` | `oklch(0.945 0.028 162.1)` | `#DDF3E7` | `oklch(0.32 0.045 160.5)` | `#1C3A2B` |
| `success-ink` | `oklch(0.493 0.106 158.4)` | `#17734A` | `oklch(0.84 0.104 160.5)` | `#8BE0B4` |
| `success-foreground` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.22 0.03 160)` | `#0D1F16` |
| `warning` | `oklch(0.613 0.132 70.8)` | `#B57401` | `oklch(0.801 0.151 80.5)` | `#F0B233` |
| `warning-soft` | `oklch(0.958 0.05 88.1)` | `#FFF0CC` | `oklch(0.317 0.047 84.6)` | `#3D3014` |
| `warning-ink` | `oklch(0.487 0.104 72.1)` | `#835401` | `oklch(0.885 0.118 82.9)` | `#FFD27A` |
| `warning-foreground` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.22 0.03 80)` | `#22190A` |
| `danger` | `oklch(0.571 0.187 29.7)` | `#CF3B2C` | `oklch(0.732 0.165 28.7)` | `#FF7A6A` |
| `danger-soft` | `oklch(0.942 0.029 28.1)` | `#FFE5E1` | `oklch(0.296 0.059 27.4)` | `#46201C` |
| `danger-ink` | `oklch(0.481 0.163 30)` | `#A62A1D` | `oklch(0.845 0.092 27.4)` | `#FFB5AB` |
| `danger-foreground` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.22 0.04 28)` | `#2B1310` |
| `info` | `oklch(0.553 0.164 258.8)` | `#2F6FD0` | `oklch(0.736 0.136 261.1)` | `#78A9FF` |
| `info-soft` | `oklch(0.941 0.028 261.5)` | `#E1ECFF` | `oklch(0.295 0.059 262.1)` | `#1C2C4A` |
| `info-ink` | `oklch(0.462 0.129 257.4)` | `#23579F` | `oklch(0.83 0.085 261.7)` | `#A9C8FF` |
| `info-foreground` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.22 0.04 261)` | `#101A2D` |

Each status has a fill, soft background, text ink, and glyph foreground. Use `success` for successful completion, `warning` for attention, `danger` for errors/destructive states, and `info` for informative states. Use `*-ink` for text and `*-foreground` for glyphs on the corresponding fill. Glyph foregrounds only have the non-text contrast contract on these fills; do not substitute them for general text.

Soft status backgrounds belong inside component surfaces, not directly on contextual page floors. In light mode that means a white card; in dark mode use the contextual card. A status label must say what happened. `destructive` is an alias to **danger ink**, so a solid destructive button uses a darker, text-safe color than the normal status fill.

### Visibility and members

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `visibility-household` | `oklch(0.95 0.007 325.6)` | `#F1EDF1` | `oklch(0.405 0.02 305.9)` | `#4C4652` |
| `visibility-household-foreground` | `oklch(0.296 0.041 291.6)` | `#2D2940` | `oklch(0.974 0.014 50.8)` | `#FFF4EE` |
| `visibility-outline` | `oklch(0.462 0.042 295.3)` | `#5A546E` | `oklch(0.85 0.017 337.7)` | `#D6CAD2` |
| `visibility-outline-foreground` | `oklch(0.296 0.041 291.6)` | `#2D2940` | `oklch(0.974 0.014 50.8)` | `#FFF4EE` |

`visibility-household`/foreground form a neutral filled badge. `visibility-outline` and its foreground form shared/private badges on a component surface. Shape and icon distinguish them, as specified in the component recipes. These visual treatments may be reused, but Nilumi's household permission meanings are optional product behavior.

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `member-a` | `oklch(0.469 0.176 4.1)` | `#A3154F` | `oklch(0.83 0.09 355)` | `#F7AFCA` |
| `member-a-soft` | `oklch(0.935 0.033 351.2)` | `#FCE1EC` | `oklch(0.34 0.06 355)` | `#502A39` |
| `member-b` | `oklch(0.465 0.079 216.6)` | `#0E6476` | `oklch(0.84 0.07 210)` | `#94D8E4` |
| `member-b-soft` | `oklch(0.936 0.031 209.1)` | `#D3F0F5` | `oklch(0.33 0.04 210)` | `#1A3B41` |

Use `member-a` on `member-a-soft` and `member-b` on `member-b-soft` for member initials. The hue identifies a member and stays separate from context and status. Do not extrapolate additional member colors without defining and checking new token pairs.

### Charts

| Token | Light: exact OKLCH | Light: native sRGB | Dark: exact OKLCH | Dark: native sRGB |
|---|---|---|---|---|
| `chart-1` | `oklch(0.603 0.165 38.2)` | `#D0552C` | `oklch(0.76 0.13 38)` | `#F79273` |
| `chart-2` | `oklch(0.567 0.111 159.8)` | `#2B8A5F` | `oklch(0.76 0.12 160)` | `#64C897` |
| `chart-3` | `oklch(0.54 0.191 285.8)` | `#6A54D6` | `oklch(0.74 0.13 286)` | `#A49EF9` |
| `chart-4` | `oklch(0.593 0.125 76)` | `#A87200` | `oklch(0.8 0.13 80)` | `#E9B452` |
| `chart-5` | `oklch(0.553 0.164 258.8)` | `#2F6FD0` | `oklch(0.74 0.12 259)` | `#7CACF6` |

Use these mid-chroma series on component surfaces with labels, numbers, or patterns. Pastel floor colors are not chart colors. The source uses them for Admin charts; the series can be reused for another app's data visualization. Color alone must never identify a data series.

### Semantic aliases

Resolve aliases after selecting theme and context. For the current context `C`, `room` points to `C-floor`; `room-tint`, `room-strong`, `room-ink`, `room-surface`, and `room-shadow` point to the matching `C-*` primitives. Default context is `linen`. `room-floor` normally resolves to `room`, with the expanded light-mode override below.

| Semantic alias | Resolves to |
|---|---|
| `room-floor` | `room` |
| `background` | `room-surface` |
| `foreground` | `ink` |
| `card` | `room-surface` |
| `card-foreground` | `ink` |
| `popover` | `room-surface` |
| `popover-foreground` | `ink` |
| `primary` | `action` |
| `primary-foreground` | `action-foreground` |
| `secondary` | `room-surface` |
| `secondary-foreground` | `ink` |
| `muted` | `room-tint` |
| `muted-foreground` | `ink-2` |
| `accent` | `room-tint` |
| `accent-foreground` | `ink` |
| `destructive` | `danger-ink` |
| `destructive-foreground` | `danger-foreground` |
| `border` | `hairline` |
| `input` | `control-border` |
| `ring` | `focus` |
| `surface` | `surface-neutral` |
| `surface-foreground` | `ink` |
| `selection` | `room-strong` |
| `selection-foreground` | `ink` |
| `sidebar` | `room-surface` |
| `sidebar-foreground` | `ink` |
| `sidebar-primary` | `action` |
| `sidebar-primary-foreground` | `action-foreground` |
| `sidebar-accent` | `room-tint` |
| `sidebar-accent-foreground` | `ink` |
| `sidebar-border` | `hairline` |
| `sidebar-ring` | `focus` |

`primary-hover` is the derived value below. Alias names retained for web component compatibility do not require a sidebar or a specific app layout. Web utility aliases `control` → `control-border`, `household` → `visibility-household`, `household-foreground` → `visibility-household-foreground`, and `visibility-foreground` → `visibility-outline-foreground` explain the shorter recipe names. The extraction adapter exposes `action`, `action-foreground`, and `control-border` as additional utility names without changing values. Named-context background utilities such as `today` map to `today-floor`; keep the explicit role names in a native theme object.

### Derived colors and compositing

Mix opaque colors in **OKLab before conversion and rounding**, not by averaging the supplied hex channels:

- Primary hover = 88% `action` + 12% `action-foreground`: light `#423F54`, dark `#E3D7D3`.
- At width ≥1024, the light page floor = 85% context floor + 15% context surface. Dark floors remain unchanged. Named-context primitives do not change; only the page-floor alias does.
- Skeleton midpoint = 45% context tint + 55% context surface. The full gradient is tint → midpoint → tint.

| Context | Light expanded floor (85/15) | Light skeleton midpoint (45/55) | Dark skeleton midpoint (45/55) |
|---|---|---|---|
| `today` | `#FFEBDF` | `#FFEBE1` | `#45322B` |
| `lists` | `#DFF4EA` | `#E2F4EB` | `#2D443A` |
| `talk` | `#EDE8FF` | `#EDE9FF` | `#363152` |
| `tasks` | `#FFF3CD` | `#FFF3D0` | `#413A26` |
| `memory` | `#E3EFFF` | `#E5EFFF` | `#2C3A50` |
| `linen` | `#F6F3F0` | `#F5F2F0` | `#3A3532` |

Mixing an opaque color with transparent preserves its hue and lowers its alpha: the elevation alpha values, 45% success tick ripple, 55% voice listening ring, and 45% reduced-motion voice ring below use that rule. Composite alpha over the actual background before checking contrast. A stock destructive wash uses danger ink at 10% or 20% over the card; a stock input wash uses control border at 30% over the card. These washes are contrast-checked compatibility cases, not the preferred field recipe: fields use an opaque card surface.

### Allowed contrast pairs

| Foreground / object | Background | Minimum ratio |
|---|---|---:|
| `ink`, `ink-2`, current context ink | Page floor, card, current tint | 4.5:1 |
| Any source-context ink | Its own tint or any context card | 4.5:1 |
| `action-foreground` | Action and primary-hover | 4.5:1 |
| Status ink | Card or matching status soft | 4.5:1 |
| Status fill | Card | 3:1 |
| Status glyph foreground | Matching status fill | 3:1 |
| `voice-foreground` | Voice fill | 3:1 |
| `voice-on-action` | Action toast | 4.5:1 |
| `danger-foreground` | `destructive` (= danger ink) | 4.5:1 |
| Control border / focus | Card, page floor, current tint | 3:1 |
| Inverse focus | Primary/action surface | 3:1 |
| Visibility text and member initials | Their specified backgrounds | 4.5:1 |
| Visibility outline and chart series | Card | 3:1 |
| Page floor vs card | Current context | 1.10:1 design separation |
| Household badge fill vs card | Any context | 1.15:1 design separation |

The last two thresholds are visual separation checks, not WCAG text thresholds. Coral's outer boundary is not the identifying signal: use the contrast-safe glyph and an accessible label. Undefined token combinations require a new contrast check.

## Typography

### Families and weights

**Foundation:** Nunito for Latin UI text, including headings; Noto Sans Tamil for Tamil runs, including headings. The web fallback stack is Nunito → Noto Sans Tamil → UI/system sans. Code uses UI monospace → SF Mono → Cascadia Mono → Roboto Mono → monospace. Do not replace the rounded UI family with a generic platform font or a bubble display font.

The source loads variable Nunito weights 200–1000 and Noto Sans Tamil weights 100–900. Its base body weight is 500; ordinary named type roles use the table weights. Individual recipes override these, such as an 800-weight status label or a 600-weight implemented button.

### Named type scale at 100%

| Role | Size | Weight | Line-height multiplier | Line box at 100% | Tracking | Typical use |
|---|---:|---:|---:|---:|---|---|
| `display` | 32 | 800 | 1.4 | 44.8 | −0.015em (−0.48 units) | Greeting / large title |
| `title-1` | 26 | 800 | 1.4 | 36.4 | −0.01em (−0.26 units) | Screen title |
| `title-2` | 20 | 750 | 1.4 | 28 | Normal | Section heading |
| `headline` | 17 | 700 | 1.41 | 23.97 | Normal | Card title |
| `body` | 16 | 500 | 1.5 | 24 | Normal | Body / input |
| `callout` | 15 | 500 | 1.53 | 22.95 | Normal | Secondary body |
| `subhead` | 14 | 600 | 1.5 | 21 | Normal | Labels / metadata |
| `footnote` | 13 | 600 | 1.54 | 20.02 | Normal | Chips / badges |
| `caption` | 12 | 700 | 1.5 | 18 | Normal | Small labels |
| `tab` | 12 | 700 | 1.25 | 15 | Normal | Legacy short navigation label |

The tab role is a legacy exception: scale caps at 1.25× and the reference shell reserves two lines. Tamil always uses 1.6 line height, including tab text. This cap is not permission to cap body text or native accessibility settings globally.

### Compatibility type steps

These extra source steps matter when reproducing the implemented layout examples. They inherit weight unless a component sets one; `lg` is **18**, not the 17-unit headline, and `2xl` is **24**, not the 26-unit title.

| Source step | Base size | Line height |
|---|---:|---:|
| `xs` | 12 | 1.5 |
| `sm` | 14 | 1.5 |
| `base` | 16 | 1.5 |
| `lg` | 18 | 1.5 |
| `xl` | 20 | 1.4 |
| `2xl` | 24 | 1.4 |
| `3xl` | 30 | 1.4 |
| `4xl` | 36 | 1.4 |

### Scaling and mixed-script text

The original app-controlled scale steps are **100, 115, 130, 150, 175, 200%**. For scale `s`, multiply the type size and the absolute line box by `s`; an em-based tracking/icon/padding value follows its text size. Keep the root reference at 16 and geometric spacing unchanged. Explicit shell reservations grow with text as described below. Controls use minimum height and expand; text wraps rather than shrinks or clips. At 200%, body is 32 with a 48-unit line box.

Tamil detection uses the U+0B80–U+0BFF block, allowing whitespace and U+200C/U+200D joiners between Tamil runs. Equivalent regular-expression source:

```text
[\u0B80-\u0BFF]+(?:[\s\u200C\u200D]+[\u0B80-\u0BFF]+)*
```

Preserve all text and split only for styling. Tamil runs use Noto Sans Tamil at the surrounding text size, line height **1.6**, zero tracking, and no uppercase transformation. Mixed-script line boxes must accommodate the taller run. Wrap long text and preserve grapheme clusters; do not insert breaks through vowel signs or shrink Tamil to align x-heights. Headings use balanced wrapping where available; paragraph wrapping should be natural. Truncated text must leave vertical slack and offer the full content when needed.

Use tabular numerals for aligned quantities, money, and time. Font fallback must not change numeric alignment unnoticed.

## Geometry and responsive layout

### Units, spacing, and rhythm

All measurements are CSS reference pixels at a 16px root. In native layouts, use the same numbers as logical layout units (Android dp / iOS points); do not multiply by device pixel ratio. Text units also follow platform accessibility scaling. These mappings preserve proportions, not identical rasterization.

Base spacing is **4**. Common increments: **2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80**. The half-step values support fine detail; they do not redefine the base unit. Default rhythm is **12 between cards**, **32 between sections**, with more space above a heading than below. Inline controls commonly use 8-unit gaps, metadata 6, and card icon/content 12–16.

### Width classes and content measure

| Width class | Window width | Horizontal gutter |
|---|---|---:|
| Compact phone | <600 | 20 |
| Medium | 600–1023 | 24 |
| Expanded | 1024–1439 | 32 |
| Wide | ≥1440 | 32 |

Window class **compact** means a narrow viewport; **compact density** means a denser control setting. They are distinct. Legacy web breakpoints `sm`/`md` both resolve to 600, `lg` to 1024, and `xl`/`2xl` to 1440.

Centered content column: width 100%, maximum **720**. Bottom/dialog sheet maximum **640**. Side sheet width **420**, constrained to the available window. Category grids use a minimum column width `min(availableWidth, 152 × textScale)` and a 12-unit gap; columns reduce as text grows. Local table scrolling must not cause screen-wide horizontal overflow.

### Radius scale

| Role | Normal radius (base 20) | Compact-density radius (base 10) | Typical use |
|---|---:|---:|---|
| `sm` | 12 | 6 | Small chips / inner field detail |
| `md` | 16 | 8 | Inner containers / implemented checkbox |
| `lg` | 20 | 10 | Rows / small cards / textarea |
| `xl` | 28 | 14 | Cards |
| `2xl` | 36 | 18 | Sheet top corners |
| `3xl` | 44 | 22 | Large containers |
| `4xl` | 52 | 26 | Large containers |
| `full` | Capsule/circle | Capsule/circle | Buttons / badges / avatars / composer |

Multipliers are **0.6, 0.8, 1, 1.4, 1.8, 2.2, 2.6**. Use radius roles rather than assuming a browser's raw custom-property calculation is portable. For nested rounded surfaces, preserve the concentric principle: inner radius = outer radius − padding, bounded at zero. Named recipe values remain the source values even where they approximate this principle.

### Minimum control sizes

| Token | Normal | Compact desktop density | Compact density on touch |
|---|---:|---:|---:|
| `target-min` | 44 | 44 | 44 |
| `control-height` | 48 | 36 | 44 |
| `control-height-lg` | 52 | 40 | 44 |
| `control-height-sm` | 36 | 36 | 44 |
| `row-height` | 64 | 40 | 44 |
| `gutter` | Width-dependent | 16 | 16 |

These are minimums, not fixed text-clipping heights. Small visual icons/chips need an expanded touch target. Primary phone controls normally remain 48. Compact desktop density is not the default phone density. In a native app, prefer a 48×48 interaction region for Android controls while retaining smaller source visual geometry when needed; never go below the source's 44-unit floor.

### Safe areas, fixed controls, and keyboard clearance

The web source supplies these formulas at text scale `s`. They describe the legacy reference shell, not required navigation in the receiving app:

| Reservation | Formula / default in reference units |
|---|---|
| `header-height` | `36 + 17 × s × 1.41` (59.97 at 100%) |
| `tray-height` | `48 + 2 × 12 × min(s, 1.25) × 1.25` (78 at 100%; cap 85.5) |
| `tray-overhang` | 28; zero with the flat tray |
| `capture-height` | `max(52, 16 × s × 1.5 + 28)` (52 at 100%, 76 at 200%) |
| `bottom-dock` | 0 by default; shell sets the full dock reservation |
| `keyboard-inset` | 0 until the platform reports keyboard overlap |
| Top focus-scroll clearance | Header reservation + top safe inset |
| Bottom focus-scroll clearance | Tray + `max(bottomDock, trayOverhang)` + bottom safe inset + 16 |
| Bottom content padding | Tray + `max(bottomDock, trayOverhang)` + bottom safe inset + 24 |
| Reference toast offset | Tray + `max(bottomDock, trayOverhang)` + bottom safe inset + 12 |
| Horizontal safe gutter | `max(gutter, leftInset)` and `max(gutter, rightInset)` |

Measure the receiving app's actual header/composer/navigation sizes, especially with Tamil and large text. Reserve them once, and keep focused inputs and the last actionable row visible above fixed controls and the keyboard. If a keyboard avoidance container already moves content, do not add the same keyboard inset again. Landscape notches and home indicators count as safe areas.

## Elevation and layers

**Foundation:** shadows use the current `room-shadow` color, with the following CSS-equivalent geometry. Each tuple is `(x offset, y offset, blur radius, spread radius, color alpha)` in reference units. A negative spread contracts the shadow.

| Level / token | Shadow layers | Use |
|---|---|---|
| 0 | None | Inner rows / tinted chips |
| 1 / `elevation-1` / `shadow-card` | `(0, 1, 2, 0, 0.08)` and `(0, 12, 28, −18, 0.42)` | Cards on a floor |
| 2 / `elevation-2` / `shadow-float` | `(0, 2, 6, 0, 0.10)` and `(0, 18, 40, −20, 0.52)` | Composer / floating controls |
| 3 / `elevation-3` / `shadow-overlay` | `(0, −10, 44, −14, 0.40)` | Sheets / dialogs, with scrim |

Legacy web shadow aliases: `2xs`, `xs`, `sm` → card; `md`, `lg` → float; `xl`, `2xl` → overlay. Dark `room-shadow` is black, but visible elevation primarily comes from the lighter card surface. Do not replace dark surfaces with generic black containers.

| Layer role | Relative layer value |
|---|---:|
| Header | 30 |
| Navigation tray / dock layer | 40 |
| Modal overlay | 50 |
| Toast | 60 |

These numbers define ordering, not Android shadow elevation. Ensure modal hosts and toast hosts obey this order even when they are mounted outside the normal screen tree.

## Icons

**Foundation/design requirement:** Phosphor is the visual icon family. Use the same icon shapes in the receiving stack; a different icon library changes the design even if sizes match.

| Treatment | Role |
|---|---|
| Regular | Standard UI |
| Fill | Selected control/activity state |
| Duotone | Context/category/empty-state icons |
| Bold | Small inline icons |

Standalone sizes: **16, 20, 24, 32, 48**. Default source-context badge: **40-unit circle** with a **20-unit duotone glyph**, tint background, context ink first path, and context strong second path. The second path is fully opaque; do not leave Phosphor's default 20% opacity. Override it using the item's source context rather than the currently focused screen.

Inline icons generally use **1.1em**, with catalogue button icons **1.15em**. Convert em to a multiple of the actual scaled text size in native components. Standalone header/category icons stay fixed; expanded hit areas provide accessibility without enlarging every glyph. Decorative icons are hidden from screen readers, while icon-only actions receive a label.

Use the microphone glyph only for a real capture control, normally one per screen. A navigation entry leading to conversation uses a conversation glyph and does not start recording.

## Motion

### Timing and easing

| Duration token | Value | Role |
|---|---:|---|
| `instant` | 100ms | Press feedback |
| `quick` | 160ms | Color / opacity / toggle feedback |
| `base` | 240ms | Selection / small layout change |
| `gentle` | 320ms | Context floor change / rise |
| `slow` | 480ms | General sheet transition guidance |

| Easing | Cubic-bezier control points | Role |
|---|---|---|
| `standard` | `(0.2, 0, 0, 1)` | Default |
| `decelerate` | `(0.16, 1, 0.3, 1)` | Arrival |
| `accelerate` | `(0.3, 0, 1, 1)` | Departure |
| `spring-soft` | `(0.34, 1.35, 0.64, 1)` | Tick, toggle, press-release only |

### Exact signature animations

| Animation | Duration / curve / repetition | Key states |
|---|---|---|
| `rise` | 320ms / decelerate / once, both fill | From opacity 0 and translateY +12 to ordinary opacity/position. |
| `fade-in` | 160ms / standard / once, both fill | Opacity 0 → ordinary opacity. |
| `tick-ripple` | 480ms / decelerate / once | From a zero-spread success ring at alpha 0.45 to the ordinary shadow. |
| `check-draw` | 320ms / decelerate / once, forwards | Stroke dash offset 24 → 0; dash array 24 in the tick recipe. |
| `listen-ring` | 1400ms / decelerate / infinite | From a zero-spread voice ring at alpha 0.55 toward ordinary shadow; repeats. |
| `level-bar` | 900ms / ease-in-out / infinite | scaleY 0.35 at 0/100%, scaleY 1 at 50%. |
| `thinking` | 1200ms / ease-in-out / infinite | Opacity 0.35 at endpoints; opacity 1 and translateY −3 at midpoint. |
| `shimmer` | 1600ms / linear / infinite | Gradient background position 150% → −50%, background width 200%. |
| `highlight` | 1600ms / standard / once | From room tint toward the element's ordinary background. |

The CSS `ease-in-out` curve used above is `(0.42, 0, 0.58, 1)`; `linear` has constant progress.

The ripple/ring source keyframes define only a `from` shadow, not an expanding `to` radius. Reproducing an expanding ring instead would be a new animation choice. Five reference listening bars use a 120ms stagger; three thinking dots use 0/150/300ms delays.

Catalogue standard buttons scale to **0.97** on press; the circular voice button scales to **0.94**. The implemented React button does not contain those transforms. The floor changes over **320ms using standard easing**; explicit light/dark theme changes suppress the glide. Although general sheet guidance says 480ms, the captured phone sheet uses the **320ms rise** recipe.

No entrance choreography on initial page load. Short optional transitions must preserve selection, reading order, and scroll. A list/detail transition can use a shared-element treatment only with an immediate stable fallback. Gesture-driven implementation tools are platform choices; the visual contract is the timing/state here.

### Reduced motion

Disable movement and shimmer, making layout/state changes immediate. The source uses 1ms single-iteration general animations/transitions; no animated page-floor change or smooth scrolling. Keep these functional cues:

- Listening: static **4-unit** voice ring at alpha **0.45**, plus “Listening…” text.
- Level bars: static scaleY **0.6**.
- Thinking: static opacity **0.7**, plus an accessible status.
- Check: final checked glyph remains visible.
- Skeleton: static gradient; no shimmer.
- Spinner: opacity pulse between normal and **0.4** over **1600ms ease-in-out**, replacing rotation.
- Explicit `motion-fade`: retain a **160ms standard opacity-only** transition.

## Component recipes

All measurements use the foundations above. Components inherit resolved theme/context tokens. Reference recipes provide visual styling; implement semantic labels, actions, and accessible states in the receiving platform. Required state coverage is described after the recipes.

### Buttons

**Implemented primitive:** a pill, minimum height **48**, horizontal padding **20**, vertical padding **8**, icon/text gap **8**, and weight **600**. It inherits the surrounding text size/line height (16/24 at the ordinary body default); it does not specify `subhead`. Default variant is secondary. Disabled opacity is **0.5**. Color transitions run only when motion is allowed. The primitive itself has no explicit pressed transform, primary hover, loading rendering, or tonal/ghost variant.

| Implemented variant | Fill | Text/glyph | Border / hover |
|---|---|---|---|
| Primary | `action` | `action-foreground` | No explicit hover override |
| Secondary | `card` | `foreground` | 1-unit `control-border`; hover `room-tint` |
| Voice | `voice` | `voice-foreground` | No explicit hover override |
| Danger | `danger-soft` | `danger-ink` | No explicit hover override |

**Reference recipe:** minimum height `control-height` (normally 48), pill, padding 20 horizontally, gap 8, `subhead` size **14** at weight **700**, 100ms spring-soft transform/color/shadow transition, pressed scale **0.97**, disabled opacity **0.4** and no activation. The ghost recipe appends 12-unit horizontal padding, but the bundled stylesheet's later 20-unit utility wins; use **20** to match the captured catalogue. Inline bold icon is **1.15× scaled label size**. This is a separate baseline from the implemented primitive.

| Reference variant | Fill | Label | Other states |
|---|---|---|---|
| Primary | `primary` | `primary-foreground` | Hover `primary-hover` |
| Secondary | `background` | `foreground` | 1.5-unit input border; hover accent |
| Tonal | `room-tint` | `room-ink` | Hover card shadow |
| Ghost | Transparent | `muted-foreground` | Hover accent fill / accent-foreground |
| Destructive (soft) | `danger-soft` | `danger-ink` | For ordinary reversible destructive affordances |
| Danger (solid) | `destructive` (= danger ink) | `destructive-foreground` | Irreversible confirmation example |

Reference loading uses a **16-unit**, 2-unit-stroke spinner and a “Saving” label, retaining button geometry and announcing busy state. Prevent duplicate activation while a save is pending. Adapt icon-only controls to a labelled interaction area; do not make the glyph itself the full touch target.

### Checkbox, tick, and switch

**Implemented checkbox:** **48×48**, radius **md =16**, 1-unit control border, card fill and foreground ink. Checked fill becomes action; glyph becomes action-foreground. Phosphor bold check is **24**. The source keeps its border and passes disabled/checked behavior to Base UI; it specifies no additional disabled opacity or check-draw animation.

**Reference circular tick:** **48×48 interaction area** around a **28×28 circle**, 2-unit input border, no explicit unselected inner fill. Selected border/fill are success; glyph is success-foreground. The check is **16**, stroke width 3 with rounded caps/joins, stroke dash array/initial offset 24. Use 160ms color feedback, check-draw, and tick-ripple. Completed row text additionally becomes secondary ink and struck through. Source demonstration toggles on click and optionally vibrates for 10ms; domain actions should use explicit desired checked state, not an ambiguous server-side toggle.

**Reference switch:** labelled body-text row, minimum 48 high, label/control gap **16**. Track **52×32**, pill, 1.5-unit input border, room-tint fill. Thumb **24×24**, card fill, card shadow, positioned **2** from top/left. On: success border/fill; thumb translates **20** horizontally. Track color transition 160ms; thumb transition 240ms spring-soft. Expand the switch touch region to the target floor and expose on/off semantically. The whole labelled row may serve as the action target in native UI.

### Fields, search, multiline input, and code input

**Reference field:** stacked label/container/help with **6** vertical gaps. Label and help use subhead. Container minimum height **52**, pill radius, horizontal padding **20**, icon/input gap **12**, 1.5-unit input border, opaque background/card fill. Optional leading icon is **20**, regular, secondary ink. Input uses body 16/500, foreground ink; placeholder uses secondary ink at full opacity. Error replaces border with danger ink, adds a bold **1.15em** warning icon and actionable danger-ink helper text, and exposes invalid state. Focus is drawn on the enclosing container once, not independently on both container and inner input.

Search uses the same field with a magnifying-glass icon. Multiline input uses the same fill/border/type contract with **lg =20 radius**, minimum height expanding to content; no exact multiline height is implemented in the extract. One-time sign-in code is a single paste-friendly field with platform autofill where supported, rather than disconnected boxes. Those multiline/auth behaviors are design requirements, not extra implemented primitives.

### Segmented selection

**Reference recipe:** room-tint pill track, **4-unit padding**, equal-width options, inset card-surface thumb with card shadow. Thumb width = `(trackWidth − 8) / optionCount`; translate horizontally by selected index × thumb width. Options minimum **44 high**, subhead text, muted ink when unselected and foreground when selected. Thumb transition **240ms standard**. Expose labels and selected state; grow/wrap or change layout when labels no longer fit. Do not use color or thumb position as the sole selection signal.

### Cards, item tiles, and list rows

**Reference card:** radius **xl =28**, card fill, card-foreground text, **20 padding**, card shadow. Plain inner rows have no shadow. Item card uses a **40** source-context icon badge, **16** content gap, headline title, metadata **8** below title with **6** between wrapping chips. Its helper appends a 16-unit padding class to the base 20-unit class; the bundled stylesheet places the 20-unit utility later, so effective padding is **20**. Use 20 to reproduce that snapshot; 16 is the helper's apparent intended reduction. Trailing controls must not squeeze the title below a readable width.

Category tile: minimum **96 high**, radius 28, card shadow, padding 16, context icon badge; headline label **12** below the badge, subhead count. Use the text-aware grid minimum rather than a fixed two-column phone layout.

**Reference list row:** minimum **64 high**, left padding **4**, right padding **16**, gap **8**, circular tick, flexible body-text label, optional callout quantity, optional **24** avatar with caption initials. Separate rows using the hairline border. Completed = tick + secondary text + strikethrough. Wrap labels/quantities, preserve explicit pending/conflict status, and keep actions available without hover.

Reference swipe reveal is **96 wide**, danger-soft background, danger-ink **24 bold trash**; row moves left by 96. A tap/open/remove alternative is required. Horizontal gestures must preserve vertical scrolling. The reference is a visual demonstration, not production gesture or Undo logic.

### Status, visibility, evidence, and avatars

| Recipe | Geometry | Colors / typography | Meaning and state |
|---|---|---|---|
| Status chip | Pill; horizontal 0.8em, vertical 0.2em | Footnote; matching status soft / ink | Visible status label. Reference uses no wrapping; allow wrapping in native adaptation when necessary. |
| Household badge | Pill; gap 4; horizontal 0.8em, vertical 0.2em | Neutral household fill/foreground; footnote; 1.1em filled house | Noninteractive icon + label + filled shape. |
| Shared badge | Pill; gap 4; horizontal 0.8em, vertical 0.12em; 1.5 solid outline | Visibility outline/foreground; footnote; 1.1em bold people | Noninteractive icon + label + solid shape. |
| Private badge | Same as shared, dashed outline | Visibility outline/foreground; footnote; 1.1em bold lock | Noninteractive icon + label + dashed shape. |
| Evidence chip | Pill; minimum visual height 32; gap 6; horizontal 0.9em, vertical 0.32em | Room tint / secondary ink; footnote; 1.1em bold link | A labelled action with expanded target ≥44; source/reference metadata. |
| Avatar | Default 40 circle; centered initials | Member soft / member ink; subhead, weight 800 | Member identity; reference rows also use 24/caption and examples 20/caption. |

`em` values refer to the chip's own scaled label font size; native implementations calculate these explicitly. At 13-unit footnote, 0.8em is 10.4, 0.2em is 2.6, and 1.1em is 14.3. Visibility prose calls badges approximately 24 high, but the actual recipe is content-sized with the line box and padding above, growing with text. Do not force it into a fixed 24-unit height. Permission badges must not look like primary action buttons.

### Banners, result cards, and approval cards

**Reference banner:** opaque card pill with card shadow; padding **6**, right padding **16**, gap **10**. Leading **32-circle** carries info/warning soft background and ink, with **16 bold icon**. Body is subhead foreground. Optional action is underlined subhead context ink, with an expanded target. Announce useful status once.

**Reference result card:** base card; header gap 8, **20 filled icon** and **subhead weight 800** status label: “Saved” with success ink, “Updated” with info ink, “Not saved” with danger ink. Optional visibility badge sits at the trailing edge. Result body sits **12** below header; optional heard/transcript text uses callout secondary ink **8** below result. Success action row sits **16** below, gap **8**, wrapping Undo/Edit controls. Failure does not claim success; offer a meaningful correction/retry when appropriate. Preserve visible text after audio.

**Reference approval card:** base card; source-context **40** badge, top-aligned content gap **12**, footnote “Suggestion”, headline proposal. Evidence/visibility chips **12** below with gap 6. Actions **16** below with gap 8: primary Approve, ghost Edit, ghost Not now. After approval, show a textual success confirmation with success icon/ink. Reference markup swaps actions for confirmation, but a production app must keep focus stable and apply only confirmed operations.

### Toasts

**Reference recipe:** minimum **52 high**, pill, primary/action background, primary-foreground subhead text, float shadow, rise animation. Padding top/bottom **6**, left **20**, right **8**, gap **12**. Undo is footnote/subhead-sized inherited text at weight **800**, `voice-on-action`, minimum visual height **40**, horizontal padding **16**, expanded target ≥44. Use inverse focus on its action. Toast layer is 60; position clears keyboard, dock/navigation, and safe areas.

Reference demo dismisses after **9000ms**. Design requirement: **8–10 seconds**, pause timeout during user interaction (including touch and keyboard focus), and retain an Undo action on the result card where relevant. Never require reading a timed toast to understand the result. A polite status host announces messages; do not announce continuously changing frame content.

### Empty, loading, and thinking states

**Reference empty state:** centered, horizontal padding **24**, vertical padding **40**, **96-circle** source-context tint/ink with **48 duotone icon** and strong second tone. Title 2 **20** below circle, callout secondary copy **8** below title, readable measure about **32 characters**, tonal action **20** below copy. The surrounding card, if present, uses the normal card recipe.

**Reference skeleton card:** card with **20 effective padding** in the bundled stylesheet (the same appended 16-unit/base 20-unit class conflict as item cards), **40 circular** placeholder, gap **16**, flexible content stack with **8** vertical gap; bars **16 high at 75% width** and **12 high at 50% width**, pill radii. Use the tint/midpoint gradient and shimmer. Mark placeholder shapes decorative; provide a real loading status.

**Reference thinking indicator:** card fill, card shadow, overall radius **28** with bottom-left **16**, horizontal padding **16**, vertical **12**; three **8-circle** voice dots with **6 gaps**, 150ms stagger and thinking motion. It has an accessible processing status. For an update to existing content, the design requirement is to **retain the current result with a status**, rather than replace it with a shifting empty skeleton.

### Sheets, dialogs, popovers, and menus

**Reference phone sheet:** full-screen scrim at overlay layer 50; bottom surface uses popover/card fill, overlay shadow, top radius **36**, centered maximum width **640**, bottom safe padding, **320ms rise**. Decorative drag handle is **36×6**, centered, **10** below top, input-border color. Heading row uses gutter padding and **12** top padding, title2, and a labelled **48-circle** close button with **20 bold** icon. Content uses **16 gaps**, gutter padding, top **8**, bottom **16**; save button minimum **52**, full width. The handle alone does not imply working drag-to-dismiss.

**Reference irreversible dialog:** opaque popover surface, radius **28**, padding **24**, maximum width **440**, overlay shadow over scrim. Title 2; body secondary ink **8** below; action row **20** below with gap 8 and end alignment. Cancel is secondary and initially focused in the reference; destructive confirmation is the solid danger recipe. Constrain its width to screen gutters and make long content scrollable.

**Design requirement:** modal semantics, labelled title, a reachable Close/Cancel action, bounded scrolling, focus within the active modal, background interaction blocked, and return focus to the opener on dismissal. Back/Escape closes the top overlay first. Native screen-reader focus must move to the modal without remounting the underlying focused editor.

Popover/menu and **420-wide side sheet** have foundation surface/width tokens but no complete production recipe in the extract. Reuse opaque popover surface, foreground ink, normal radii, overlay elevation, accessible menu rows at least target size, and explicit dismissal. There is no source-backed universal popover padding or menu animation to copy; treat more specific geometry as receiving-app design work.

### Responsive content layouts

**Implemented examples plus design requirements:** preserve item identity and state when switching representations; layout switching must not recreate the focused control.

| Layout | Captured geometry / behavior | Portable requirement |
|---|---|---|
| Checklist | 16 between item cards; radius 20, 1 hairline border, padding 16. Header bottom 12, gap 12; square checkbox 48; item label 18 bold; actions gap 8 and wrap. | Single-column phone flow; explicit checked state, editing/pending feedback, readable quantity. Empty checklist has a textual prompt. |
| Item table | Local horizontal scroll, full width, collapsed borders; header/cell padding 12 and hairline dividers; caption explains content/scroll. | Prioritize columns or use a card projection; associate headers with cells; only the table region scrolls horizontally. |
| Timeline | Vertical list, gap 16; radius 20, padding 16, 4-unit context-ink start border, tint fill; bold time. | Preserve event order and timezone; source labels remain readable. The sample appends IST, which is not a universal time format. |
| Text layout | Gap 12; provenance label 14 semibold context ink; body preserves whitespace and wraps. | Visible text persists, mixed Tamil handled, references are accessible. |
| Simple diagram | Wrapping nodes; overall gap 20, node gaps 12; radius 20, padding 16, 2-unit context-ink border, tint fill, bold label. | Provide a linear textual equivalent of nodes/edges, meaningful order, and labels beyond color/arrows. |

The optional Admin reference uses compact density, linen context, a **240-wide sidebar** at expanded width, main padding 20, compact table headers 40 high/cell padding 12, and local scrolling for a minimum **576-wide** table. Chart bars are **12 high**, pill-ended with tint tracks; series/labels/values remain explicit. Monospace payload containers use neutral surface, radius 20 (10 under compact density), and padding 16. Do not turn the normal phone experience into a dense multi-panel dashboard merely to reuse this example.

### State coverage for every adopted component

Implement normal, pressed, focus, selected/checked where applicable, disabled, loading/pending, invalid/error, empty, and completed states. Add hover only for pointer-capable environments. Preserve the recipe's documented states; where a source state is absent, implement the design requirement and label any added visual treatment as adaptation.

Use text/icon changes as well as color. Disabled controls must not activate. Loading must not erase labels or move adjacent controls unexpectedly. Error text identifies a recovery action. A field's placeholder does not replace its label. Selected options and completed rows expose state to assistive technology. Every action remains reachable with touch and any supported keyboard/screen-reader input.

## Theme and environment behavior

**Foundation contract:** context identifiers are today/lists/talk/tasks/memory/linen; theme preference is **system / light / dark**, default system; source text preference is one of the six scale steps, default 100. Persist preferences. Follow system appearance changes live only when preference is system. Explicit theme changes are immediate; deliberate context changes may use the 320ms floor glide.

Initialize preferences and font availability before presenting the main UI so the first app frame uses the intended colors and typography. The source web storage keys are `nilumi.theme` and `nilumi.textScale`; these names are optional in the receiving app. Storage failure must not prevent rendering; use system appearance and the default scale. Preserve one theme authority shared by screens, overlays, and toast hosts.

The source route helper maps `/` to today, recognized first path segments to their corresponding contexts, and everything else to linen. That is legacy web behavior, not a required Expo route model. Map the receiving app's screens/activity focus to context tokens deliberately. An item's source-context badge remains its own hue even on another screen.

### Utility intent without CSS dependence

| Source utility/guard | Portable behavior |
|---|---|
| `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` | Respect the selected safe-area edges. |
| `px-gutter` | Apply the max of horizontal safe inset and the current gutter. |
| `pb-tray` | Reserve navigation/dock/overhang plus bottom safe inset and 24; adapt to the real shell. |
| `content-column` | Full available width, centered, maximum 720. |
| `touch-target` | Enlarge hit region around a small visual control; do not overlap adjacent targets. |
| `no-callout` | Suppress accidental selection/context menus on gesture controls; retain selectable meaningful content elsewhere. |
| `scroll-contain` | Keep local overlay/table scrolling from unexpectedly moving the background. |
| `focus-ring` | Opaque 2-unit outline with 2-unit offset. |
| `focus-inverse` | Use inverse focus on the primary-filled action surface. |
| `motion-fade` | Short opacity-only feedback survives reduced motion. |
| `tabular` | Aligned numeric advances. |
| `icon-duotone-tint` | Explicit full-opacity contextual second SVG path. |
| `skeleton` | Tint/midpoint/tint loading gradient, static with reduced motion. |
| Theme-switch guard | Prevent intermediate light/dark color glides. |
| Input-size guard | Web touch fields are at least scaled body size; native fields retain body sizing for legibility, without copying browser auto-zoom workarounds. |
| Selection/placeholder guards | Selection uses strong/ink; placeholder uses secondary ink, full opacity. |
| Focus scroll-padding guard | Reveal the focused element clear of fixed shell and keyboard. |

Imported web data-state variants merely select open/checked/etc. styles. Native components should consume their equivalent state directly, rather than emulate DOM attributes.

## Accessibility contract

**Design requirements:** text contrast ≥4.5:1; meaningful control/icon/focus contrast ≥3:1; opaque focus 2 with offset 2; 48-unit normal controls and 44 minimum interaction areas; large-text reflow through 200%; reduced motion; and meaning independent of hue. These are portable design targets, not a claim that the finished app has passed a full WCAG or native accessibility audit.

Focus appears on normal controls and inverse surfaces. Grouped fields delegate focus styling to their container. Forced-color web environments use the system highlight color; native accessibility focus also retains the platform's own indication. Never hide focus or reduce it to a translucent ring.

Done state = check + strikethrough. Selected state = a selected icon/label treatment and semantic state, with tint as decoration. Visibility = label + icon + outline/fill shape. Loading/listening/errors have concise readable labels. Pause timing during interaction; meaningful results remain available after transient notifications.

Provide tap alternatives for swipes/drags, labelled close actions, complete input labels, paste/autofill support, logical reading order, and accessible linear alternatives for diagrams. Announce concise state changes, not every partial transcript. Retain focus and selection through realtime/layout updates; late responses cannot steal them.

## Expo Android and iOS adaptation

This section translates the design; it does not prescribe the other project's navigation, state library, styling framework, or backend. Use the receiving Expo SDK's compatible APIs and verify its bundled React Native version. The extract contains no native project to validate against.

### Theme and colors

Create a centralized theme resolver from **resolved appearance + context**, using the native tables and alias graph. Apply colors through native styles. Share this resolver with text, controls, navigation background, modals, and toasts. Native styles do not gain full-screen CSS inheritance automatically; use reusable styled primitives and pass theme through overlay hosts.

Use the platform's appearance subscription (`useColorScheme` / `Appearance`) when following system mode, plus the receiving app's persistent preference store. Keep the splash/startup surface compatible with the selected appearance while fonts/preferences load. Validate background/system bar contrast on both platforms; drawing a web `theme-color` meta tag is not a native implementation. In edge-to-edge layouts the safe-area background supplies the visible surface, and status/navigation icon appearance must remain legible.

### Fonts and Tamil

Bundle licensed Nunito and Noto Sans Tamil assets for offline launch. `expo-font` can embed assets using its config plugin in a native build, or load local files at runtime while a startup screen remains visible. Font-family registration differs between platforms; verify the actual loaded faces. Variable-font and axis support depends on SDK, React Native, OS, and font metadata. For reliable exact weight **750**, use a verified axis configuration or a static750 instance; do not silently substitute700/800 or synthetic bold. These are adaptation choices governed by the target environment. [Expo font documentation](https://docs.expo.dev/develop/user-interface/fonts/).

Assign the font family explicitly in your shared text primitives. Use nested text runs for Tamil with the taller line box and zero tracking; a CSS family fallback list or `lang` span is not a native font-selection mechanism. Verify shaped Tamil vowel signs and joiners at normal/large text, not just isolated alphabet samples.

### Text scaling

Respect native accessibility text size. React Native text supports `allowFontScaling`, enabled by default; text inheritance is limited to text subtrees. Numeric `lineHeight`/`letterSpacing` replace CSS multipliers/em, and must remain compatible with the chosen scaling path. [React Native Text reference](https://reactnative.dev/docs/text).

Default adaptation: use base token sizes with native OS scaling, without an extra manual OS multiplier. The source's six-step in-app selector is optional on native. If retained, define it as a minimum preferred total size: `effectiveScale = max(systemScale, appScale)`. Ensure only one layer applies the OS contribution; for a runtime with linear font scaling, style factor `effectiveScale / systemScale` before native scaling avoids multiplying the two preferences. Verify the actual platform scaling behavior, including line boxes and inputs, rather than assuming every property scales identically. Do not copy a blanket 200% limit onto larger OS settings. The legacy tab cap requires an accessible navigation alternative if used.

### Safe areas and keyboard

Use native safe-area measurements; Expo documents `react-native-safe-area-context` for edge insets. Reproduce the max(gutter,inset) horizontal rule explicitly; a container that adds gutter to an already-applied inset will have different spacing. Apply each edge once and ensure any independent modal root receives safe-area context. [Expo safe-area guide](https://docs.expo.dev/develop/user-interface/safe-areas/).

Use native keyboard avoidance/measurement for the selected screen layout. A persistent composer must clear the keyboard and home indicator without covering active fields, result actions, or the last row. Test Android resize behavior and iOS keyboard overlap separately. Back should dismiss the top modal/keyboard as appropriate before leaving the screen. Rotate, resize, and open the keyboard at large text to check the measured shell reservations.

### Touch, borders, shadows, and motion

Use a pressed-state native control with enlarged hit regions where the visual is smaller. Recreate the custom switch/check geometry when exact appearance matters; stock OS controls have different shapes. Dashed private outlines must remain distinct on both platforms. Outline/focus rings may require a separate wrapper; do not change layout or clip the ring.

Shadow capability varies with runtime/architecture and OS. Use supported `boxShadow` for the multi-layer geometry where available. Legacy iOS shadow props and Android elevation are fallbacks with different appearance; elevation values do not encode the source blur/spread. Preserve the specified color/surface hierarchy and record approximations after device review. [React Native shadow props](https://reactnative.dev/docs/shadow-props).

Reproduce timing, easing, transforms, and state cues with the app's native animation system. For exact contextual floor interpolation, use OKLab interpolation or precomputed OKLab intermediate values; direct RGB interpolation is an approximation. Query and subscribe to native reduced-motion preferences; cancel active movement when the setting changes and retain static statuses. [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo).

### Assistive technology and overlays

Expose action roles, labels, selected/checked/disabled/busy states, and meaningful hints through native accessibility props. Decorative SVG paths and skeleton shapes must not be separately read. Announce status through supported platform mechanisms; modal accessibility and focus restoration need native handling beyond visual placement. iOS and Android screen-reader behavior differs, so validate VoiceOver and TalkBack separately. [React Native accessibility guidance](https://reactnative.dev/docs/accessibility).

### Native fidelity boundaries

Exact tokens, geometry, and intended behavior are specified here; font rasterization, native text breaking, system accessibility focus, keyboard behavior, and shadow rendering can differ. Record necessary native deviations rather than claim they are original Nilumi values. Device review is part of adoption, even after numerical contrast checks pass.

## Optional Nilumi experience patterns

These examples convey how the visual language is composed. They do not require the receiving app to implement Nilumi's household data model, speech workflow, backend authorization, or navigation.

### Stable Home, focused activity, composer, and Recent

**Selected prototype/planned production guidance:** stable Home combines a brief, one focused activity, persistent composer, and Recent. Topic changes update the focused content/context deliberately without moving the composer or discarding previous activity state. Inbox/Settings/Admin open through header/menu controls. Keep a comfortable centered reading width on large screens.

Recent can be a sheet/picker with safe titles and accessible selection. Return focus to the opener on close. Preserve stable domain IDs across checklist/table/timeline/text/diagram views and defer/reconcile layout replacement during editing so selection and reading position survive.

### Voice states and composer appearance

**Reference composer geometry:** card-surface pill, float shadow, minimum capture-height, left padding 20, right/top/bottom 6, gap 12, body-size secondary placeholder. A real circular capture button uses coral/navy, normally 48 with 24 filled microphone; the phone capture example uses 44. Listening replaces placeholder with bold foreground “Listening…” and five bars **4×20**, gap 2, 120ms stagger, plus the ring.

**Design requirement:** one tap starts foreground conversation; microphone/session indication persists. Listening, processing, speaking, interrupted, disconnected, and paused states have distinct readable labels. End releases media; Mute controls spoken output; Stop stops the current speech; Replay reads the currently authorized response. Typed text stays quiet in auto mode. Do not auto-start capture after permission/focus changes, and do not allow late audio/results to steal activity focus. The specimen's hold-to-talk animation does not override these intended interactions or prove capture is functional.

### Household visibility meanings

If adopting Nilumi's permission model: Household = both adults can see/edit; Shared = both can see but only the owner can change; Private = owner only and existence hidden from the other member. Never infer authorization from the badge or its color. If the receiving app has different meanings, retain the shape/icon/label distinction while defining truthful labels and permissions separately.

### Legacy navigation and conversation references

**Reference only:** the old tray phases are 2 tabs (Today/Talk), 3 (Today/Lists/Talk), 4 (Today/Lists/Talk/Memory), and 5 (Today/Lists/Talk/Tasks/Memory). The current Home guidance no longer requires these domain tabs.

Tray uses card surface, top radius **30**, overlay shadow, bottom safe padding, inner padding 8, equal columns, maximum **512**. Standard selected tab uses a **56×32 tint pill**, **24** filled icon, bolder context-ink label; unselected uses regular icon/secondary label. Labels use the tab role and may wrap to two lines. At ≥3 tabs the Talk reference uses a **60 coral circle**, **28 conversation glyph**, raised by **28**; it navigates and never records. Flat trays have no overhang. Source controls still need expanded interaction areas where the example's visible region is smaller.

Reference header: contextual floor, sticky/header layer 30, top safe inset, min header-height, gutter padding, gap 8. Optional back action is 48 with 24 bold caret; Inbox action is 48 card circle with 24 regular bell/card shadow. Avatar defaults 40. Heading can be large in content or headline in the header. Notification-count geometry is a demonstration; ensure actual count text has checked contrast and an accessible unread label.

Reference outgoing bubble: action fill/foreground, width at most 85%, radius 28 with bottom-right 16, horizontal padding 16/vertical 12, body text. Incoming choice bubble: card fill, maximum 90%, radius 28 with bottom-left 16, padding 16, optional wrapping tonal buttons 12 below. Retain visible authorized text after speech, and do not hide errors inside transient audio alone.

## Adoption and reproduction checklists

### Build in the receiving project

- [ ] Centralize both themes, six context palettes, aliases, and derived native values; preserve alpha separately.
- [ ] Bundle the exact font families and needed weights, including 750; preserve font license notices. Bundle matching Phosphor shapes/weights and explicit duotone paths.
- [ ] Define named type, spacing, radius, elevation, motion, layer, and layout roles. Keep text scaling separate from geometric spacing.
- [ ] Build reusable themed text/control/card/overlay primitives. Choose implemented or reference recipe explicitly for buttons/checkboxes.
- [ ] Map the other app's contexts deliberately; keep status, member, and visibility styling separate from those contexts.
- [ ] Initialize/persist appearance preferences; share theme with modal/toast roots. Honor native OS text/reduced-motion settings.
- [ ] Implement safe areas, measured keyboard/dock clearance, large-text wrapping, and enlarged hit regions.
- [ ] Complete accessible states, focus preservation/restoration, tap alternatives, meaningful loading/error/empty feedback, and durable results.
- [ ] Add only product patterns the receiving app needs. Existing project tooling remains authoritative; no web dependency is required by this document.

### Reproduction review matrix

| Scenario | Acceptance criteria |
|---|---|
| Each of six contexts × light/dark | Exact supplied colors/aliases; solid cards separate from floor; source-context badges keep their origin hue; no generic black/white/palette overrides. |
| Normal,100/115/130/150/175/200% text | Source type and spacing proportions; controls expand, labels/actions remain reachable, no page-wide horizontal overflow. Native also tests larger OS settings. |
| Latin, Tamil, mixed Tamil/English, long words | Correct font faces/weights, vowel signs unclipped, no altered graphemes, readable line boxes, stable numeric alignment. |
| Every interactive component state | Label/state remains meaningful with color removed; disabled cannot activate; pending avoids duplicates; error offers recovery; focus is visible. |
| Phone portrait/landscape and tablet/resized window | Width-class gutters and measured layouts; safe areas respected; content measure constrained; text-aware grids reduce columns. |
| Keyboard open, large text, nested overlay | Composer/fields/actions visible; insets applied once; modal has close action; focus/selection survives changes; dismiss returns focus appropriately. |
| System appearance change and relaunch | System mode follows change; override stays selected; startup matches stored theme/fonts without an incorrect app frame. |
| Reduced motion, including changing it while active | Movement/shimmer stops; listening/processing/checked state remains understandable; permitted opacity feedback stays short. |
| VoiceOver / TalkBack separately | Logical reading order, labels and checked/selected/busy state; modal background excluded; concise announcements; focus restored. |
| Touch, supported keyboard, swipe alternatives | Target sizes meet contract; no overlapping hit regions; actions work without hover/drag; Undo remains reachable. |
| Offline cold launch | Both fonts and icons are bundled; no reliance on the catalogue's online Google Fonts stylesheet. |
| Shadows and color on actual iOS/Android hardware | Hierarchy matches the specified roles; any gamut/font/shadow deviations documented rather than hidden. |

These are receiving-app checks, not completed phone QA. Capture the build/runtime/device/OS, theme/context/text setting, test steps, expected/actual result, and any deviation.

## Validation and provenance

### Checks performed for this document

The color tables cover **80 primitive tokens per theme (160 declarations)**, retaining source OKLCH and alpha. Derived values cover both primary-hover colors, six expanded light floors, and twelve skeleton midpoints. Alias and component coverage are checked against the captured stylesheet, primitives, layout examples, and specimen recipes. Internal Markdown navigation is checked; no essential relative file or image dependency is used.

The captured contrast gate was rerun with its original 69 pairs across six contexts, two themes, and two widths: **1,656 checks passed**. A second run resolved colors, converted them to the supplied 8-bit native sRGB values while preserving alpha, and checked the same pairs with RGB alpha compositing: **all 1,656 passed**. This includes source-context badges across surfaces, control/focus/glyph contrast, compatibility washes, expanded floors, and design separation. It does not validate arbitrary new color pairs, every state in a finished component, or native rendering.

The extract's prior browser evidence also records identical original/extracted reference screenshots, font loading, theme behavior, and a dark/200% text spot check. Those were desktop Chromium tests with phone-sized viewports, not installed iPhone/Android, native screen-reader, keyboard, or offline-font verification. No new native app or device audit was performed to create this guide.

### Source snapshot

| Item | Captured value |
|---|---|
| Source | Nilumi design-system-extract |
| Extract timestamp | 2026-10-11T11:34:39.861701+00:00 |
| Source Git commit | `f70d2317f091df3cac24bcddf9c608060e1ff49b` |
| Snapshot policy | Captured working tree, including modified/untracked UI source; not solely the commit tree. |
| Canonical stylesheet SHA-256 | `505a11039190144d25f7ca3dae8fa81f3c7c1fe2b25382a02140c13c75632372` |
| Original foundation sources | `ui/src/styles/globals.css`, `ui/src/fonts.ts`, `ui/src/lib/theme.ts` |
| Implemented control/layout sources | `ui/src/components/ui/button.tsx`, `ui/src/components/ui/checkbox.tsx`, `ui/src/components/nilumi/layouts.tsx` |
| Reference recipe sources | `ui/specimen/kit.js`, `ui/specimen/phone.js`, `ui/specimen/specimen.js` |
| Design/evidence sources | Extract README/TOKENS/VALIDATION, preserved design-system/ADR/device-QA documents. |

Source paths in this table identify provenance only; they are not needed to use the guide. This is a dated snapshot. Future receiving-app changes should record intentional deviations and recheck affected contrast, text, geometry, and device behavior. The numeric source specification and native adaptation guidance have different authority; keep that distinction when maintaining your adopted design system.
