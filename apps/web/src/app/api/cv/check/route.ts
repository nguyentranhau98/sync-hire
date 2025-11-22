import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage/storage-factory";

/**
 * GET /api/cv/check
 *
 * Check if CV extraction data exists (for demo single-user scenario)
 * Returns the most recent CV extraction if found
 */
export async function GET() {
  try {
    const storage = getStorage();
    const cvExtraction = await storage.getMostRecentCVExtraction();

    if (cvExtraction === null) {
      return NextResponse.json({
        data: {
          exists: false,
          hash: null,
        },
      });
    }

    return NextResponse.json({
      data: {
        exists: true,
        hash: cvExtraction.hash,
      },
    });
  } catch (error) {
    console.error("CV check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check CV extraction status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
