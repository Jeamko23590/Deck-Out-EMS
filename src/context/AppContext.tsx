import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  PaymentMethod,
  PaymentStatus,
  Registration,
  RegistrationStatus,
  Merchandise,
  Tournament,
  TournamentStatus,
  TournamentResult,
  LeaderboardEntry,
} from '../types'
import { isRegistrationOpen } from '../lib/events'
import { authTokenKey, emsApi } from '../lib/api'

interface AppStore {
  tournaments: Tournament[]
  registrations: Registration[]
  favorites: string[]
  merchandise: Merchandise[]
  singles: Merchandise[]
  results: TournamentResult[]
  leaderboard: LeaderboardEntry[]
}

export interface RegistrationInput {
  tournamentId: string
  name: string
  email: string
  tag: string
  region: string
  method: PaymentMethod
  reference: string
  note?: string
}

export interface ActionResult {
  ok: boolean
  error?: string
  registration?: Registration
}

interface AppContextValue {
  tournaments: Tournament[]
  registrations: Registration[]
  merchandise: Merchandise[]
  singles: Merchandise[]
  results: TournamentResult[]
  leaderboard: LeaderboardEntry[]
  favorites: string[]
  isAdmin: boolean
  emsRole: 'admin' | 'staff' | null
  authLoading: boolean
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  registerForTournament: (input: RegistrationInput) => Promise<ActionResult>
  addTournament: (tournament: Omit<Tournament, 'id' | 'createdAt'>) => Promise<string>
  updateTournament: (id: string, patch: Partial<Tournament>) => Promise<void>
  setTournamentStatus: (id: string, status: TournamentStatus) => Promise<ActionResult>
  unpublishTournament: (id: string) => Promise<ActionResult>
  deleteTournament: (id: string) => Promise<ActionResult>
  reviewPayment: (registrationId: string, status: PaymentStatus, note: string) => Promise<ActionResult>
  setRegistrationStatus: (
    registrationId: string,
    status: RegistrationStatus,
  ) => Promise<ActionResult>
  addMerchandise: (item: Omit<Merchandise, 'id' | 'createdAt'>) => Promise<string>
  updateMerchandise: (id: string, patch: Partial<Merchandise>) => Promise<void>
  archiveMerchandise: (id: string) => Promise<void>
  addSingle: (item: Omit<Merchandise, 'id' | 'createdAt'>) => Promise<string>
  updateSingle: (id: string, patch: Partial<Merchandise>) => Promise<void>
  archiveSingle: (id: string) => Promise<void>
  saveResult: (value: Omit<TournamentResult, 'id'>, id?: string) => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const initialStore = (): AppStore => ({ tournaments: [], registrations: [], favorites: [], merchandise: [], singles: [], results: [], leaderboard: [] })

export function AppProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<AppStore>(initialStore)
  const storeRef = useRef(store)
  const [isAdmin, setIsAdmin] = useState(false)
  const [emsRole, setEmsRole] = useState<'admin' | 'staff' | null>(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(window.sessionStorage.getItem(authTokenKey)))

  const commit = useCallback((next: AppStore) => {
    storeRef.current = next
    setStore(next)
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [remoteTournaments, remoteMerchandise, remoteSingles, results, leaderboard] = await Promise.all([emsApi.tournaments.list(), emsApi.products.list(), emsApi.singles.list(), emsApi.results.list(), emsApi.leaderboard.list()])
        if (active) commit({ ...storeRef.current, tournaments: remoteTournaments, merchandise: remoteMerchandise, singles: remoteSingles, results, leaderboard })
      } catch (error) { console.error('Unable to load EMS catalog:', error) }
    }
    void load()
    const token = window.sessionStorage.getItem(authTokenKey)
    if (token) {
      emsApi.auth.me().then(async ({ user }) => {
        if (!active) return
        setIsAdmin(true)
        setEmsRole(user.role === 'admin' ? 'admin' : 'staff')
        const [tournaments, registrations, merchandise, singles, results, leaderboard] = await Promise.all([emsApi.tournaments.listAdmin(), emsApi.registrations.listAdmin(), emsApi.products.listAdmin(), emsApi.singles.listAdmin(), emsApi.results.list(), emsApi.leaderboard.list()])
        if (active) commit({ ...storeRef.current, tournaments, registrations, merchandise, singles, results, leaderboard })
      }).catch(() => {
        window.sessionStorage.removeItem(authTokenKey)
        setIsAdmin(false)
        setEmsRole(null)
      }).finally(() => { if (active) setAuthLoading(false) })
    } else {
      setAuthLoading(false)
    }
    return () => { active = false }
  }, [commit])

  const toggleFavorite = useCallback(
    (id: string) => {
      const current = storeRef.current
      commit({
        ...current,
        favorites: current.favorites.includes(id)
          ? current.favorites.filter((item) => item !== id)
          : [...current.favorites, id],
      })
    },
    [commit],
  )

  const registerForTournament = useCallback(
    async (input: RegistrationInput): Promise<ActionResult> => {
      const current = storeRef.current
      const tournament = current.tournaments.find((item) => item.id === input.tournamentId)
      if (!tournament) return { ok: false, error: 'This event no longer exists.' }
      if (!isRegistrationOpen(tournament)) {
        return { ok: false, error: 'Registration is not open for this event.' }
      }
      const duplicate = current.registrations.some(
        (registration) =>
          registration.tournamentId === tournament.id &&
          registration.email.toLowerCase() === input.email.trim().toLowerCase() &&
          registration.registrationStatus !== 'cancelled',
      )
      if (duplicate) {
        return { ok: false, error: 'This email is already registered for the event.' }
      }
      try {
      const response = await emsApi.registrations.create(input)
      const registration = response.registration
      commit({ ...current, registrations: [registration, ...current.registrations] })
      return { ok: true, registration }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Unable to save registration.' }
      }
    },
    [commit],
  )

  const reloadAdmin = useCallback(async () => {
    const [tournaments, registrations, merchandise, singles, results, leaderboard] = await Promise.all([
      emsApi.tournaments.listAdmin(), emsApi.registrations.listAdmin(), emsApi.products.listAdmin(), emsApi.singles.listAdmin(), emsApi.results.list(), emsApi.leaderboard.list(),
    ])
    commit({ ...storeRef.current, tournaments, registrations, merchandise, singles, results, leaderboard })
  }, [commit])

  const saveResult = useCallback(async (value: Omit<TournamentResult, 'id'>, id?: string) => {
    if (id) await emsApi.results.update(id, value)
    else await emsApi.results.create(value)
    await reloadAdmin()
  }, [reloadAdmin])

  const addTournament = useCallback(async (tournament: Omit<Tournament, 'id' | 'createdAt'>): Promise<string> => {
    const { tournament: created } = await emsApi.tournaments.create(tournament)
    await reloadAdmin()
    return created.id
  }, [reloadAdmin])

  const updateTournament = useCallback(async (id: string, patch: Partial<Tournament>) => {
    await emsApi.tournaments.update(id, patch)
    await reloadAdmin()
  }, [reloadAdmin])

  const setTournamentStatus = useCallback(async (id: string, status: TournamentStatus): Promise<ActionResult> => {
    try { await emsApi.tournaments.setStatus(id, status); await reloadAdmin(); return { ok: true } }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Unable to update event.' } }
  }, [reloadAdmin])

  const unpublishTournament = useCallback(async (id: string): Promise<ActionResult> => setTournamentStatus(id, 'draft'), [setTournamentStatus])

  const deleteTournament = useCallback(async (id: string): Promise<ActionResult> => {
    try { await emsApi.tournaments.remove(id); await reloadAdmin(); return { ok: true } }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Unable to delete event.' } }
  }, [reloadAdmin])

  const reviewPayment = useCallback(async (registrationId: string, status: PaymentStatus, note: string): Promise<ActionResult> => {
    try { await emsApi.registrations.reviewPayment(registrationId, status, note); await reloadAdmin(); return { ok: true } }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Unable to review payment.' } }
  }, [reloadAdmin])

  const setRegistrationStatus = useCallback(async (registrationId: string, status: RegistrationStatus): Promise<ActionResult> => {
    try { await emsApi.registrations.setStatus(registrationId, status); await reloadAdmin(); return { ok: true } }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Unable to update registration.' } }
  }, [reloadAdmin])

  const addMerchandise = useCallback(async (item: Omit<Merchandise, 'id' | 'createdAt'>): Promise<string> => {
    const { product } = await emsApi.products.create(item)
    await reloadAdmin()
    return product.id
  }, [reloadAdmin])

  const updateMerchandise = useCallback(async (id: string, patch: Partial<Merchandise>) => {
    await emsApi.products.update(id, patch)
    await reloadAdmin()
  }, [reloadAdmin])

  const archiveMerchandise = useCallback(async (id: string) => {
    await emsApi.products.archive(id)
    await reloadAdmin()
  }, [reloadAdmin])

  const addSingle = useCallback(async (item: Omit<Merchandise, 'id' | 'createdAt'>): Promise<string> => {
    const { single } = await emsApi.singles.create(item)
    await reloadAdmin()
    return single.id
  }, [reloadAdmin])

  const updateSingle = useCallback(async (id: string, patch: Partial<Merchandise>) => {
    await emsApi.singles.update(id, patch)
    await reloadAdmin()
  }, [reloadAdmin])

  const archiveSingle = useCallback(async (id: string) => {
    await emsApi.singles.archive(id)
    await reloadAdmin()
  }, [reloadAdmin])
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await emsApi.auth.login(email, password)
      window.sessionStorage.setItem(authTokenKey, result.token)
      await reloadAdmin()
      setIsAdmin(true)
      setEmsRole(result.user.role === 'admin' ? 'admin' : 'staff')
      return true
    } catch {
      window.sessionStorage.removeItem(authTokenKey)
      setIsAdmin(false)
      setEmsRole(null)
      return false
    }
  }, [reloadAdmin])

  const logout = useCallback(() => {
    setIsAdmin(false)
    setEmsRole(null)
    try {
      window.sessionStorage.removeItem(authTokenKey)
    } catch {
      // Nothing else to clear.
    }
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      tournaments: store.tournaments,
      registrations: store.registrations,
      merchandise: store.merchandise,
      singles: store.singles,
      results: store.results,
      leaderboard: store.leaderboard,
      favorites: store.favorites,
      isAdmin,
      emsRole,
      authLoading,
      isFavorite: (id: string) => store.favorites.includes(id),
      toggleFavorite,
      registerForTournament,
      addTournament,
      updateTournament,
      setTournamentStatus,
      unpublishTournament,
      deleteTournament,
      reviewPayment,
      setRegistrationStatus,
      addMerchandise,
      updateMerchandise,
      archiveMerchandise,
      addSingle,
      updateSingle,
      archiveSingle,
      saveResult,
      login,
      logout,
    }),
    [
      store,
      isAdmin,
      emsRole,
      authLoading,
      toggleFavorite,
      registerForTournament,
      addTournament,
      updateTournament,
      setTournamentStatus,
      unpublishTournament,
      deleteTournament,
      reviewPayment,
      setRegistrationStatus,
      addMerchandise,
      updateMerchandise,
      archiveMerchandise,
      addSingle,
      updateSingle,
      archiveSingle,
      saveResult,
      login,
      logout,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
