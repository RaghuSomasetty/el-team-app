import { prisma } from './prisma'

export type ActivityType = 
  | 'MAINTENANCE_WORK' 
  | 'MOTOR_INSPECTION' 
  | 'MIS_ENTRY' 
  | 'PMI_COMPLETION' 
  | 'ISSUE_REPORT' 
  | 'BREAKDOWN_REPAIR'

interface ScoringInput {
  userId: string
  activityType: ActivityType
  description: string
  hasImages: boolean
  userRole: string // Exclude Engineers and Admins
  imageCount?: number
  wordCount?: number
}

const POINT_VALUES: Record<ActivityType, number> = {
  MAINTENANCE_WORK: 10,
  MOTOR_INSPECTION: 10,
  MIS_ENTRY: 15,
  PMI_COMPLETION: 15,
  ISSUE_REPORT: 20,
  BREAKDOWN_REPAIR: 25,
}

export async function calculateAndAwardPoints(input: ScoringInput) {
  const { userId, activityType, description, hasImages, userRole, imageCount = 0 } = input
  
  // Calculate and award points for all active maintenance roles
  // (Previous restriction on ENGINEER/ADMIN removed by user request)
  if (userRole.toUpperCase() === 'ADMIN') {
    return { points: 0, skipped: true }
  }

  // Base points
  let points = POINT_VALUES[activityType] || 10

  // Bonus points: Images
  if (hasImages) {
    points += 15 // Standard bonus for having images
    if (imageCount > 3) {
      points += 5 // Extra bonus for 3+ images
    }
  }

  // Bonus points: Description length
  const wordCount = description.split(/\s+/).filter(Boolean).length
  if (wordCount > 100) {
    points += 5
  }

  // Award the points
  try {
    const updatedScore = await prisma.leaderboardScore.upsert({
      where: { userId },
      update: {
        totalPoints: { increment: points },
        weeklyPoints: { increment: points },
        monthlyPoints: { increment: points },
        lastUpdated: new Date()
      },
      create: {
        userId,
        totalPoints: points,
        weeklyPoints: points,
        monthlyPoints: points,
      }
    })

    return { points, updatedScore }
  } catch (error) {
    console.error('Error awarding points:', error)
    return { points: 0, error }
  }
}
