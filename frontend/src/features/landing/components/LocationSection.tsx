import { buildWhatsAppGeneralLink } from "../constants/landing.constants";
import type { PublicBranch } from "../types/landing.types";

function BranchCard({ branch }: { branch: PublicBranch }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md">
      {branch.address && (
        <iframe
          title={`Mapa — ${branch.name}`}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(branch.address)}&output=embed`}
          className="w-full h-48 border-0"
          loading="lazy"
        />
      )}
      <div className="p-5">
        <h3 className="font-[var(--font-landing-heading)] font-bold text-lg text-[#1c1b1b] mb-1">{branch.name}</h3>
        {branch.address && <p className="font-[var(--font-landing-body)] text-sm text-[#5b403b] mb-3">{branch.address}</p>}
        {branch.phone && (
          <a
            href={buildWhatsAppGeneralLink(branch.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-center bg-[#1c1b1b] text-white font-[var(--font-landing-body)] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#b62409] transition-colors"
          >
            WhatsApp: {branch.phone}
          </a>
        )}
      </div>
    </div>
  );
}

interface Props {
  branches: PublicBranch[];
  loading: boolean;
}

export function LocationSection({ branches, loading }: Props) {
  return (
    <section id="ubicacion" className="py-20 px-5 md:px-10 bg-[#fcf9f8]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-[var(--font-landing-heading)] font-bold text-3xl text-[#1c1b1b] mb-3">Nuestras sucursales</h2>
          <p className="font-[var(--font-landing-body)] text-[#5b403b]">Encontrá la más cercana a vos.</p>
        </div>
        {loading ? (
          <p className="text-center font-[var(--font-landing-body)] text-[#5b403b]">Cargando sucursales...</p>
        ) : branches.length === 0 ? (
          <p className="text-center font-[var(--font-landing-body)] text-[#5b403b]">Sin sucursales disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
