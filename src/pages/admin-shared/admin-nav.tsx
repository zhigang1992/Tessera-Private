import { Link, useLocation } from 'react-router'

const LINKS = [
  { to: '/admin/whitelist-applications', label: 'Whitelist applications' },
  { to: '/admin/mock-volumes', label: 'Mock trading volumes' },
  { to: '/admin/mock-solana-mobile', label: 'Mock Solana Mobile' },
] as const

// Renders the admin cross-nav. Preserves the `#secret=…` hash across links so
// a single unlock lets you bounce between admin pages without re-entering the
// secret.
export function AdminNav() {
  const location = useLocation()
  const hash = location.hash || ''
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = location.pathname === link.to
        const className = active
          ? 'rounded-md border border-input bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground'
          : 'rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        return (
          <Link key={link.to} to={`${link.to}${hash}`} className={className}>
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
