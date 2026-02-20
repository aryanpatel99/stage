"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0a] text-white">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-white/60">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 rounded-lg bg-[#c9ff2e] text-black font-medium hover:bg-[#b8e629] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
