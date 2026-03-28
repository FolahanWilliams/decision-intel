/**
 * Team / Organization API
 *
 * GET  /api/team — Get user's organization + members
 * POST /api/team — Create a new organization
 * PUT  /api/team — Update organization name/slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('Team');

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the user's membership (they might be in multiple orgs, return the first)
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: {
          include: {
            members: {
              orderBy: { joinedAt: 'asc' },
            },
            invites: {
              where: { status: 'pending' },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ organization: null, role: null });
    }

    return NextResponse.json({
      organization: membership.organization,
      role: membership.role,
    });
  } catch (error) {
    log.error('Failed to fetch team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug } = CreateOrgSchema.parse(body);

    // Atomically check uniqueness + create inside a single transaction
    const org = await prisma
      .$transaction(async tx => {
        const existing = await tx.teamMember.findFirst({
          where: { userId: user.id, role: 'owner' },
        });
        if (existing) throw new Error('ALREADY_OWNS_ORG');

        const slugExists = await tx.organization.findUnique({ where: { slug } });
        if (slugExists) throw new Error('SLUG_TAKEN');

        const newOrg = await tx.organization.create({
          data: { name, slug },
        });

        await tx.teamMember.create({
          data: {
            orgId: newOrg.id,
            userId: user.id,
            email: user.email || '',
            displayName:
              (user.user_metadata as Record<string, string> | undefined)?.full_name ||
              user.email?.split('@')[0] ||
              'Owner',
            role: 'owner',
          },
        });

        return newOrg;
      })
      .catch((err: Error) => {
        if (err.message === 'ALREADY_OWNS_ORG')
          return { _conflict: 'You already own an organization' } as const;
        if (err.message === 'SLUG_TAKEN')
          return { _conflict: 'This team URL is already taken' } as const;
        throw err;
      });

    if ('_conflict' in org) {
      return NextResponse.json({ error: org._conflict }, { status: 409 });
    }

    log.info(`Organization created: ${org.id} by ${user.id}`);
    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    log.error('Failed to create organization:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}

const UpdateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
});

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = UpdateOrgSchema.parse(body);

    // User must be owner or admin
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id, role: { in: ['owner', 'admin'] } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // If updating slug, check uniqueness
    if (data.slug) {
      const slugExists = await prisma.organization.findFirst({
        where: { slug: data.slug, NOT: { id: membership.orgId } },
      });
      if (slugExists) {
        return NextResponse.json({ error: 'This team URL is already taken' }, { status: 409 });
      }
    }

    const updated = await prisma.organization.update({
      where: { id: membership.orgId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    log.error('Failed to update organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}
