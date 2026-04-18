/**
 * POST /api/meetings/upload
 *
 * Upload a meeting recording (audio/video) for transcription and cognitive audit.
 * Accepts multipart/form-data with:
 *   - file: audio/video file (max 500MB)
 *   - title: meeting title (required)
 *   - meetingType: board | incident_response | vendor_review | strategic_planning | general
 *   - participants: comma-separated participant names (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { logAudit } from '@/lib/audit';
import { processMeeting } from '@/lib/meetings/process';

const log = createLogger('MeetingUpload');

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', // .mp3
  'audio/mp4', // .m4a
  'audio/wav', // .wav
  'audio/x-wav',
  'audio/webm', // .webm audio
  'audio/ogg', // .ogg
  'audio/flac', // .flac
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4', // .mp4
  'video/webm', // .webm video
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
];

const ALLOWED_TYPES = [...ALLOWED_AUDIO_TYPES, ...ALLOWED_VIDEO_TYPES];

const ALLOWED_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.wav',
  '.webm',
  '.ogg',
  '.flac',
  '.mp4',
  '.mov',
  '.avi',
];

const MEETING_TYPES = [
  'board',
  'incident_response',
  'vendor_review',
  'strategic_planning',
  'general',
];

// 500MB max file size for recordings
const MAX_FILE_SIZE = 500 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(user.id, '/api/meetings/upload');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can upload up to 5 meetings per hour.',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string)?.trim();
    const meetingType = (formData.get('meetingType') as string)?.trim() || 'general';
    const participantsRaw = (formData.get('participants') as string)?.trim() || '';

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: 'Meeting title is required' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    const isAllowedType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
    if (!isAllowedType) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate meeting type
    if (!MEETING_TYPES.includes(meetingType)) {
      return NextResponse.json(
        { error: `Invalid meeting type. Must be one of: ${MEETING_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const participants = participantsRaw
      ? participantsRaw
          .split(',')
          .map(p => p.trim())
          .filter(Boolean)
      : [];

    // Create meeting record
    const meeting = await prisma.meeting.create({
      data: {
        userId: user.id,
        title,
        meetingType,
        source: 'upload',
        fileName: file.name,
        fileType: file.type || 'audio/webm',
        fileSize: file.size,
        participants,
        status: 'uploading',
      },
    });

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { getServiceSupabase } = await import('@/lib/supabase');
    const storageClient = getServiceSupabase();
    const bucket = process.env.SUPABASE_MEETING_BUCKET || 'meetings';
    const storagePath = `${user.id}/${meeting.id}${ext}`;

    const { error: uploadError } = await storageClient.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      log.error('Storage upload failed:', uploadError);
      await prisma.meeting
        .delete({ where: { id: meeting.id } })
        .catch(err => log.warn('Failed to clean up orphan meeting after storage error:', err));
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Update meeting with storage path
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { storagePath, status: 'transcribing' },
    });

    // Audit log
    logAudit({
      action: 'UPLOAD_MEETING',
      resource: 'Meeting',
      resourceId: meeting.id,
      details: {
        title,
        meetingType,
        fileSize: file.size,
        fileName: file.name,
      },
    }).catch(err => log.warn('logAudit UPLOAD_MEETING failed:', err));

    // Kick off background processing (transcription → analysis)
    processMeeting(meeting.id, user.id).catch(err => {
      log.error(`Background meeting processing failed for ${meeting.id}:`, err);
    });

    log.info(`Meeting uploaded: ${meeting.id} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    return NextResponse.json(
      {
        id: meeting.id,
        status: 'transcribing',
        message: 'Meeting uploaded — transcription in progress',
      },
      { status: 201 }
    );
  } catch (error) {
    log.error('Meeting upload error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
