# Project-Specific Rules for Hotel Management System

When assisting with this codebase, ALWAYS adhere to the following design patterns and constraints:

## 1. UI Components & Interactions

- **Custom Dialogs:** NEVER use native browser dialogs like `window.confirm()`, `window.alert()`, or `window.prompt()`. Always implement custom modal popups (typically powered by Framer Motion for smooth `AnimatePresence` transitions).
- **Date Picking:** ALWAYS use the custom-built `DatePicker` component (`@/components/ui/date-picker`) for date selections. Do not use standard `<input type="date">`.

## 2. Styling & Aesthetics

- **Button Styling:** All buttons must have consistent hover and active state animations to maintain a premium feel. Standard button utility classes include:
  `transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md`
- **Modern Design:** Rely heavily on TailwindCSS to create vibrant, clean interfaces with rounded corners, subtle shadows, and good use of whitespace.

## 3. Data & Forms

- **Validation:** All forms must have robust validation. Use `react-hook-form` paired with `zod` resolvers to validate inputs before submission.
- **Feedback:** Use `react-hot-toast` to provide immediate success or error feedback to the user upon actions (e.g., saving, deleting).
