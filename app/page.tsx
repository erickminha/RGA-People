import Link from "next/link";

export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8 text-slate-900">RGA People</h1>
      <p className="text-xl mb-8 text-slate-600">Portal do Colaborador - RGA Consultoria</p>
      <Link 
        href="/rga/portal" 
        className="rounded-full bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        Acessar Portal
      </Link>
    </div>
  );
}
