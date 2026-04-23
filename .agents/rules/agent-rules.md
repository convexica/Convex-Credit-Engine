---
trigger: model_decision
---

# Agent Rules — Convex Credit Engine (Indian PTC Workstation)

## 1. PROJECT ETHOS & SOLO BUILDER MINDSET
- You are assisting a solo builder/founder who relies on visual feedback. 
- ALWAYS prioritize a **UI-First Interactive Approach**. Build the UI components, inputs, and tables *before* optimizing complex mathematical algorithms in isolation.
- If the mathematical engine fails, ensure it falls back gracefully (e.g., returning `0` or `NaN`) rather than crashing the React application, to allow continuous UI testing.

## 2. AESTHETICS & BRANDING ("Quiet Luxury")
- The application must strictly adhere to the Convexica "Quiet Luxury" aesthetic.
- **Backgrounds**: Deep Navy (`bg-deep-navy`) and Charcoal (`bg-charcoal`).
- **Typography & Accents**: Silver/Muted text (`text-slate-text`, `text-silver-text`) for raw data; Convexica Gold (`text-convexica-gold`) for headers and primary highlights.
- **Hierarchy**: Rely on uppercase tracking (`tracking-widest`, `text-xs uppercase`) for section headers rather than bright, loud colors.
- **Currency**: Keep the UI generic and international absent specific instruction. Avoid hardcoding `₹` or `$` symbols in the analytical tables.

## 3. INDIAN STRUCTURED CREDIT METRICS (RBI Nuances)
- The core math engine must always account for Indian securitisation conventions:
  - **Turbo Triggers**: Deal structures must support trigger-based routing (e.g., redirecting Excess Spread to Senior Principal if Cumulative Defaults breach a threshold).
  - **Cash Collateral**: Support reserve accounts that replenish dynamically within the waterfall.
  - **Duration**: Always calculate and display *Modified Duration* alongside yield and WAL for comprehensive risk profiling.

## 4. ARCHITECTURE & MODULARITY
- **Strict Separation**: The financial math (`src/core/engine`) must be pure TypeScript. It cannot contain any React dependencies or DOM logic so it can be easily run in headless environments or unit tested.
- **DSL Mindset**: The waterfall priority of payments must move toward a parameterized step-by-step instruction array (Command Pattern), avoiding monolithic, hard-coded `for` loops wherever possible.