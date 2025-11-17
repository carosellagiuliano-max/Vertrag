# Design System – Phase 2

Phase 2 liefert die UI-Primitives und Tokens für Booking, Shop, Kundenportal und Admin. Grundlage sind Tailwind 4, Radix UI
und shadcn-konforme Strukturen.

## Tokens
- **Farben:** `surface`, `card`, `ink`, `muted`, `border`, `accent`, `accent-strong`, `ring` (siehe `app/globals.css`).
- **Typo & Radius:** Geist Sans/Mono, Radien `lg/md/sm` in `tailwind.config.ts`.
- **Schatten & Animationen:** `shadow-surface` für Layer, Keyframes für Dialog/Sheet/Toast/Skeleton in `tailwind.config.ts`.

## Primitives
Alle Komponenten leben in `components/ui/` und nutzen `cn` aus `@/lib/utils`.
- **Button** – Varianten `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`; Größen `sm`–`icon`, `asChild` via Radix Slot.
- **Badge** – Varianten `default`, `muted`, `outline`, `success`.
- **Card** – Wrapper mit `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- **Input** – Textfelder mit Fokus-Ring & Disabled-State.
- **Select** – Radix Select mit Trigger, Content, Item, Label, Separator.
- **Dialog** – Radix Dialog mit Overlay, Content, Header/Footer, Title/Description.
- **Sheet** – Dialog-basierte Variante mit Slide-In von rechts/links.
- **Toast** – Radix Toast inkl. `Toaster` Provider und `useToast` Hook.
- **Skeleton** – Animierter Ladezustand via `animate-skeleton`.

## Nutzung
- Provider `Toaster` ist global in `app/layout.tsx` eingebunden.
- Beispiel-Interaktionen sind auf der Startseite in `DesignSystemShowcase` eingebaut.
- Neue Komponenten sollen Tokens aus `app/globals.css` und Klassen aus `tailwind.config.ts` respektieren.

## Nächste Schritte (Phase 3)
- Design Tokens in Storybook o.ä. visualisieren (optional).
- Komponentenspezifische Tests (z. B. Snapshot/Accessibility) ergänzen.
- Responsive States in Booking- und Shop-Flows verankern.
