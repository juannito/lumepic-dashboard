"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main className="skeleton">
          <section className="skeleton-inner">
            <p className="eyebrow">Lumepic dashboard</p>
            <h1>No pude cargar el tablero.</h1>
            <button className="text-button" onClick={() => reset()}>
              Reintentar
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
