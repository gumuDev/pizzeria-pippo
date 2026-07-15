import { Plus_Jakarta_Sans, Work_Sans } from "next/font/google";

// Self-hosted via next/font (no external Google Fonts <link>), scoped to the
// landing page only — the rest of the app keeps using its own fonts.
export const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-landing-heading",
});

export const bodyFont = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-landing-body",
});
