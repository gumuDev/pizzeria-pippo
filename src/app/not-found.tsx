import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 16,
        textAlign: "center",
        padding: 32,
      }}
    >
      <h1 style={{ color: "#ea580c", fontSize: 48, fontWeight: 700 }}>404</h1>
      <p style={{ color: "#6b7280", maxWidth: 400 }}>
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/"
        style={{
          background: "#ea580c",
          color: "#fff",
          padding: "8px 24px",
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
