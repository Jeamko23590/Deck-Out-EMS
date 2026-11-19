/**
 * @deprecated Static result fixtures were removed. Results come from the EMS API via AppContext.
 */
import type { TournamentResult } from '../types'
export const results: TournamentResult[] = []
export const resultByTournamentId = (_id: string): TournamentResult | undefined => undefined
export const resultsByGame = (_game: string): TournamentResult[] => []
