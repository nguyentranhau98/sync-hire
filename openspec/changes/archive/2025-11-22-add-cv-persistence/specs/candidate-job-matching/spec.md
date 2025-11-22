# candidate-job-matching Delta

## ADDED Requirements

### Requirement: CV Persistence Check
On page load, the system SHALL check if CV extraction data exists in storage and automatically proceed to job matching if found, skipping the upload workflow.

#### Scenario: Page load with existing CV data
- **WHEN** a candidate navigates to the /candidate/jobs page
- **AND** CV extraction data exists in the data/cv-extractions folder
- **THEN** the system SHALL skip the upload interface
- **AND** the system SHALL automatically display job matching results
- **AND** the system SHALL show the "Upload Different CV" reupload option

#### Scenario: Page load without existing CV data
- **WHEN** a candidate navigates to the /candidate/jobs page
- **AND** no CV extraction data exists in storage
- **THEN** the system SHALL display the CV upload interface
- **AND** the system SHALL NOT display job listings
- **AND** the system SHALL follow the existing upload workflow

### Requirement: CV Reupload Support
The system SHALL allow candidates to upload a new CV at any time, replacing previous CV data and triggering fresh background extraction.

#### Scenario: Reuploading CV with existing data
- **WHEN** a candidate clicks "Upload Different CV" button
- **AND** CV extraction data already exists
- **THEN** the system SHALL return to the upload interface
- **AND** the system SHALL accept a new CV upload
- **AND** the system SHALL trigger background extraction for the new CV
- **AND** the system SHALL replace the old CV data with the new extraction

#### Scenario: New CV extraction caching
- **WHEN** a candidate uploads a different CV file
- **THEN** the system SHALL generate a new hash for the file
- **AND** the system SHALL store the new extraction data separately
- **AND** the system SHALL maintain the existing CV if file content is identical (same hash)

## MODIFIED Requirements

### Requirement: CV Upload Gate
The candidate job listings page MUST require users to upload a CV file before displaying job listings, unless CV extraction data already exists in storage from a previous upload.

#### Scenario: Initial page load without uploaded CV
- **WHEN** a candidate navigates to the /candidate/jobs page for the first time
- **AND** no CV extraction data exists in the data/cv-extractions folder
- **THEN** the system SHALL display a CV upload interface with clear instructions
- **AND** the system SHALL NOT display any job listings
- **AND** the system SHALL provide a file upload button accepting PDF files

#### Scenario: Subsequent page load with existing CV
- **WHEN** a candidate navigates to the /candidate/jobs page
- **AND** CV extraction data exists in storage
- **THEN** the system SHALL skip the upload interface
- **AND** the system SHALL display job matching results immediately
- **AND** the system SHALL show the "Upload Different CV" option for reuploading

#### Scenario: CV file validation
- **WHEN** a candidate attempts to upload a non-PDF file
- **THEN** the system SHALL reject the file with a clear error message
- **AND** the system SHALL prompt the user to upload a valid PDF file
- **AND** the system SHALL NOT proceed to parsing/matching simulation
