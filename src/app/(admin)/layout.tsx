import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/competitions', label: 'Competitions' },
  { href: '/athletes', label: 'Athletes' },
  { href: '/teams', label: 'Teams' },
  { href: '/weigh-in', label: 'Weigh-in' },
  { href: '/categories', label: 'Categories' },
  { href: '/fights', label: 'Fights' },
  { href: '/areas', label: 'Areas' },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-72 md:border-b-0 md:border-r">
          <div className="px-6 py-8">
            <p className="text-3xl font-extrabold tracking-tight">TourneyPro</p>
            <p className="mt-1 text-sm text-slate-500">
              Gestao administrativa do torneio
            </p>
          </div>
          <nav className="grid gap-2 px-4 pb-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
