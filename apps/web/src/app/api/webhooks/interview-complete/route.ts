/**
 * Webhook: Interview Complete
 * Receives notification when an AI interview is completed
 * POST /api/webhooks/interview-complete
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log('📥 Interview completion webhook received:', {
      callId: payload.call_id,
      candidateName: payload.candidate_name,
      jobTitle: payload.job_title,
      durationMinutes: payload.duration_minutes,
      completedAt: payload.completed_at,
      status: payload.status,
    });

    // TODO: Store interview completion in database
    // - Update interview status to "completed"
    // - Save duration
    // - Trigger analysis/scoring pipeline
    // - Send notification to hiring manager

    // For now, just log and acknowledge
    return NextResponse.json({
      success: true,
      message: 'Interview completion received',
      callId: payload.call_id,
    });
  } catch (error) {
    console.error('Error processing interview completion webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
