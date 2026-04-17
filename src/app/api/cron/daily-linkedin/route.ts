/**
 * GET /api/cron/daily-linkedin — Auto-generate tomorrow's LinkedIn case study post
 *
 * Picks the next un-posted case study (round-robin by index stored in CacheEntry),
 * generates a LinkedIn post via Gemini, and emails it to the founder with the
 * case study link. The founder wakes up, copies the post, attaches the graph
 * image from Content Studio, and publishes.
 *
 * Runs daily via the cron dispatcher.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { ALL_CASES } from '@/lib/data/case-studies';
import { getSlugForCase } from '@/lib/data/case-studies/slugs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { sendEmail, isEmailConfigured } from '@/lib/notifications/email';

const log = createLogger('DailyLinkedIn');

const CACHE_KEY = 'daily-linkedin:index';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';

function formatBiasName(s: string): string {
  return s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function GET() {
  const headerList = await headers();
  const authHeader = headerList.get('authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (!safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Guard: bail early if email delivery isn't configured. Calling Gemini
  // without a working email downstream was the root cause of the April 2026
  // cost spike — each daily run burned tokens then silently failed to deliver.
  const founderEmail = process.env.FOUNDER_EMAIL?.trim();
  if (!founderEmail) {
    log.warn('Skipping daily-linkedin: FOUNDER_EMAIL not set');
    return NextResponse.json(
      { skipped: true, reason: 'FOUNDER_EMAIL not configured' },
      { status: 200 }
    );
  }
  if (!isEmailConfigured()) {
    log.warn('Skipping daily-linkedin: RESEND_API_KEY not set (email delivery disabled)');
    return NextResponse.json(
      { skipped: true, reason: 'RESEND_API_KEY not configured — email delivery disabled' },
      { status: 200 }
    );
  }

  try {
    // Get or initialize the round-robin index
    let currentIndex = 0;
    try {
      const cached = await prisma.cacheEntry.findUnique({ where: { key: CACHE_KEY } });
      if (cached) {
        currentIndex = parseInt(cached.value, 10) || 0;
      }
    } catch {
      // Schema drift — start from 0
    }

    // Pick the next case study (round-robin)
    if (ALL_CASES.length === 0) {
      return NextResponse.json({ error: 'No case studies available' }, { status: 404 });
    }
    const caseIndex = currentIndex % ALL_CASES.length;
    const caseStudy = ALL_CASES[caseIndex];
    const slug = getSlugForCase(caseStudy);
    const caseUrl = `${SITE_URL}/case-studies/${slug}`;

    // Generate LinkedIn post via Gemini
    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { maxOutputTokens: 2048 },
    });

    const biasNames = caseStudy.biasesPresent.map(formatBiasName).join(', ');
    const toxicCombos =
      caseStudy.toxicCombinations.length > 0
        ? `Toxic combinations detected: ${caseStudy.toxicCombinations.join(', ')}.`
        : '';

    const prompt = `Write a LinkedIn post (1300-1800 characters) about this real-world case study in cognitive bias and decision-making.

Company: ${caseStudy.company} (${caseStudy.year})
Decision: ${caseStudy.title}
Summary: ${caseStudy.summary}
Outcome: ${caseStudy.estimatedImpact}
Biases detected: ${biasNames}
Primary bias: ${formatBiasName(caseStudy.primaryBias)}
${toxicCombos}

Rules:
- Start with a hook line that creates curiosity (this is what shows before "see more")
- Write 3-5 short paragraphs, conversational but authoritative tone
- Include 1 specific data point or statistic from the case
- Frame it as a lesson for decision-makers, not just a story
- End with: "Read the full case study: ${caseUrl}"
- Add 3-5 relevant hashtags at the very end
- Do NOT use markdown bold, italic, or headers. Plain text only.
- Do NOT use em dashes. Use commas or periods instead.`;

    const result = await model.generateContent(prompt);
    const postText = result.response
      .text()
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/[\u2014\u2013]/g, ', ');

    // Save the post to FounderContent for the library
    try {
      await prisma.founderContent.create({
        data: {
          contentType: 'linkedin_post',
          title: `${caseStudy.company} (${caseStudy.year}): ${caseStudy.title}`,
          body: postText,
          topic: `case_study:${slug}`,
          tone: 'authoritative',
          status: 'ready',
        },
      });
    } catch {
      log.warn('Failed to save post to FounderContent (non-critical)');
    }

    // Advance the round-robin index
    try {
      await prisma.cacheEntry.upsert({
        where: { key: CACHE_KEY },
        create: {
          key: CACHE_KEY,
          value: String(caseIndex + 1),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        update: {
          value: String(caseIndex + 1),
        },
      });
    } catch {
      log.warn('Failed to update round-robin index (non-critical)');
    }

    // Email the post to the founder
    const hubUrl = `${SITE_URL}/dashboard/founder-hub`;
    const emailResult = await sendEmail({
      to: founderEmail,
      subject: `LinkedIn Post Ready: ${caseStudy.company} (${caseStudy.year})`,
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px;">
          <h2 style="color: #16A34A; font-size: 16px; margin-bottom: 4px;">Your daily LinkedIn post is ready</h2>
          <p style="color: #64748B; font-size: 13px; margin-top: 0;">Case study #${caseIndex + 1} of ${ALL_CASES.length}: ${caseStudy.company}</p>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 16px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #1E293B;">
${postText}
          </div>

          <p style="font-size: 13px; color: #64748B;">
            <strong>Next steps:</strong><br>
            1. Copy the post above<br>
            2. Go to <a href="${hubUrl}" style="color: #16A34A;">Content Studio</a> to download the bias graph image for this case study<br>
            3. Paste into LinkedIn, attach the image, publish
          </p>

          <p style="font-size: 12px; color: #94A3B8; margin-top: 24px;">
            Case study link: <a href="${caseUrl}" style="color: #16A34A;">${caseUrl}</a><br>
            Tomorrow's post: ${ALL_CASES[(caseIndex + 1) % ALL_CASES.length].company} (${ALL_CASES[(caseIndex + 1) % ALL_CASES.length].year})
          </p>
        </div>
      `,
    });

    if (emailResult === 'sent') {
      log.info(`LinkedIn post emailed to ${founderEmail} for ${caseStudy.company}`);
    } else {
      log.warn(
        `LinkedIn email for ${caseStudy.company} ended with result='${emailResult}' ` +
          `(post was generated; check EMAIL_FROM domain verification in Resend)`
      );
    }

    return NextResponse.json({
      success: true,
      caseStudy: {
        company: caseStudy.company,
        year: caseStudy.year,
        slug,
        index: caseIndex + 1,
        total: ALL_CASES.length,
      },
      postLength: postText.length,
      emailed: emailResult === 'sent',
      emailResult,
      nextCase: ALL_CASES[(caseIndex + 1) % ALL_CASES.length].company,
    });
  } catch (error) {
    log.error('Daily LinkedIn cron failed:', error);
    return NextResponse.json({ error: 'Failed to generate LinkedIn post' }, { status: 500 });
  }
}
