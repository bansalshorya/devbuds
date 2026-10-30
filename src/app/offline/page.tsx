import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <WifiOff className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">You are offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Reconnect to load student records or save mentoring updates. Unsaved text in an open form remains in that browser tab.</p>
        <Link href="/" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800">Try again</Link>
      </section>
    </main>
  );
}
