# SDDSS UI Guidelines

## 1. Typography
- Primary body font: `Manrope` (weights 400, 500, 600, 700).
- Heading font: `Space Grotesk` (weights 500, 600, 700).
- Use `font-heading` for page titles and section headers.
- Use `text-muted-foreground` for helper copy and secondary labels.

## 2. Color Palette
- Primary: `hsl(154 58% 33%)`.
- Accent: `hsl(42 90% 57%)`.
- Secondary: `hsl(40 38% 35%)`.
- Background: `hsl(48 38% 96%)`.
- Surface/Card: `hsl(0 0% 100%)`.

## 3. Layout and Spacing
- Dashboard page wrapper: `p-6 md:p-8`.
- Vertical section rhythm: `space-y-6` or `space-y-8`.
- Cards: rounded-xl or rounded-2xl with border and subtle shadows.
- Keep key actions in the top section of each page.

## 4. Iconography
- Use `lucide-react` icons only.
- Keep icon sizes consistent:
  - Stat cards: `h-4 w-4`.
  - Navigation: `h-4 w-4`.
  - Hero badges: `h-3.5 w-3.5`.

## 5. Data Visualization
- Prefer clean cards, progress bars, and compact bar-like indicators.
- Show percentages beside progress bars for clarity.
- For district breakdowns, include both totals and risk/compliance indicators.

## 6. Navigation
- Farmer navigation order:
  1. My Farm
  2. Recommendations
  3. Farm Performance / Percentages
  4. Warnings and Alerts
  5. Satellite Maps
  6. Weather Information
  7. Market Information and Market Conditions
- Keep labels task-oriented and role-specific.

## 7. Content Principles
- Keep welcome page concise and focused on platform purpose.
- Use real crop imagery with short, practical summaries.
- Surface the most critical decision path first (for farmers: My Farm).
