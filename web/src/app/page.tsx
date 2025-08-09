// Description: Home page – entry links to compare and rankings.

export default function Home() {
  return (
    <div className="min-h-screen p-8 sm:p-12">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold mb-6">OTM FPL Draft</h1>
        <p className="text-black/70 dark:text-white/70 mb-8">Start comparing players to build your draft rankings.</p>
        <div className="flex gap-3">
          <a className="underline" href="/compare">Open Compare</a>
          <a className="underline" href="/rankings">View Rankings</a>
          <a className="underline" href="/predicted">Predicted GW1</a>
        </div>
      </main>
    </div>
  );
}
