/**
 * GET /api/jobs/[id]/applications
 *
 * Get all candidate applications for a specific job.
 */

import { type NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage/storage-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const storage = getStorage();

    // Verify job exists
    const job = await storage.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: `Job not found: ${jobId}` },
        { status: 404 }
      );
    }

    // Get applications for this job
    const applications = await storage.getApplicationsForJob(jobId);

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        total: applications.length,
        applications: applications.map(app => ({
          id: app.id,
          cvId: app.cvId,
          candidateName: app.candidateName,
          candidateEmail: app.candidateEmail,
          matchScore: app.matchScore,
          matchReasons: app.matchReasons,
          skillGaps: app.skillGaps,
          status: app.status,
          questionsHash: app.questionsHash,
          source: app.source,
          createdAt: app.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get applications" },
      { status: 500 }
    );
  }
}
