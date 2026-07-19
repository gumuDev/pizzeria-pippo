"use client";

import { useLandingData } from "@/features/landing/hooks/useLandingData";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { PizzaSection } from "@/features/landing/components/PizzaSection";
import { LocationSection } from "@/features/landing/components/LocationSection";
import { AboutSection } from "@/features/landing/components/AboutSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { headingFont, bodyFont } from "@/features/landing/lib/landing-fonts";

export default function RootPage() {
  const { pizzas, branches, loading, primaryPhone } = useLandingData();

  return (
    <div className={`${headingFont.variable} ${bodyFont.variable}`}>
      <LandingHeader phone={primaryPhone} />
      <main>
        <LandingHero phone={primaryPhone} />
        <PizzaSection pizzas={pizzas} loading={loading} branches={branches} />
        <LocationSection branches={branches} loading={loading} />
        <AboutSection />
      </main>
      <LandingFooter phone={primaryPhone} />
    </div>
  );
}
