# Homepage Motion Design

## Goal

Add restrained motion to the homepage using the approved A + B + light D direction from the visual demo:

- A: editorial stagger reveal for the hero copy.
- B: subtle 3D hover tilt and cursor glare for academic record cards.
- D: a small sliding active indicator for the homepage navigation.

## Design

The homepage should keep its current dark academic tone. Motion should support scanning and orientation instead of becoming decorative. The implementation will use CSS-first transitions inspired by `transitions-dev`, with small client-side hooks only where pointer measurement is required.

## Scope

The first implementation touches only homepage surfaces:

- `HomePageView` hero text receives stagger reveal classes.
- `AcademicRecordCard` gets an outer flat tilt hit area, an inner card surface, and a glare layer.
- `HomeNav` tracks the active section from scroll position and moves a slim indicator under the active link.
- `globals.css` receives semantic motion tokens and the required `prefers-reduced-motion` guard.

## Constraints

- No new runtime animation library.
- Preserve existing homepage layout and content.
- Keep touch/mobile behavior conservative: no card tilt on coarse pointer devices.
- Respect `prefers-reduced-motion`.
- Keep the diff scoped; do not redesign unrelated pages.
