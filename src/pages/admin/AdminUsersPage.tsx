import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { usePageTitle } from '../../hooks/usePageTitle'
import { emsApi, type EmsAdminUser } from '../../lib/api'

interface UserForm {
  username: string
  email: string
  fullName: string
  password: string
  role: 'admin' | 'staff'
}

const emptyForm = (): UserForm => ({ username: '', email: '', fullName: '', password: '', role: 'staff' })

export function AdminUsersPage() {
  usePageTitle('EMS user management')
  const { emsRole } = useApp()
  const [users, setUsers] = useState<EmsAdminUser[]>([])
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setUsers(await emsApi.admin.listEmsUsers()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load EMS accounts.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  if (emsRole !== 'admin') return <Navigate to="/admin" replace />

  const reset = () => { setEditingId(null); setForm(emptyForm()); setError('') }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setFeedback('')
    setSaving(true)
    try {
      if (editingId) {
        await emsApi.admin.updateEmsUser(editingId, { fullName: form.fullName, role: form.role })
        setFeedback('EMS account updated.')
      } else {
        await emsApi.admin.createEmsUser(form)
        setFeedback('EMS account created. Share the login details securely with the staff member.')
      }
      reset()
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save EMS account.')
    } finally { setSaving(false) }
  }

  const toggleActive = async (user: EmsAdminUser) => {
    setError('')
    setFeedback('')
    try {
      await emsApi.admin.updateEmsUser(user.id, { isActive: !user.is_active })
      setFeedback(`${user.full_name} ${user.is_active ? 'deactivated' : 'activated'}.`)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update EMS account.') }
  }

  return <div className="admin-page">
    <header className="admin-page__head"><div><p className="eyebrow">Access control</p><h1>User management</h1><p>Create and manage EMS administrator and staff accounts. POS cashier and kitchen accounts are excluded.</p></div></header>
    <div className="admin-user-management">
      <form className="admin-panel admin-user-form" onSubmit={submit}>
        <div className="admin-panel__head"><div><p className="eyebrow">{editingId ? 'Edit account' : 'New account'}</p><h2>{editingId ? 'Update EMS user' : 'Create EMS user'}</h2></div></div>
        <label className="field"><span className="field__label">Username</span><input required minLength={3} maxLength={50} pattern="[A-Za-z0-9_.-]+" value={form.username} disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="off" /></label>
        <label className="field"><span className="field__label">Full name</span><input required minLength={2} maxLength={100} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
        <label className="field"><span className="field__label">Email</span><input type="email" required value={form.email} disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="off" /></label>
        {!editingId && <label className="field"><span className="field__label">Temporary password</span><input type="password" required minLength={10} maxLength={72} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" /><span className="field__hint">At least 10 characters. The user can update it after signing in.</span></label>}
        <label className="field"><span className="field__label">EMS role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserForm['role'] })}><option value="staff">Staff</option><option value="admin">Administrator</option></select></label>
        {error && <p className="form-error" role="alert">{error}</p>}{feedback && <p className="admin-feedback" role="status">{feedback}</p>}
        <div className="admin-form__actions"><button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create account'}</button>{editingId && <button className="btn btn--ghost" type="button" onClick={reset}>Cancel</button>}</div>
      </form>
      <section className="admin-panel admin-user-list">
        <div className="admin-panel__head"><div><p className="eyebrow">EMS access</p><h2>{users.length} accounts</h2></div><button className="text-btn" type="button" onClick={() => void load()} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button></div>
        {loading ? <div className="admin-empty">Loading EMS accounts…</div> : users.length ? <div className="admin-user-rows">{users.map((user) => <article className="admin-user-row" key={user.id}>
          <div className="admin-user-row__identity"><span className="admin-user__avatar">{user.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{user.full_name}</strong><small>{user.email} · @{user.username}</small></span></div>
          <span className={`status ${user.is_active ? 'status--upcoming' : 'status--draft'}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
          <span className="admin-user-row__role">{user.role === 'admin' ? 'Administrator' : 'Staff'}</span>
          <div className="admin-user-row__actions"><button className="text-btn" type="button" onClick={() => { setEditingId(user.id); setForm({ ...emptyForm(), fullName: user.full_name, role: user.role }); setError(''); setFeedback('') }}>Edit</button><button className="text-btn" type="button" onClick={() => void toggleActive(user)}>{user.is_active ? 'Deactivate' : 'Activate'}</button></div>
        </article>)}</div> : <div className="admin-empty"><strong>No EMS accounts found.</strong><span>Create an account to grant staff access.</span></div>}
      </section>
    </div>
  </div>
}
