/**
 * Central barrel for UI primitives - keep this list in sync
 * with files inside `components/ui`.
 *
 * All files are referenced **without** an extension so both
 * `.ts` and `.tsx` will be resolved automatically.
 *
 * You can now import any primitive with:
 *   import { Button, Card } from "@/components/ui"
 */

/* Core primitives */
export * from "./button"
export * from "./card"
export * from "./badge"
export * from "./table"
export * from "./input"
export * from "./checkbox"

/* Overlay & interaction primitives */
export * from "./dialog"
export * from "./popover"
export * from "./dropdown-menu"
export * from "./tooltip"
export * from "./alert"

/* Layout & misc. */
export * from "./accordion"
export * from "./select"
export * from "./form"
