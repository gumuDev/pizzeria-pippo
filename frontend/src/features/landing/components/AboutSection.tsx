import Image from "next/image";
import { FACEBOOK_URL, TIKTOK_URL, CONTACT_EMAIL } from "../constants/landing.constants";

export function AboutSection() {
  return (
    <section id="acerca" className="py-20 px-5 md:px-10 bg-[#f6f0ee]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="rounded-[2rem] overflow-hidden shadow-xl">
          <Image src="/landing/pizza.jpg" alt="El equipo de Pippo Pizza" width={800} height={1000} className="w-full h-auto" />
        </div>
        <div>
          <h2 className="font-[var(--font-landing-heading)] font-bold text-3xl text-[#1c1b1b] mb-5">Acerca de nosotros</h2>
          {/* Texto borrador — revisar y reemplazar con el mensaje real del negocio */}
          <p className="font-[var(--font-landing-body)] text-[#5b403b] text-lg mb-4">
            Somos Pippo Pizza, un emprendimiento familiar de La Paz. Cada pizza la preparamos nosotros mismos,
            con ingredientes frescos y las recetas que fuimos perfeccionando con el tiempo.
          </p>
          <p className="font-[var(--font-landing-body)] text-[#5b403b] text-lg mb-8">
            Nos encontrás en nuestras sucursales o pedís directo por WhatsApp — gracias por elegirnos.
          </p>
          <div className="flex flex-col gap-2 font-[var(--font-landing-body)] text-[#5b403b] mb-6">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[#b62409] transition-colors">
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="flex gap-4">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-11 h-11 rounded-full border border-[#8f7069]/30 flex items-center justify-center text-[#5b403b] hover:bg-[#b62409] hover:text-white hover:border-[#b62409] transition-all"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1Z" />
              </svg>
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-11 h-11 rounded-full border border-[#8f7069]/30 flex items-center justify-center text-[#5b403b] hover:bg-[#b62409] hover:text-white hover:border-[#b62409] transition-all"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M14 3v11.5a3.5 3.5 0 1 1-3-3.46" />
                <path d="M14 3a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
