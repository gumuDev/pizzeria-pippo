"use client";

export function DisplayThankYou() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 96, marginBottom: 24, animation: "pulse 2s ease-in-out infinite" }}>🙌</div>
      <h1 style={{ fontSize: 72, fontWeight: 800, color: "#fb923c", margin: "0 0 16px" }}>¡Gracias!</h1>
      <p style={{ fontSize: 26, color: "#d1d5db", margin: 0 }}>Tu pedido está siendo preparado</p>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
