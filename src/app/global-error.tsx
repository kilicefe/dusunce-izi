'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            background: '#0f172a',
            color: '#f8fafc',
          }}
        >
          <section>
            <h2>Bir Hata Oluştu</h2>
            <p>{error.message || 'Sistemde beklenmeyen bir durum oluştu.'}</p>
            <button type="button" onClick={reset}>
              Yeniden Dene
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
