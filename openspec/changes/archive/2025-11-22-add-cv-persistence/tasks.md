# Implementation Tasks

## 1. Storage Layer Enhancement
- [x] 1.1 Add `getAllCVExtractions()` method to StorageInterface for listing all CV extraction files
- [x] 1.2 Implement `getAllCVExtractions()` in FileStorage class to read cv-extractions directory
- [x] 1.3 Add helper method to get the most recent CV extraction (for demo single-user scenario)

## 2. Page Logic Updates
- [x] 2.1 Add CV existence check on component mount in /candidate/jobs/page.tsx
- [x] 2.2 Create new workflow state for "has existing CV" scenario
- [x] 2.3 Implement auto-skip upload logic when CV data exists
- [x] 2.4 Update workflowStage initialization based on CV existence check
- [x] 2.5 Ensure "Upload Different CV" button triggers return to upload state

## 3. API Integration
- [x] 3.1 Create GET endpoint `/api/cv/check` to verify CV extraction existence
- [x] 3.2 Ensure endpoint returns CV hash and existence status
- [x] 3.3 Add error handling for storage read failures

## 4. UI State Management
- [x] 4.1 Update workflow to handle checking, upload, processing, and results states
- [x] 4.2 Ensure reupload button shows in results state (existing functionality preserved)
- [x] 4.3 Maintain existing processing progress indicators
- [x] 4.4 Add loading spinner for "checking" state

## 5. Testing
- [x] 5.1 Test initial upload flow (no CV exists)
- [x] 5.2 Test subsequent page load (CV exists, skip upload)
- [x] 5.3 Test reupload flow (replace existing CV)
- [x] 5.4 Test with multiple CV files (different hashes)
- [x] 5.5 Test error handling when storage is unavailable
