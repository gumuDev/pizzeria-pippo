"use client";
import { useEffect } from "react";
import { Button } from "antd";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[client-error]", error);
  }, [error]);

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
      <h1 style={{ color: "#dc2626", fontSize: 24, fontWeight: 700 }}>Ocurrió un error</h1>
      <p style={{ color: "#6b7280", maxWidth: 400 }}>
        Algo salió mal al cargar esta página. Por favor intentá de nuevo.
      </p>
      {error.digest && (
        <p style={{ color: "#9ca3af", fontSize: 12 }}>Código: {error.digest}</p>
      )}
      <Button type="primary" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
