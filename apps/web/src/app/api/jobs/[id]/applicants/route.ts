/**
 * GET /api/jobs/[id]/applicants
 *
 * Returns all interviews/applicants for a specific job
 * Combines interview data with user/CV data to provide applicant details
 * Falls back to demo applicants if no real interviews exist (for demo purposes)
 */

import { NextRequest, NextResponse } from "next/server";
import { getDemoApplicants } from "@/lib/mock-data";
import { getStorage } from "@/lib/storage/storage-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: jobId } = await params;
    const storage = getStorage();

    // Get the job to verify it exists
    const job = await storage.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 },
      );
    }

    // Get all interviews and filter by jobId
    const allInterviews = await storage.getAllInterviews();
    const jobInterviews = allInterviews.filter(
      (interview) => interview.jobId === jobId,
    );

    // Track if we're using demo data
    let usingDemoData = false;

    // Enrich interview data with user/CV information
    const realApplicants = await Promise.all(
      jobInterviews.map(async (interview) => {
        // Try to get user data
        const user = await storage.getUser(interview.candidateId);

        // Try to get CV data if user has one
        let cvData = null;
        if (user) {
          const cvId = await storage.getUserCVId(user.id);
          if (cvId) {
            cvData = await storage.getCVExtraction(cvId);
          }
        }

        return {
          id: interview.id,
          interviewId: interview.id,
          candidateId: interview.candidateId,
          name: cvData?.personalInfo?.fullName ?? user?.name ?? "Unknown Candidate",
          email: cvData?.personalInfo?.email ?? user?.email ?? "",
          status: interview.status,
          score: interview.score,
          durationMinutes: interview.durationMinutes,
          createdAt: interview.createdAt,
          completedAt: interview.completedAt,
          aiEvaluation: interview.aiEvaluation,
          // CV-based data for richer display
          skills: cvData?.skills ?? [],
          experience: cvData?.experience ?? [],
        };
      }),
    );

    // If no real applicants, use demo applicants for demo purposes
    let applicants = realApplicants;
    if (realApplicants.length === 0) {
      usingDemoData = true;
      const demoApplicants = getDemoApplicants();
      applicants = demoApplicants.map((demo) => ({
        id: demo.id,
        interviewId: demo.id,
        candidateId: demo.id,
        name: demo.name,
        email: demo.email,
        status: "COMPLETED" as const,
        score: demo.score,
        durationMinutes: demo.durationMinutes,
        createdAt: demo.completedAt,
        completedAt: demo.completedAt,
        aiEvaluation: demo.aiEvaluation,
        skills: [],
        experience: [],
      }));
      console.log(`📋 Using demo applicants for job ${jobId} (no real interviews found)`);
    }

    // Sort by score (completed first, then by score descending)
    applicants.sort((a, b) => {
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") {
        return -1;
      }
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") {
        return 1;
      }
      return (b.score ?? 0) - (a.score ?? 0);
    });

    return NextResponse.json({
      success: true,
      data: {
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
        },
        applicants,
        stats: {
          total: applicants.length,
          completed: applicants.filter((a) => a.status === "COMPLETED").length,
          pending: applicants.filter((a) => a.status === "PENDING").length,
          inProgress: applicants.filter((a) => a.status === "IN_PROGRESS").length,
          averageScore:
            applicants.filter((a) => a.score !== undefined).length > 0
              ? Math.round(
                  applicants
                    .filter((a) => a.score !== undefined)
                    .reduce((sum, a) => sum + (a.score ?? 0), 0) /
                    applicants.filter((a) => a.score !== undefined).length,
                )
              : null,
        },
        usingDemoData,
      },
    });
  } catch (error) {
    console.error("Failed to fetch job applicants:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch applicants" },
      { status: 500 },
    );
  }
}
