export type Game = { home: string; away: string; score: readonly [number, number]; date: string }

export function standings(teams: string[], games: Game[]) {
  return teams.map(team => {
    const row = { team, played: 0, won: 0, lost: 0, scored: 0, allowed: 0, diff: 0, points: 0 }
    for (const { home, away, score } of games) {
      if (team !== home && team !== away) continue
      const [scored, allowed] = team === home ? score : [score[1], score[0]]
      row.played++
      row.scored += scored
      row.allowed += allowed
      if (scored > allowed) row.won++
      else row.lost++
    }
    row.diff = row.scored - row.allowed
    row.points = 2 * row.won + row.lost
    return row
  }).sort((a, b) => b.points - a.points || b.diff - a.diff || b.scored - a.scored)
}
