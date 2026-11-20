import { useEffect, useState } from 'react'
import { emsApi } from '../lib/api'
import type { ApprovedPlayer } from '../types'

export function ApprovedPlayers({ tournamentId }: { tournamentId: string }) {
  const [players, setPlayers] = useState<ApprovedPlayer[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    emsApi.tournaments.approvedPlayers(tournamentId)
      .then((value) => { if (active) setPlayers(value) })
      .catch(() => { if (active) setError('Unable to load approved players.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tournamentId, attempt])
  return (
    <section className="approved-players" aria-label="Approved players">
      <h3>Approved players{!loading && !error ? ` (${players.length})` : ''}</h3>
      <p>Players with confirmed seats and verified payment.</p>
      {loading ? <p role="status">Loading players…</p> : error ? (
        <p role="alert">{error} <button type="button" className="text-btn" onClick={() => setAttempt(attempt + 1)}>Retry</button></p>
      ) : players.length ? (
        <ul>{players.map((player) => <li key={player.id}><strong>{player.playerName}</strong>{player.tag && <span>@{player.tag}</span>}</li>)}</ul>
      ) : <p>No approved players yet.</p>}
    </section>
  )
}
