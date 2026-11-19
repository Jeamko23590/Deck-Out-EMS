/**
 * @deprecated Static event fixtures were removed. Use the EMS API via AppContext.
 */
import type { Tournament } from '../types'
export const tournaments: Tournament[] = []
export const tournamentsByGame = (_game: string): Tournament[] => []
export const featuredTournaments = (): Tournament[] => []
export const eventCountForGame = (_game: string): number => 0
export const totalPrizePool = (): number => 0
