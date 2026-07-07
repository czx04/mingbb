import { env } from "@/lib/env";

async function getApiHealth() {
  try {
    const response = await fetch(`${env.apiUrl}/health`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return { ok: false, message: `API returned ${response.status}` };
    }

    return response.json() as Promise<{ ok: boolean; service: string; timestamp: string }>;
  } catch {
    return { ok: false, message: "API is not reachable" };
  }
}

export default async function Home() {
  const health = await getApiHealth();

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">MING Platform</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            Base Next.js, NestJS, Supabase đã sẵn sàng để phát triển.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Frontend dùng Tailwind CSS, backend có health endpoint, Supabase client đã cấu hình qua biến môi trường.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatusCard label="Frontend" value="Next.js + Tailwind" state="Ready" />
          <StatusCard label="Backend" value="NestJS API" state={health.ok ? "Online" : "Offline"} />
          <StatusCard label="Database" value="Supabase" state="Env required" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">API health</h2>
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100">
            {JSON.stringify(health, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}

function StatusCard({ label, value, state }: { label: string; value: string; state: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
      <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
        {state}
      </div>
    </div>
  );
}
