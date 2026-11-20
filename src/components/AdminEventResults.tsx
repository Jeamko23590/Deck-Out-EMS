import { useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import type { Registration, Standing, Tournament, TournamentResult } from '../types'

interface MatchInput { player: string; opponent: string; score: 0 | 0.5 | 1 }

export function AdminEventResults({ event, registrations, existing }: {
  event: Tournament; registrations: Registration[]; existing?: TournamentResult
}) {
  const { saveResult } = useApp()
  const approved = registrations.filter((entry) => entry.registrationStatus === 'confirmed' && entry.payment.status === 'verified')
  const [standings, setStandings] = useState<Standing[]>(() => existing?.standings ?? [])
  const [matches, setMatches] = useState<MatchInput[]>(() => (existing?.standings ?? [])
    .flatMap((standing) => (standing.matches ?? []).map((match) => ({ ...match, player: standing.player })))
    .sort((a, b) => a.order - b.order))
  const [summary, setSummary] = useState(existing?.summary ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const updateStanding = (index: number, patch: Partial<Standing>) => setStandings((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row))
  const updateMatch = (index: number, patch: Partial<MatchInput>) => setMatches((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row))
  const names = standings.map((standing) => standing.player).filter(Boolean)
  const options = [...new Set([...approved.map((player) => player.playerName), ...names])]
  const submit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    setError('')
    setFeedback('')
    const sorted = [...standings].sort((a, b) => a.place - b.place)
    if (!sorted.length || sorted[0].place !== 1) { setError('Add standings with a first-place finisher.'); return }
    if (matches.some((match) => !names.includes(match.player) || !names.includes(match.opponent) || match.player === match.opponent)) {
      setError('Select two different standing players for every match.'); return
    }
    const payloadStandings = sorted.map((standing) => {
      const record = [0, 0, 0]
      for (const match of matches) {
        const score = match.player === standing.player ? match.score : match.opponent === standing.player ? 1 - match.score : null
        if (score !== null) record[score === 1 ? 0 : score === 0 ? 1 : 2]++
      }
      return { ...standing, record: matches.length ? record.join('-') : standing.record,
        matches: matches.flatMap((match, index) => match.player === standing.player ? [{ opponent: match.opponent, score: match.score, order: index + 1 }] : []) }
    })
    setSaving(true)
    try {
      await saveResult({ tournamentId: event.id, name: event.title, game: event.game,
        date: event.end ?? event.start, location: event.location, format: event.format,
        champion: sorted[0].player, championCountry: sorted[0].country,
        runnerUp: sorted.find((standing) => standing.place === 2)?.player ?? '',
        runnerUpCountry: sorted.find((standing) => standing.place === 2)?.country ?? '',
        prize: existing?.prize ?? event.prize, summary, standings: payloadStandings }, existing?.id)
      setStandings(payloadStandings)
      setFeedback('Results published. Points, wins and Elo standings have been recalculated.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to publish results.') }
    finally { setSaving(false) }
  }
  return (
    <section className="admin-panel event-results-editor">
      <div className="admin-panel__head"><div><p className="eyebrow">Results desk</p><h2>{existing ? 'Edit published results' : 'Publish results'}</h2></div></div>
      <p>Enter final placements and awarded circuit points. Add every match in play order to calculate Elo and win records. Elo starts at 1000 with K=32.</p>
      {event.status !== 'ended' && <p>Finish the event before publishing its final results.</p>}
      {approved.length === 0 && !existing && <p>No approved players are available. Confirm players and verify their payments first.</p>}
      <form onSubmit={submit}>
        <fieldset disabled={saving || event.status !== 'ended'}>
          <legend>Final standings</legend>
          <div className="results-table-wrap"><table className="results-data-table">
            <thead><tr><th>Place</th><th>Player</th><th>Country code</th><th>Points awarded</th><th>W-L-D</th><th>Actions</th></tr></thead>
            <tbody>{standings.map((standing, index) => (
              <tr key={index}>
                <td><input aria-label={`Place for row ${index + 1}`} type="number" min="1" required value={standing.place} onChange={(e) => updateStanding(index, { place: Number(e.target.value) })} /></td>
                <td><select aria-label={`Player for row ${index + 1}`} required value={standing.player} onChange={(e) => updateStanding(index, { player: e.target.value })}>
                  <option value="">Select player</option>{options.map((name) => <option key={name}>{name}</option>)}
                </select></td>
                <td><input aria-label={`Country for row ${index + 1}`} maxLength={8} value={standing.country} onChange={(e) => updateStanding(index, { country: e.target.value.toUpperCase() })} /></td>
                <td><input aria-label={`Points for row ${index + 1}`} type="number" min="0" max="1000000" required value={standing.points} onChange={(e) => updateStanding(index, { points: Number(e.target.value) })} /></td>
                <td>{matches.length ? <span>From matches</span> : <input aria-label={`Record for row ${index + 1}`} required pattern="[0-9]+-[0-9]+(-[0-9]+)?" value={standing.record} onChange={(e) => updateStanding(index, { record: e.target.value })} />}</td>
                <td><button type="button" className="text-btn" onClick={() => setStandings(standings.filter((_, i) => i !== index))}>Remove row</button></td>
              </tr>
            ))}</tbody>
          </table></div>
          <button type="button" className="btn btn--ghost btn--small" disabled={!options.length} onClick={() => setStandings([...standings, { place: Math.max(0, ...standings.map((row) => row.place)) + 1, player: '', country: '', record: '0-0-0', points: 0 }])}>Add player</button>
        </fieldset>
        <fieldset disabled={saving || event.status !== 'ended'}>
          <legend>Match outcomes</legend>
          <p>Enter each match once, in chronological order. A bye is not a rated match. Without opponents, records contribute wins but no Elo.</p>
          {matches.map((match, index) => (
            <div className="event-match-row" key={index}>
              <span>Match {index + 1}</span>
              <label>Player<select required value={match.player} onChange={(e) => updateMatch(index, { player: e.target.value })}><option value="">Select player</option>{names.map((name, i) => <option key={`${i}:${name}`}>{name}</option>)}</select></label>
              <label>Opponent<select required value={match.opponent} onChange={(e) => updateMatch(index, { opponent: e.target.value })}><option value="">Select opponent</option>{names.filter((name) => name !== match.player).map((name, i) => <option key={`${i}:${name}`}>{name}</option>)}</select></label>
              <label>Player outcome<select value={match.score} onChange={(e) => updateMatch(index, { score: Number(e.target.value) as MatchInput['score'] })}><option value={1}>Win</option><option value={0}>Loss</option><option value={0.5}>Draw</option></select></label>
              <button type="button" className="text-btn" onClick={() => setMatches(matches.filter((_, i) => i !== index))}>Remove match</button>
            </div>
          ))}
          <button type="button" className="btn btn--ghost btn--small" disabled={names.length < 2} onClick={() => setMatches([...matches, { player: '', opponent: '', score: 1 }])}>Add match</button>
        </fieldset>
        <label className="event-results-summary">Event summary<textarea value={summary} maxLength={10000} disabled={saving || event.status !== 'ended'} onChange={(e) => setSummary(e.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
        <button className="btn btn--primary" disabled={saving || event.status !== 'ended' || !standings.length}>{saving ? 'Publishing…' : existing ? 'Update published results' : 'Publish results'}</button>
      </form>
    </section>
  )
}
