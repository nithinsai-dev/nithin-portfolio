# Nithin Sai — Developer Portfolio (2026)

A personal portfolio built around a dark warm-black (`#140C0D`) and gold (`#F2C14E`) aesthetic. Features an interactive 3D hero stage, scroll-driven journey, builder vs. breaker split perspectives, five-column curtain page transitions, and an expandable projects index.

## Tech Stack
- **Framework**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **3D & Animation**: Three.js, @react-three/fiber, GSAP ScrollTrigger, Motion
- **Fonts**: Self-hosted `@fontsource` (Bricolage Grotesque, Hanken Grotesk, Geist Mono)

---

## Performance Testing

To evaluate performance, SEO, accessibility, and Core Web Vitals under production conditions:

1. **Build the production assets**:
   ```bash
   npm run build
   ```
   *Verifies TypeScript compilation, code splitting into `vendor-react`, `vendor-three`, `vendor-motion`, and dynamic chunks for 3D and ScrollTrigger.*

2. **Start the local production preview server**:
   ```bash
   npm run preview
   ```
   *Serves the optimized build from the `dist/` folder.*

3. **Run Lighthouse in an Incognito / Private browser window**:
   - Open Chrome (or your Chromium-based browser) in **Incognito mode** to disable extensions and cached state.
   - Navigate to `http://localhost:4173/` (Home route).
   - Open Chrome DevTools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`) and select the **Lighthouse** tab.
   - Run the audit for **Mobile** (Performance, Accessibility, Best Practices, SEO).
   - Run the audit for **Desktop**.
   - Navigate to `http://localhost:4173/projects` (Projects route) and repeat the audit for both **Mobile** and **Desktop**.

---

## Available Scripts

- `npm run dev` — Starts the Vite development server.
- `npm run build` — Compiles TypeScript (`tsc -b`) and bundles for production (`vite build`).
- `npm run preview` — Locally previews the production build.
