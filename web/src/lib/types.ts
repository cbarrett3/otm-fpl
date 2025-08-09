// Description: Shared TypeScript types for the app bundle and UI models.

export type AppBundle = {
  generatedAt: string
  startEvent: number
  players: AppPlayer[]
}

export type AppPlayer = {
  id: number
  name: string
  firstName: string
  lastName: string
  position: string
  price: number
  team: {
    id: number
    name: string
    shortName: string
    badges: { badge50: string; badge70: string } | null
    strengths: {
      attackHome: number | null
      attackAway: number | null
      defenceHome: number | null
      defenceAway: number | null
      overallHome: number | null
      overallAway: number | null
    } | null
  }
  images: { avatar: string | null; card: string | null; square: string | null }
  availability: { status: string; chanceNext: number | null; news: string | null }
  priceTrend: {
    price: number
    form: number | null
    pointsPerGame: number | null
    costChangeToday: number
    costChangeSinceStart: number
    transfersInEvent: number
    transfersOutEvent: number
  } | null
  stats: {
    points: number
    minutes: number
    goals: number
    assists: number
    cleanSheets: number
    bps: number
    per90: {
      points: number | null
      goals: number | null
      assists: number | null
      ict: number | null
    }
  }
  lastSeason?: {
    season: string
    totalPoints: number
    minutes: number
    goals: number
    assists: number
    cleanSheets: number
    per90: {
      points: number | null
      goals: number | null
      assists: number | null
    }
  } | null
  upcoming: {
    next3: Array<{ event: number; opponent: string; isHome: boolean; difficulty: number | null; kickoff: string | null }>
    avgDifficulty: number | null
  }
  predictedGW1?: boolean | null
  gw1InjuryTag?: 'OUT' | 'QUES' | 'SUS' | null
  highlight?: {
    source: 'youtube'
    videoId: string
  } | null
  draftSocietyTop50Rank?: number | null
  fantraxProjection?: {
    overallRank: number
    posRank: number
    points: number
    pp90: number
  } | null
}



