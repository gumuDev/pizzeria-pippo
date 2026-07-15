import Image from "next/image";
import { buildWhatsAppGeneralLink } from "../constants/landing.constants";

export function LandingHero() {
  return (
    <section id="inicio" className="pt-28 pb-16 px-5 md:px-10 bg-[#fcf9f8]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-block bg-[#ffdad3] text-[#8e1400] font-[var(--font-landing-body)] text-xs font-bold uppercase tracking-wide px-4 py-1.5 rounded-full mb-5">
            Pippo Pizza · La Paz
          </span>
          <h1 className="font-[var(--font-landing-heading)] font-extrabold text-4xl md:text-5xl text-[#1c1b1b] leading-tight mb-5 text-wrap-balance">
            Pizza casera, hecha con cariño en cada sucursal
          </h1>
          <p className="font-[var(--font-landing-body)] text-[#5b403b] text-lg mb-8 max-w-md">
            Elegí tu pizza favorita y pedila directo por WhatsApp — te confirmamos tiempo de entrega y sucursal más cercana al toque.
          </p>
          <a
            href={buildWhatsAppGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#b62409] text-white font-[var(--font-landing-body)] font-bold px-8 py-4 rounded-full shadow-lg shadow-[#b62409]/20 hover:bg-[#93000a] transition-colors"
          >
            Pedir por WhatsApp
          </a>
        </div>
        <div className="relative rounded-[2rem] overflow-hidden shadow-xl">
          <Image
            src="/landing/canva.jpg"
            alt="Siempre es un buen día para una pizza — Pippo Pizza"
            width={1080}
            height={1080}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}
