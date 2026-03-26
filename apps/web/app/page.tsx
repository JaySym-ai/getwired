export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="relative">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-400 opacity-20 blur-xl" />
        <div className="relative rounded-lg border border-emerald-500/30 bg-black/80 px-12 py-10 text-center">
          <h1 className="mb-2 font-mono text-4xl font-bold tracking-wider text-emerald-400">
            GETWIRED
          </h1>
          <p className="font-mono text-sm tracking-wide text-emerald-500/70">
            AI-Powered Testing CLI
          </p>
          <div className="mt-6 rounded border border-emerald-900/50 bg-emerald-950/30 px-6 py-3 font-mono text-sm text-green-400">
            <span className="text-emerald-600">$</span> npx getwired
          </div>
        </div>
      </div>
    </main>
  );
}
