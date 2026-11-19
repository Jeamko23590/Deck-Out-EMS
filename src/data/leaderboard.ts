/**
 * @deprecated Static leaderboard fixtures were removed. Standings come from the EMS API.
 */
import type { LeaderboardEntry } from '../types'
export const leaderboard: LeaderboardEntry[] = []
export const leaderboardByGame = (_game: string): LeaderboardEntry[] => []
export const topOverall = (_count: number): LeaderboardEntry[] => []
