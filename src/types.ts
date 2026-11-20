export type GameSlug =
  | 'beyblade'
  | 'cardfight-vanguard'
  | 'cookie-run'
  | 'cyberpunk'
  | 'riftbound'
  | 'pokemon'
  | 'mtg'
  | 'flesh-and-blood'

export type TournamentStatus = 'draft' | 'upcoming' | 'live' | 'ended' | 'cancelled'

export type PublicTournamentStatus = Exclude<TournamentStatus, 'draft'>

export type TournamentFormat = 'Online' | 'Offline' | 'Hybrid'

export type PaymentMethod = 'GCash' | 'Maya' | 'Bank transfer' | 'Cash at counter'

export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded'

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled'

export interface Merchandise {
  id: string
  name: string
  description: string
  imageUrl: string
  price: number
  stock: number
  category: string
  /** Existing records without a section are treated as standard merchandise. */
  section?: 'merch' | 'singles' | 'cards'
  /** Free-form TCG name so admins can add games without a code release. */
  game?: string
  setName?: string
  rarity?: string
  condition?: string
  cardNumber?: string
  tags: string[]
  published: boolean
  createdAt: string
}

export interface Game {
  slug: GameSlug
  name: string
  shortName: string
  tagline: string
  description: string
  accent: string
  accentSoft: string
  accentTwo: string
  surface: string
  variant: string
  seasonLabel: string
}

export interface EventPrize {
  label: string
  amount: number
}

export interface Tournament {
  id: string
  title: string
  game: GameSlug
  status: TournamentStatus
  published: boolean
  start: string
  end?: string
  location: string
  format: TournamentFormat
  entrants: number
  capacity: number
  entryFee: number
  prize: number
  prizes?: EventPrize[]
  currency: 'PHP'
  featured?: boolean
  registrationOpens?: string
  registrationCloses?: string
  description: string
  createdAt: string
}

export interface Standing {
  place: number
  player: string
  country: string
  record: string
  points: number
  matches?: { opponent: string; score: 0 | 0.5 | 1; order: number }[]
}

export interface ApprovedPlayer {
  id: string
  playerName: string
  tag: string
}

export interface EloHistoryEntry {
  resultId: string
  tournamentId: string
  event: string
  date: string
  game: GameSlug
  order: number
  player: string
  opponent: string
  score: 0 | 0.5 | 1
  before: number
  change: number
  after: number
}

export interface TournamentResult {
  id: string
  tournamentId: string
  name: string
  game: GameSlug
  date: string
  location: string
  format: TournamentFormat
  champion: string
  championCountry: string
  runnerUp: string
  runnerUpCountry: string
  prize: number
  summary: string
  standings: Standing[]
}

export interface LeaderboardEntry {
  id: string
  rank: number
  elo?: number
  eloChange?: number
  ratedMatches?: number
  player: string
  team: string
  game: GameSlug
  points: number
  wins: number
  firsts: number
  seconds: number
  thirds: number
  region: string
  country: string
}

export type LeaderboardSort = 'points' | 'wins' | 'firsts' | 'elo'

export interface PaymentReviewEvent {
  at: string
  action: PaymentStatus
  note?: string
  actor: string
}

export interface PaymentRecord {
  method: PaymentMethod
  reference: string
  note?: string
  submittedAt: string
  status: PaymentStatus
  reviewedAt?: string
  reviewedBy?: string
  reviewNote?: string
  history: PaymentReviewEvent[]
}

export interface Registration {
  id: string
  reference: string
  tournamentId: string
  playerName: string
  email: string
  tag: string
  region: string
  entryFee: number
  registrationStatus: RegistrationStatus
  payment: PaymentRecord
  createdAt: string
  confirmedAt?: string
}
