## MODIFIED Requirements

### Requirement: Editable Extracted Data

The system SHALL display all AI-extracted job data in editable form fields, allowing HR users to review and modify any field before saving, including full job description content, AI-suggested improvements, and integrated custom question management.

#### Scenario: Edit extracted title
- **WHEN** user clicks on extracted job title field
- **THEN** the field becomes editable
- **THEN** user can modify the title text
- **THEN** changes are reflected in real-time preview

#### Scenario: Edit responsibilities list
- **WHEN** user views extracted responsibilities
- **THEN** each responsibility is displayed as editable list item
- **THEN** user can add, remove, or modify individual items
- **THEN** user can reorder items via drag-and-drop

#### Scenario: Edit requirements list
- **WHEN** user views extracted requirements
- **THEN** each requirement is displayed as editable list item
- **THEN** user can add, remove, or modify individual items
- **THEN** user can reorder items via drag-and-drop

#### Scenario: View full job description content
- **WHEN** user is on the Extracted Data screen
- **THEN** the system displays the complete original job description text in an expandable section
- **THEN** the full text is searchable and copyable
- **THEN** the section can be collapsed to focus on structured data

#### Scenario: Review AI-suggested improvements
- **WHEN** AI improvements are generated for the job description
- **THEN** suggestions are displayed directly in the Extracted Data view categorized by type (inclusiveness, clarity, skills, seniority)
- **THEN** each suggestion shows original text and suggested improvement
- **THEN** user can accept or reject individual suggestions with inline actions
- **THEN** accepted suggestions are applied immediately to the job description preview

#### Scenario: Save edited extraction
- **WHEN** user finishes editing extracted data and reviewing suggestions
- **THEN** user clicks "Continue to Job Creation" button
- **THEN** the system validates all required fields are filled
- **THEN** the system proceeds to integrated job creation with custom questions

### Requirement: Custom Screening Questions

The system SHALL provide an integrated text-based question builder interface within the Extracted Data screen for AI interview questions, allowing users to add, edit, reorder, and delete questions that will be asked by AI to candidates.

#### Scenario: Display AI-suggested questions
- **WHEN** user is on the Extracted Data screen
- **THEN** the system shows AI-generated interview questions based on the job description
- **THEN** each suggested question is displayed as text that the AI will ask candidates
- **THEN** user can add suggested questions to the custom questions list with one click
- **THEN** suggested questions can be edited before adding

#### Scenario: Add text-based question
- **WHEN** user clicks "Add Question" button
- **THEN** the system creates a new text input field inline within the Extracted Data view
- **THEN** user can enter question text (e.g., "What is your experience with React?")
- **THEN** user can optionally toggle "Required" checkbox to indicate importance
- **THEN** the question is added to the questions list without page navigation

#### Scenario: Edit existing question inline
- **WHEN** user clicks on any question text in the list
- **THEN** the question becomes editable inline without leaving the Extracted Data screen
- **THEN** user can modify the question text directly
- **THEN** user can toggle the required status
- **THEN** changes are saved automatically when user clicks away or presses Enter

#### Scenario: Reorder questions via drag-and-drop
- **WHEN** user drags a question card by the handle icon
- **THEN** the question can be dropped in a new position in the list
- **THEN** the system updates the order field for all questions
- **THEN** the preview reflects the new question order immediately

#### Scenario: Delete a question
- **WHEN** user clicks trash icon on a question card
- **THEN** the system shows inline confirmation "Delete this question?"
- **THEN** if user confirms, the question is removed from the list
- **THEN** remaining questions maintain their order
- **THEN** all actions happen within the Extracted Data screen

#### Scenario: Question preview for AI interview
- **WHEN** user views the questions list
- **THEN** each question shows the exact text that AI will use to ask candidates
- **THEN** questions are displayed in the order they will be asked during interviews
- **THEN** required questions are clearly marked for candidates and AI interview system

### Requirement: Job Creation Output

The system SHALL display the actual created job details after confirmation, including title, description, suggested + custom questions, and JD improvements, without showing placeholder or mock data.

#### Scenario: Create job from Extracted Data view
- **WHEN** user clicks "Create Job" button from Extracted Data screen
- **THEN** the system validates all required data is complete
- **THEN** the system creates the job posting with all custom questions
- **THEN** the system applies accepted AI improvements to the job description
- **THEN** the system shows success state with actual job data

#### Scenario: Display created job details
- **WHEN** job creation is successful
- **THEN** the system displays the actual created job title, company, location
- **THEN** the system shows the final job description with all accepted improvements applied
- **THEN** the system lists all custom questions (both added and AI-suggested) with their types and requirements
- **THEN** the system displays a "View Job Details" link to the full job posting page

#### Scenario: Show job creation confirmation
- **WHEN** job is successfully created
- **THEN** the system shows success message "Job '{title}' has been created successfully"
- **THEN** the system displays job ID and posting date
- **THEN** the system provides options to "Create Another Job" or "View All Jobs"
- **THEN** no placeholder or mock data is displayed - only actual created job information

#### Scenario: Handle job creation errors
- **WHEN** job creation fails due to validation or server errors
- **THEN** the system displays specific error messages
- **THEN** the user remains on the Extracted Data screen with all data preserved
- **THEN** the system highlights which fields need correction
- **THEN** user can retry job creation after fixing issues

## ADDED Requirements

### Requirement: Integrated Job Creation Flow

The system SHALL provide a unified interface where users can review extracted data, manage AI suggestions, configure custom questions, and create jobs all within a single Extracted Data screen experience.

#### Scenario: Complete job creation in single view
- **WHEN** user uploads a job description and extraction is complete
- **THEN** the system displays all job creation components in one scrollable view
- **THEN** extracted data, AI suggestions, and question management are all accessible without navigation
- **THEN** user can perform all actions (edit, add questions, accept suggestions) before job creation
- **THEN** job creation happens with one click from this unified view

#### Scenario: Progress indication within single view
- **WHEN** user completes different sections of the Extracted Data view
- **THEN** the system shows completion status for each section (basic info, AI improvements, custom questions)
- **THEN** required sections are clearly marked
- **THEN** the "Create Job" button is enabled only when all required sections are complete
- **THEN** user can see at a glance what still needs attention

#### Scenario: Real-time preview integration
- **WHEN** user makes any changes to extracted data, accepts AI suggestions, or modifies questions
- **THEN** the system updates a live preview section showing how the job will appear to candidates
- **THEN** the preview includes the job description with improvements and all custom questions
- **THEN** the preview updates instantly as user makes changes
- **THEN** preview helps user understand the final output before creation