# Change: Enhance Extracted Data Screen

## Why
The current Extracted Data screen in the Job Position management flow only shows basic extracted information and requires users to navigate to separate screens for question management and job creation. This creates a fragmented experience and prevents users from seeing the full context of extracted insights in one place.

## What Changes
- Extend the Extracted Data view to display additional insights: full job description content, suggested JD improvements, and suggested interview/custom questions
- Integrate custom question management directly within the Extracted Data view, allowing users to add/edit/remove questions without navigation
- Enhance job creation output to show actual created job details (title, description, questions, JD improvements) instead of placeholder data
- Provide a seamless, single-screen experience for reviewing extracted data and creating jobs
- Navigate to job detail page (`/hr/jobs/[id]`) after successful job creation to display the newly created job instead of mock data

## Impact
- Affected specs: job-management (Extracted Data display and Custom Questions requirements)
- Affected code: Extracted Data screen components, question management interface, job creation flow, post-creation navigation
- User experience: Streamlined workflow reduces navigation and provides comprehensive job creation insights in one view, with seamless transition to viewing the newly created job details