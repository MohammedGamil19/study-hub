import { prisma } from "@/lib/prisma";

export const POINTS = {
  TASK_COMPLETE: 10,
  CHAPTER_COMPLETE: 15,
  REVIEW_COMPLETE: 20,
  POMODORO_SESSION: 5,
  STREAK_BONUS: 25,
};

export function getStreakMultiplier(streak: number): number {
  return Math.min(Math.floor(streak / 7) + 1, 5);
}

export async function awardPoints(
  userId: string,
  reason: keyof typeof POINTS,
  referenceId?: string
) {
  const streak = await prisma.streakRecord.upsert({
    where: { userId },
    create: { userId, currentStreak: 0, longestStreak: 0, totalPoints: 0 },
    update: {},
  });

  const now = new Date();
  const lastActivity = streak.lastActivityAt;
  let newStreak = streak.currentStreak;

  if (lastActivity) {
    const hoursDiff =
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 36) {
      newStreak = 1; // reset
    } else if (hoursDiff >= 20) {
      newStreak = newStreak + 1; // new day
    }
  } else {
    newStreak = 1;
  }

  const multiplier = getStreakMultiplier(newStreak);
  const basePoints = POINTS[reason];
  const totalPoints = Math.round(basePoints * multiplier);

  await prisma.pointTransaction.create({
    data: { userId, points: totalPoints, reason, referenceId, multiplier },
  });

  const updatedStreak = await prisma.streakRecord.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      totalPoints: streak.totalPoints + totalPoints,
      lastActivityAt: now,
    },
  });

  return { points: totalPoints, streak: updatedStreak };
}
