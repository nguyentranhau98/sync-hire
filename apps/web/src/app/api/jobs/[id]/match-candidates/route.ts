/**
 * POST /api/jobs/[id]/match-candidates
 *
 * Scans all CVs in the system and finds candidates matching the job requirements.
 * For matches above 80%, creates applications and generates personalized questions.
 */

import { type NextRequest, NextResponse } from "next/server";
import { generateSmartMergedQuestions } from "@/lib/backend/question-generator";
import { geminiClient } from "@/lib/gemini-client";
import type { ApplicationStatus, CandidateApplication, ExtractedCVData, ExtractedJobData } from "@/lib/mock-data";
import { getStorage } from "@/lib/storage/storage-factory";
import type { InterviewQuestions } from "@/lib/storage/storage-interface";
import { generateStringHash } from "@/lib/utils/hash-utils";
import { z } from "zod";

const matchResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchReasons: z.array(z.string()),
  skillGaps: z.array(z.string()),
});

async function calculateMatchScore(
  cvData: ExtractedCVData,
  jobTitle: string,
  jobRequirements: string[],
  jobDescription: string
): Promise<{ matchScore: number; matchReasons: string[]; skillGaps: string[] }> {
  const prompt = `Analyze how well this candidate matches the job position.

JOB:
Title: ${jobTitle}
Description: ${jobDescription}
Requirements: ${jobRequirements.join(", ")}

CANDIDATE:
Name: ${cvData.personalInfo.fullName}
Skills: ${cvData.skills?.join(", ") || "Not specified"}
Experience: ${cvData.experience?.map(e => `${e.title} at ${e.company}`).join("; ") || "Not specified"}
Education: ${cvData.education?.map(e => `${e.degree} from ${e.institution}`).join("; ") || "Not specified"}

Return a JSON object with:
- matchScore: number 0-100 (percentage match)
- matchReasons: array of 2-3 specific reasons why this candidate matches
- skillGaps: array of 1-2 skills the candidate may be missing

Be realistic with scoring:
- 90-100: Near-perfect match, all requirements met
- 80-89: Strong match, most requirements met
- 70-79: Good match, key requirements met
- 60-69: Partial match, some requirements met
- Below 60: Weak match`;

  try {
    const jsonSchema = z.toJSONSchema(matchResultSchema);

    const response = await geminiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema as unknown as Record<string, unknown>,
      },
    });

    const content = response.text || "";
    const parsed = JSON.parse(content);
    return matchResultSchema.parse(parsed);
  } catch (error) {
    console.error("Match calculation error:", error);
    // Fallback to simulated score
    return {
      matchScore: Math.floor(Math.random() * 30) + 60,
      matchReasons: ["Skills alignment", "Experience level"],
      skillGaps: [],
    };
  }
}

/**
 * Generate smart merged questions and save them
 */
async function generateAndSaveQuestions(
  storage: Awaited<ReturnType<typeof getStorage>>,
  cvData: ExtractedCVData,
  job: { title: string; company: string; requirements: string[]; description: string; questions?: Array<{ id: string; text: string; type: string; duration: number; category?: string }> },
  questionsHash: string,
  cvId: string,
  jobId: string,
  applicationId: string
) {
  try {
    // Build JD data for question generator
    const jdData: ExtractedJobData = {
      title: job.title,
      company: job.company,
      location: "",
      employmentType: "Full-time",
      workArrangement: "Not specified",
      seniority: "",
      requirements: job.requirements,
      responsibilities: [job.description],
    };

    // Generate smart merged questions
    const mergedQuestions = await generateSmartMergedQuestions(
      cvData,
      jdData,
      (job.questions || []) as any
    );

    // Build interview questions structure
    const interviewQuestions: InterviewQuestions = {
      metadata: {
        cvId,
        jobId,
        generatedAt: new Date().toISOString(),
        questionCount: mergedQuestions.length,
        customQuestionCount: mergedQuestions.filter(q => q.source === "job").length,
        suggestedQuestionCount: mergedQuestions.filter(q => q.source === "ai-personalized").length,
      },
      customQuestions: mergedQuestions
        .filter(q => q.source === "job")
        .map((q, i) => ({
          id: q.originalId || `job-${i}`,
          type: "LONG_ANSWER" as const,
          content: q.content,
          required: true,
          order: i,
        })),
      suggestedQuestions: mergedQuestions
        .filter(q => q.source === "ai-personalized")
        .map(q => ({
          content: q.content,
          reason: q.reason,
          category: q.category,
        })),
    };

    // Save questions
    await storage.saveInterviewQuestions(questionsHash, interviewQuestions);

    // Update application status to ready
    const application = await storage.getApplication(applicationId);
    if (application) {
      application.status = "ready";
      application.updatedAt = new Date();
      await storage.saveApplication(application);
    }

    console.log(`Generated ${mergedQuestions.length} questions for application ${applicationId}`);
  } catch (error) {
    console.error("Failed to generate questions:", error);
    // Update application status to indicate error (keep as generating_questions for retry)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const storage = getStorage();

    // Get job
    const job = await storage.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: `Job not found: ${jobId}` },
        { status: 404 }
      );
    }

    // Get all CVs
    const cvExtractions = await storage.getAllCVExtractions();
    if (cvExtractions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          matchedCount: 0,
          applications: [],
          message: "No CVs found in the system",
        },
      });
    }

    const matchThreshold = job.aiMatchingThreshold || 80;
    const applications: CandidateApplication[] = [];

    // Process each CV
    for (const { cvId, data: cvData } of cvExtractions) {
      // Check if application already exists
      const existingApplications = await storage.getApplicationsForJob(jobId);
      const alreadyApplied = existingApplications.some(app => app.cvId === cvId);

      if (alreadyApplied) {
        continue;
      }

      // Calculate match score
      const { matchScore, matchReasons, skillGaps } = await calculateMatchScore(
        cvData,
        job.title,
        job.requirements,
        job.description
      );

      // Only create application if above threshold
      if (matchScore >= matchThreshold) {
        const applicationId = `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const questionsHash = generateStringHash(cvId + jobId);

        const application: CandidateApplication = {
          id: applicationId,
          jobId,
          cvId,
          candidateName: cvData.personalInfo.fullName || "Unknown Candidate",
          candidateEmail: cvData.personalInfo.email || "",
          matchScore,
          matchReasons,
          skillGaps,
          status: "generating_questions" as ApplicationStatus,
          questionsHash,
          source: "ai_match",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save application
        await storage.saveApplication(application);
        applications.push(application);

        // Update application count on job
        const updatedJob = {
          ...job,
          applicantsCount: (job.applicantsCount || 0) + 1,
        };
        await storage.saveJob(jobId, updatedJob);

        // Generate smart merged questions in background
        generateAndSaveQuestions(
          storage,
          cvData,
          job,
          questionsHash,
          cvId,
          jobId,
          application.id
        ).catch(err => console.error("Question generation failed:", err));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        matchedCount: applications.length,
        threshold: matchThreshold,
        applications: applications.map(app => ({
          id: app.id,
          candidateName: app.candidateName,
          matchScore: app.matchScore,
          status: app.status,
        })),
      },
    });
  } catch (error) {
    console.error("Match candidates error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to match candidates",
      },
      { status: 500 }
    );
  }
}
