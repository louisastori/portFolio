# Design System Strategy: The Digital Atelier

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Atelier."** 

Standard smart home interfaces often feel like technical utility panels—cold, rigid, and cluttered. This system rejects the "control center" trope in favor of a "curated gallery" experience. By blending the tactile warmth of high-end editorial print (Fraunces) with the ethereal precision of glassmorphism, we create a dashboard that feels less like a computer and more like a bespoke piece of home furniture.

**Breaking the Template:** 
We move beyond the standard grid by utilizing **Intentional Asymmetry**. Large-scale typography (Display-LG) should anchor one corner of the screen, while glass cards float with varying heights, creating a rhythmic, layered depth. We prioritize breathing room over density, ensuring the user feels a sense of serenity rather than information fatigue.

---

## 2. Colors
Our palette balances organic warmth with technical depth. We use a "living" color strategy where the UI responds to the home’s energy.

*   **Primary (#091b2a / #1f3040):** Used for deep-seated grounding elements and high-contrast text.
*   **Secondary Mint (#28685e):** Reserved for "active" states and serene environments (e.g., HVAC cooling, garden irrigation).
*   **Tertiary Coral (#db7c51):** High-energy accents for sports alerts, security warnings, or heating.

### The "No-Line" Rule
**1px solid borders are strictly prohibited for sectioning.** To define boundaries, use:
1.  **Background Shifts:** Place a `surface_container_low` card atop a `surface` background.
2.  **Tonal Transitions:** Use a soft shift from `surface` to `surface_variant` to indicate a change in functional zone.

### Surface Hierarchy & Nesting
Treat the tablet screen as a series of physical layers. 
*   **Base:** `surface` (#fef9f1).
*   **Secondary Zones:** `surface_container`.
*   **Interactive Cards:** `surface_container_lowest` (white) for a "lifted" paper feel, or Glassmorphism for a "floating" feel.

### The "Glass & Gradient" Rule
For floating interactive elements, use **Glassmorphism**. 
*   **Recipe:** `surface_container_lowest` at 60% opacity + 24px Backdrop Blur.
*   **Signature Textures:** Apply a subtle linear gradient (Top-Left to Bottom-Right) from `primary` to `primary_container` for hero CTA buttons to provide a sense of "physical soul" and depth.

---

## 3. Typography
We use a high-contrast pairings to evoke a premium editorial feel.

*   **Headings (Fraunces):** Our "Voice." Fraunces brings a human, sophisticated touch. Use `display-lg` for time and weather, and `headline-md` for room names.
*   **UI & Body (Sora/Manrope):** Our "Utility." Sora (as implemented via Manrope tokens) provides the geometric clarity needed for quick legibility on a wall-mounted device.

**The Hierarchy of Authority:**
*   **Display-LG (Fraunces):** Used for "The Hero Statement" (e.g., "Good Evening, Julian").
*   **Title-LG (Manrope):** Used for primary card labels and touch-target descriptions.
*   **Label-SM (Manrope):** Used for metadata (e.g., "Last updated 2m ago").

---

## 4. Elevation & Depth
In this system, depth is communicated through **Tonal Layering** rather than structural scaffolding.

*   **The Layering Principle:** Instead of shadows, use the Surface-Container tiers. A `surface_container_highest` element naturally feels "closer" to the user than a `surface_dim` background.
*   **Ambient Shadows:** For floating glass cards, use a 40px blur at 4% opacity using a tinted version of `on_surface` (#1d1c17). Never use pure black shadows; they feel "dirty" on our warm neutral base.
*   **The "Ghost Border" Fallback:** If a container requires more definition against a complex background, use the `outline_variant` token at **15% opacity**. This creates a "breath of a border" that defines the edge without closing the space.

---

## 5. Components

### Cards (The Core Primitive)
*   **Style:** No internal dividers. Use `spacing-6` (2rem) to separate internal content.
*   **Radius:** Always `xl` (3rem) for the outer container; `lg` (2rem) for nested elements.
*   **Interaction:** On-touch, the card should scale down slightly (98%) and increase blur density.

### Large Touch Targets (Buttons)
*   **Primary:** `primary` background with `on_primary` (white) text. High-gloss finish.
*   **Secondary:** `secondary_container` background.
*   **Sizing:** Minimum height of `spacing-16` (5.5rem) for main dashboard toggles to ensure "no-look" usability while walking past the tablet.

### Lists
*   **Rule:** Forbid divider lines. Use `surface_container_low` for the list container and `surface_container_lowest` for individual items to create a "pilled" look. Use `spacing-2` between items.

### Smart Home Toggles (Chips)
*   **State:** Unselected chips use `surface_variant`. Selected chips use `secondary` (Mint) for "Eco/On" or `tertiary` (Coral) for "Alert/Active."

### Custom Component: The "At-A-Glance" Arc
A bespoke gauge component using a semi-circular `outline` path to show energy usage or temperature. The stroke should use a gradient from `primary_fixed` to `secondary`.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If a screen feels full, increase the spacing from `8` to `12` before removing elements.
*   **DO** mix your typefaces. Use Fraunces for the "Story" (Welcome, Room Name) and Manrope for the "Data" (Degrees, Watts).
*   **DO** use `radius-xl` on all primary containers to maintain a soft, premium handheld-object feel.

### Don't
*   **DON'T** use 100% opaque borders. It breaks the "Atelier" illusion and creates a "Bootstrap" look.
*   **DON'T** use pure grey. Every "neutral" in this system is warmed by the `#f4efe7` base.
*   **DON'T** clutter. If a feature isn't used daily, hide it in a secondary layer. The wall tablet is a glance-and-go device, not a deep-dive configuration tool.