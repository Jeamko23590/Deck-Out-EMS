import { useEffect, useState } from 'react'
import { emsApi } from '../lib/api'
import type { EloHistoryEntry } from '../types'

export function EloHistory({ resultId }: { resultId: string }) {
  const [history, setHistory] = useState<EloHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    emsApi.leaderboard.history(resultId)
      .then((value) => { if (active) setHistory(value) })
      .catch(() => { if (active) setError('Unable to load Elo changes.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [resultId, attempt])
  return (
    <section className="elo-history">
      <h3>Elo changes</h3>
      <p>Starting rating 1000 · K=32 · Based on each opponent’s rating before the match.</p>
      {loading ? <p role="status">Loading Elo history…</p> : error ? (
        <p role="alert">{error} <button type="button" className="text-btn" onClick={() => setAttempt(attempt + 1)}>Retry</button></p>
      ) : !history.length ? <p>No rated matches recorded for this event.</p> : (
        <div className="results-table-wrap">
          <table className="results-data-table">
            <thead><tr><th>Match</th><th>Player</th><th>Opponent</th><th>Outcome</th><th>Before</th><th>Change</th><th>After</th></tr></thead>
            <tbody>{history.map((entry) => (
              <tr key={`${entry.order}:${entry.player}`}>
                <td>{entry.order}</td><td>{entry.player}</td><td>{entry.opponent}</td>
                <td>{entry.score === 1 ? 'Win' : entry.score === 0 ? 'Loss' : 'Draw'}</td>
                <td>{entry.before}</td><td>{entry.change >= 0 ? '+' : ''}{entry.change}</td><td>{entry.after}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}
