import { prisma } from '@/lib/prisma';
import { PLANS, PlanType } from '@/lib/stripe';
import { createLogger } from './logger';

const log = createLogger('PlanLimits');

export async function getUserPlan(userId: string): Promise<PlanType> {
  try {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { plan: true },
    });
    return (sub?.plan as PlanType) || 'free';
  } catch {
    // Schema drift — default to free
    return 'free';
  }
}

export async function checkAnalysisLimit(
  userId: string
): Promise<{ allowed: boolean; plan: PlanType; used: number; limit: number }> {
  const plan = await getUserPlan(userId);
  const limits = PLANS[plan];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const used = await prisma.analysis.count({
      where: {
        document: { userId },
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      allowed: used < limits.analysesPerMonth,
      plan,
      used,
      limit: limits.analysesPerMonth,
    };
  } catch {
    // On error, deny (fail closed to prevent limit bypass)
    log.error('Analysis count check failed, denying by default');
    return { allowed: false, plan, used: 0, limit: limits.analysesPerMonth };
  }
}
