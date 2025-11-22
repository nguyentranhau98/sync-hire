# Change: Add CV Upload Persistence

## Why
Currently, candidates must reupload their CV every time they visit the job listings page, even though the system successfully stores CV extraction data in `data/cv-extractions`. This creates unnecessary friction in the user experience and makes the background extraction process feel like wasted work.

## What Changes
- Add CV existence check on page load using the existing `data/cv-extractions` folder
- Automatically skip the upload form and show job matching when CV data exists
- Keep the existing "Upload Different CV" reupload functionality
- Maintain mock job matching behavior throughout
- Use the existing storage interface methods (`hasCVExtraction`, `getCVExtraction`) to check for CV data

## Impact
- Affected specs: `candidate-job-matching`
- Affected code:
  - `/apps/web/src/app/candidate/jobs/page.tsx` - Add CV existence check on mount, adjust workflow logic
  - `/apps/web/src/lib/storage/file-storage.ts` - Add method to list all CV extractions (for demo single-user scenario)
  - Existing `data/cv-extractions` folder - Continue using for storage (no changes needed)
