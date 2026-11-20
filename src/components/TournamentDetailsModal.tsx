import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Tournament } from '../types'
import { gameBySlug } from '../data/games'
import { formatCurrency, formatDate, formatDateTime, formatNumber, statusLabel } from '../lib/format'
import { isRegistrationOpen, registrationStatusMessage } from '../lib/events'
import { Modal } from './ui/Modal'
import { StatusBadge } from './ui/StatusBadge'
import { RegistrationForm } from './RegistrationForm'
import { useApp } from '../context/AppContext'
import { ApprovedPlayers } from './ApprovedPlayers'

interface Props {
  tournament: Tournament
  onClose: () => void
  onResults: (resultId: string) => void
}

export function TournamentDetailsModal({ tournament, onClose, onResults }: Props) {
  const game = gameBySlug(tournament.game)!
  const [mode, setMode] = useState<'overview' | 'register'>('overview')
  const { isFavorite, toggleFavorite, results } = useApp()
  const result = results.find((entry) => entry.tournamentId === tournament.id)
  const saved = isFavorite(tournament.id)



  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={`${game.name} · ${statusLabel[tournament.status]} EVENT`}
      title={tournament.title}
      size="wide"
    >
      {mode === 'register' ? (
        <RegistrationForm tournament={tournament} onClose={onClose} />
      ) : (
        <div className={`details game--${tournament.game}`}>
          <div className="details__status">
            <StatusBadge status={tournament.status} />
            <span>{tournament.format}</span>
          </div>

          <p className="details__description">{tournament.description}</p>

          <dl className="details__grid">
            <div>
              <dt>Date & time</dt>
              <dd>{formatDateTime(tournament.start)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{tournament.location}</dd>
            </div>
            <div>
              <dt>Field</dt>
              <dd>
                {formatNumber(tournament.entrants)} / {formatNumber(tournament.capacity)} players
              </dd>
            </div>
            <div>
              <dt>Prize pool</dt>
              <dd>
                {formatCurrency(tournament.prize)}
                {Boolean(tournament.prizes?.length) && (
                  <ul>
                    {tournament.prizes?.map((prize, index) => (
                      <li key={index}>{prize.label}: {formatCurrency(prize.amount)}</li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            <div>
              <dt>Entry fee</dt>
              <dd>{formatCurrency(tournament.entryFee)}</dd>
            </div>
            <div>
              <dt>Registration closes</dt>
              <dd>
                {tournament.registrationCloses
                  ? formatDateTime(tournament.registrationCloses)
                  : tournament.status === 'ended'
                    ? 'Closed'
                    : 'Open until field is full'}
              </dd>
            </div>
            <div>
              <dt>Circuit</dt>
              <dd>
                {game.name} · {game.seasonLabel}
              </dd>
            </div>
          </dl>

          <ApprovedPlayers tournamentId={tournament.id} />

          {tournament.status === 'ended' && result && (
            <div className="details__result">
              <div>
                <span>Champion</span>
                <strong>{result.champion}</strong>
              </div>
              <div>
                <span>Runner-up</span>
                <strong>{result.runnerUp}</strong>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onResults(result.tournamentId)}
              >
                Open full results
              </button>
            </div>
          )}

          <div className="details__note">
            <strong>{registrationStatusMessage(tournament)}</strong>
            <span>
              Decked Out Cafe is an independent frontend concept. This event, its prize pool and
              Event information is provided by the organizer. Submit payment references for staff review.
            </span>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className={`btn btn--ghost ${saved ? 'is-saved' : ''}`}
              onClick={() => toggleFavorite(tournament.id)}
              aria-pressed={saved}
            >
              {saved ? 'Saved to your events' : 'Save event'}
            </button>
            <div className="modal-actions__right">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                Close
              </button>
              {isRegistrationOpen(tournament) && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setMode('register')}
                >
                  Register · {formatCurrency(tournament.entryFee)}
                </button>
              )}
              {tournament.status === 'upcoming' && !isRegistrationOpen(tournament) && (
                <span className="details__closed">
                  {registrationStatusMessage(tournament)}
                </span>
              )}
              {tournament.status === 'live' && (
                <Link to="/tournaments?status=live" className="btn btn--primary" onClick={onClose}>
                  Browse live events
                </Link>
              )}
              {tournament.status === 'ended' && (
                <span className="details__closed">Event concluded {formatDate(tournament.start)}</span>
              )}
              {tournament.status === 'cancelled' && (
                <span className="details__closed">Event cancelled</span>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
