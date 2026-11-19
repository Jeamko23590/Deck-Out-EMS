import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { BrandLogo } from '../../components/BrandLogo'
import { useApp } from '../../context/AppContext'

const navigation: { to: string; label: string; end: boolean; eyebrow: string; adminOnly?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', end: true, eyebrow: 'Overview' },
  { to: '/admin/events', label: 'Events', end: false, eyebrow: 'Calendar' },
  { to: '/admin/payments', label: 'Payments', end: false, eyebrow: 'Review queue' },
  { to: '/admin/merchandise', label: 'Merchandise', end: false, eyebrow: 'Shop catalog' },
  { to: '/admin/reports', label: 'Reports', end: false, eyebrow: 'Insights' },
  { to: '/admin/users', label: 'User management', end: false, eyebrow: 'Access control', adminOnly: true },
]

export function AdminLayout() {
  const { isAdmin, emsRole, authLoading, logout, registrations } = useApp()
  const location = useLocation()

  if (authLoading) {
    return <main id="main" className="admin-content"><p className="eyebrow">Checking administrator session…</p></main>
  }
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  const pendingPayments = registrations.filter(
    (registration) => registration.payment.status === 'pending',
  ).length

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand" aria-label="Decked Out Cafe admin dashboard">
          <BrandLogo />
          <span className="admin-brand__tag">CONTROL ROOM</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.filter((item) => !item.adminOnly || emsRole === 'admin').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav__link ${isActive ? 'is-active' : ''}`}
            >
              <span>
                <em>{item.eyebrow}</em>
                {item.label}
              </span>
              {item.to === '/admin/payments' && pendingPayments > 0 && (
                <span className="admin-nav__badge">{pendingPayments}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__foot">
          <Link to="/" className="admin-nav__link admin-nav__link--external">
            <span>
              <em>View site</em>
              Public pages
            </span>
            <span aria-hidden="true">↗</span>
          </Link>
          <div className="admin-user">
            <span className="admin-user__avatar">DA</span>
            <span>
              <strong>{emsRole === 'admin' ? 'Administrator' : 'EMS Staff'}</strong>
              <em>Administrator session</em>
            </span>
          </div>
          <button type="button" className="admin-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar__dot" aria-hidden="true" />
            Connected administrator workspace
          </div>
          <div className="admin-topbar__actions">
            <Link to="/tournaments" className="text-btn">
              Public calendar
            </Link>
            <button type="button" className="text-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
        <main id="main" className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
