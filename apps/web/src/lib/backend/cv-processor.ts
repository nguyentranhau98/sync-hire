/**
 * CV Processor
 *
 * Handles PDF extraction and AI-powered structured extraction using Gemini.
 * Uses @google/genai with inline PDF data for direct document processing.
 * Implements structured output with Zod schemas.
 */

import type { ExtractedCVData } from "@/lib/mock-data";
import type { StorageInterface } from "@/lib/storage/storage-interface";
import { generateFileHash } from "@/lib/utils/hash-utils";
import { geminiClient } from "@/lib/gemini-client";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { inspect } from "node:util";
import { log } from "node:console";

// Define Zod schema for extracted CV data
const extractedCVDataSchema = z.object({
  personalInfo: z.object({
    fullName: z
      .string()
      .nullable()
      .transform(val => val || "")
      .describe("The person's full name"),
    email: z
      .string()
      .nullable()
      .transform(val => val || undefined)
      .describe("Email address"),
    phone: z
      .string()
      .nullable()
      .transform(val => val || undefined)
      .describe("Phone number"),
    location: z
      .string()
      .nullable()
      .transform(val => val || undefined)
      .describe("Location/City"),
    summary: z
      .string()
      .nullable()
      .transform(val => val || undefined)
      .describe("Professional summary"),
    linkedinUrl: z
      .string()
      .nullable()
      .transform(val => val || undefined)
      .describe("LinkedIn profile URL"),
    githubUrl: z
      .string()
      .nullable()
      .transform(val => val || undefined)
      .describe("GitHub profile URL"),
    portfolioUrl: z
      .string()
      .nullable()
      .transform(val => val || undefined)
      .describe("Portfolio URL"),
  }),
  experience: z
    .array(z.object({
      title: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Job title"),
      company: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Company name"),
      location: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Job location"),
      startDate: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Start date (YYYY-MM format)"),
      endDate: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("End date (YYYY-MM format)"),
      current: z
        .boolean()
        .nullable()
        .transform(val => Boolean(val))
        .describe("Whether this is the current job"),
      description: z
        .array(z.string().nullable().transform(val => val || ""))
        .transform(arr => arr || [])
        .describe("List of job responsibilities and achievements"),
    }))
    .transform(arr => arr || [])
    .describe("Work experience array"),
  education: z
    .array(z.object({
      degree: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Degree name"),
      field: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Field of study"),
      institution: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("University/School name"),
      location: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Campus location"),
      startDate: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Start date (YYYY-MM format)"),
      endDate: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("End date (YYYY-MM format)"),
      current: z
        .boolean()
        .nullable()
        .transform(val => Boolean(val))
        .describe("Whether currently studying"),
      gpa: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("GPA if mentioned"),
    }))
    .transform(arr => arr || [])
    .describe("Education history array"),
  skills: z
    .array(z.string().nullable().transform(val => val || ""))
    .transform(arr => arr || [])
    .describe("Technical and professional skills"),
  certifications: z
    .array(z.object({
      name: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Certification name"),
      issuer: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Issuing organization"),
      issueDate: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Issue date (YYYY-MM format)"),
      expiryDate: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Expiry date (YYYY-MM format)"),
      credentialId: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Credential ID"),
    }))
    .transform(arr => arr || [])
    .describe("Professional certifications array"),
  languages: z
    .array(z.object({
      language: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Language name"),
      proficiency: z
        .string()
        .nullable()
        .transform(val => val || "Basic")
        .describe("Proficiency level (Basic, Intermediate, Advanced, Native)"),
    }))
    .transform(arr => arr || [])
    .describe("Languages array"),
  projects: z
    .array(z.object({
      name: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Project name"),
      description: z
        .string()
        .nullable()
        .transform(val => val || "")
        .describe("Project description"),
      technologies: z
        .array(z.string().nullable().transform(val => val || ""))
        .transform(arr => arr || [])
        .describe("Technologies used"),
      url: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Project URL"),
      startDate: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("Start date (YYYY-MM format)"),
      endDate: z
        .string()
        .nullable()
        .transform(val => val || undefined)
        .describe("End date (YYYY-MM format)"),
    }))
    .transform(arr => arr || [])
    .describe("Personal projects array"),
});

export class CVProcessor {
  constructor(private storage: StorageInterface) {}

  /**
   * Process a PDF file and extract structured CV data
   */
  async processFile(buffer: Buffer, fileName: string): Promise<{
    hash: string;
    extractedData: ExtractedCVData;
    cached: boolean;
  }> {
    // Validate PDF file type
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext !== "pdf") {
      throw new Error(`Unsupported file type: ${ext}. Only PDF files are supported.`);
    }

    // Generate hash for deduplication
    const hash = generateFileHash(buffer);

    // Check if already cached
    const cached = await this.storage.hasCVExtraction(hash);
    if (cached) {
      const extractedData = await this.storage.getCVExtraction(hash);
      if (extractedData) {
        return { hash, extractedData, cached: true };
      }
    }

    // Call Gemini API with PDF buffer for structured extraction
    const extractedData = await this.callGeminiAPI(buffer);

    // Save to cache
    await this.storage.saveCVExtraction(hash, extractedData);

    // Save original file
    await this.storage.saveCVUpload(hash, buffer);

    return { hash, extractedData, cached: false };
  }

  /**
   * Call Gemini API for structured CV data extraction using inline PDF data
   * Uses enhanced parsing and post-processing for better accuracy
   */
  private async callGeminiAPI(buffer: Buffer): Promise<ExtractedCVData> {
    try {
      const enhancedPrompt = `You are an expert CV parser. Extract structured information from the provided PDF resume/CV with high accuracy.

IMPORTANT PARSING RULES:
1. Parse arrays as actual JSON arrays, not as strings
2. Separate job titles from company names - don't mix them
3. Extract full personal information including name, email, phone
4. Use proper date formats (YYYY-MM or YYYY-MM-DD)
5. Don't include empty/null entries in arrays
6. Each experience item should have: title, company, dates, and description
7. Each education item should have: degree, institution, field, and dates
8. Each certification should be a separate object, not a combined string

Return a valid JSON object with this structure:
{
  "personalInfo": {
    "fullName": "extract the person's full name",
    "email": "email address if found",
    "phone": "phone number if found",
    "location": "city/country if found",
    "summary": "professional summary if found",
    "linkedinUrl": "LinkedIn URL if found",
    "githubUrl": "GitHub URL if found",
    "portfolioUrl": "portfolio URL if found"
  },
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "location": "job location",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "current": true/false,
      "description": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "field": "field of study",
      "institution": "university name",
      "location": "campus location",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "current": false,
      "gpa": "GPA if mentioned"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuing organization",
      "issueDate": "YYYY-MM",
      "expiryDate": "YYYY-MM",
      "credentialId": "ID if available"
    }
  ],
  "languages": [
    {
      "language": "language name",
      "proficiency": "Basic|Intermediate|Advanced|Native"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "brief description",
      "technologies": ["tech1", "tech2"],
      "url": "project URL if available",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM"
    }
  ]
}

Focus on accuracy and proper data structure. Parse ALL available information correctly.`;

      // Convert PDF buffer to base64 for inline data
      const base64Data = buffer.toString("base64");

      // Send PDF to Gemini without schema constraints first
      const response = await geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: enhancedPrompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1, // Lower temperature for more consistent output
        },
      });

      const content = response.text || "";

      // Parse the raw response
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        console.error("JSON parse error, attempting cleanup:", parseError);
        // Try to extract JSON from potentially malformed response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in response");
        }
      }

      // Apply enhanced post-processing
      const processedData = this.postProcessExtraction(parsed);

      // Validate with our flexible schema
      const validated = extractedCVDataSchema.parse(processedData);

      return validated;
    } catch (error) {
      console.error("CV Gemini API error:", error);
      // Return empty extraction on failure (background process, no user impact)
      return {
        personalInfo: {
          fullName: "",
          email: undefined,
          phone: undefined,
          location: undefined,
          summary: undefined,
          linkedinUrl: undefined,
          githubUrl: undefined,
          portfolioUrl: undefined,
        },
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        languages: [],
        projects: [],
      };
    }
  }

  /**
   * Enhanced post-processing to fix common CV extraction issues
   */
  private postProcessExtraction(rawData: any): any {
    const processed = {
      personalInfo: {
        fullName: this.extractFullName(rawData.personalInfo),
        email: this.extractContactInfo(rawData.personalInfo, 'email'),
        phone: this.extractContactInfo(rawData.personalInfo, 'phone'),
        location: this.extractContactInfo(rawData.personalInfo, 'location'),
        summary: this.extractContactInfo(rawData.personalInfo, 'summary'),
        linkedinUrl: this.extractContactInfo(rawData.personalInfo, 'linkedinUrl'),
        githubUrl: this.extractContactInfo(rawData.personalInfo, 'githubUrl'),
        portfolioUrl: this.extractContactInfo(rawData.personalInfo, 'portfolioUrl'),
      },
      experience: this.fixExperienceArray(rawData.experience || []),
      education: this.fixEducationArray(rawData.education || []),
      skills: this.fixSkillsArray(rawData.skills || []),
      certifications: this.fixCertificationsArray(rawData.certifications || []),
      languages: this.fixLanguagesArray(rawData.languages || []),
      projects: this.fixProjectsArray(rawData.projects || []),
    };

    return processed;
  }

  /**
   * Extract full name from personal info or attempt to find it elsewhere
   */
  private extractFullName(personalInfo: any): string {
    if (personalInfo?.fullName && typeof personalInfo.fullName === 'string' && personalInfo.fullName.trim()) {
      return personalInfo.fullName.trim();
    }

    // Try to extract from email as fallback
    if (personalInfo?.email && typeof personalInfo.email === 'string') {
      const emailParts = personalInfo.email.split('@');
      if (emailParts[0] && emailParts[0].length > 2) {
        return emailParts[0].replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    return "";
  }

  /**
   * Extract contact info safely
   */
  private extractContactInfo(personalInfo: any, field: string): string | undefined {
    if (personalInfo?.[field] && typeof personalInfo[field] === 'string' && personalInfo[field].trim()) {
      return personalInfo[field].trim();
    }
    return undefined;
  }

  /**
   * Fix experience array - handle JSON strings and mixed data
   */
  private fixExperienceArray(experience: any[]): any[] {
    const fixed: any[] = [];

    for (const item of experience) {
      if (!item) continue;

      // Handle JSON string arrays
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            fixed.push(...this.fixExperienceArray(parsed));
          }
        } catch {
          // It's just a string, treat as title
          fixed.push({
            title: item,
            company: "",
            location: undefined,
            startDate: "",
            endDate: undefined,
            current: false,
            description: [],
          });
        }
        continue;
      }

      // Handle object experience items
      if (typeof item === 'object') {
        const title = this.cleanStringField(item.title);
        const company = this.cleanStringField(item.company);

        // Skip if both title and company are empty
        if (!title && !company) continue;

        // Detect if data is mixed up (company in title field)
        let finalTitle = title;
        let finalCompany = company;

        // Common indicators that title field actually contains company
        if (title && !company && (
          title.toLowerCase().includes('gmbh') ||
          title.toLowerCase().includes('inc') ||
          title.toLowerCase().includes('ltd') ||
          title.toLowerCase().includes('university') ||
          title.toLowerCase().includes('freelance')
        )) {
          finalTitle = company || "";
          finalCompany = title;
        }

        fixed.push({
          title: finalTitle || "",
          company: finalCompany || "",
          location: item.location ? this.cleanStringField(item.location) : undefined,
          startDate: this.normalizeDate(item.startDate),
          endDate: this.normalizeDate(item.endDate),
          current: Boolean(item.current),
          description: this.parseDescriptionArray(item.description),
        });
      }
    }

    return fixed;
  }

  /**
   * Fix education array
   */
  private fixEducationArray(education: any[]): any[] {
    const fixed: any[] = [];

    for (const item of education) {
      if (!item) continue;

      // Handle JSON string arrays
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            fixed.push(...this.fixEducationArray(parsed));
          }
        } catch {
          // Treat as institution
          fixed.push({
            degree: "",
            field: "",
            institution: this.cleanStringField(item),
            location: undefined,
            startDate: "",
            endDate: "",
            current: false,
            gpa: undefined,
          });
        }
        continue;
      }

      if (typeof item === 'object') {
        const degree = this.cleanStringField(item.degree);
        const institution = this.cleanStringField(item.institution);

        // Skip if both are empty
        if (!degree && !institution) continue;

        // Detect if data is mixed up
        let finalDegree = degree;
        let finalInstitution = institution;

        if (institution && !degree && (
          institution.toLowerCase().includes('bachelor') ||
          institution.toLowerCase().includes('master') ||
          institution.toLowerCase().includes('phd') ||
          institution.toLowerCase().includes('msc') ||
          institution.toLowerCase().includes('bsc')
        )) {
          finalDegree = institution;
          finalInstitution = degree || "";
        }

        fixed.push({
          degree: finalDegree || "",
          field: this.cleanStringField(item.field),
          institution: finalInstitution || "",
          location: item.location ? this.cleanStringField(item.location) : undefined,
          startDate: this.normalizeDate(item.startDate),
          endDate: this.normalizeDate(item.endDate),
          current: Boolean(item.current),
          gpa: item.gpa ? this.cleanStringField(item.gpa) : undefined,
        });
      }
    }

    return fixed;
  }

  /**
   * Fix skills array
   */
  private fixSkillsArray(skills: any): string[] {
    if (typeof skills === 'string') {
      try {
        const parsed = JSON.parse(skills);
        if (Array.isArray(parsed)) {
          return this.fixSkillsArray(parsed);
        }
      } catch {
        // Split by common delimiters
        return skills.split(/[,;\n|]/).map(s => s.trim()).filter(Boolean);
      }
    }

    if (Array.isArray(skills)) {
      return skills
        .map(skill => this.cleanStringField(skill))
        .filter(Boolean);
    }

    return [];
  }

  /**
   * Fix certifications array
   */
  private fixCertificationsArray(certifications: any): any[] {
    const fixed: any[] = [];

    if (typeof certifications === 'string') {
      try {
        const parsed = JSON.parse(certifications);
        if (Array.isArray(parsed)) {
          return this.fixCertificationsArray(parsed);
        }
      } catch {
        // Treat as single certification name
        return [{
          name: this.cleanStringField(certifications),
          issuer: undefined,
          issueDate: undefined,
          expiryDate: undefined,
          credentialId: undefined,
        }];
      }
    }

    if (Array.isArray(certifications)) {
      for (const cert of certifications) {
        if (!cert) continue;

        if (typeof cert === 'string') {
          fixed.push({
            name: this.cleanStringField(cert),
            issuer: undefined,
            issueDate: undefined,
            expiryDate: undefined,
            credentialId: undefined,
          });
        } else if (typeof cert === 'object') {
          fixed.push({
            name: this.cleanStringField(cert.name),
            issuer: cert.issuer ? this.cleanStringField(cert.issuer) : undefined,
            issueDate: this.normalizeDate(cert.issueDate),
            expiryDate: this.normalizeDate(cert.expiryDate),
            credentialId: cert.credentialId ? this.cleanStringField(cert.credentialId) : undefined,
          });
        }
      }
    }

    return fixed;
  }

  /**
   * Fix languages array
   */
  private fixLanguagesArray(languages: any): any[] {
    const fixed: any[] = [];

    if (typeof languages === 'string') {
      try {
        const parsed = JSON.parse(languages);
        if (Array.isArray(parsed)) {
          return this.fixLanguagesArray(parsed);
        }
      } catch {
        return [];
      }
    }

    if (Array.isArray(languages)) {
      for (const lang of languages) {
        if (!lang) continue;

        if (typeof lang === 'string') {
          fixed.push({
            language: this.cleanStringField(lang),
            proficiency: "Basic" as const,
          });
        } else if (typeof lang === 'object') {
          const language = this.cleanStringField(lang.language);
          let proficiency = lang.proficiency;

          // Normalize proficiency
          if (typeof proficiency === 'string') {
            const prof = proficiency.toLowerCase();
            if (prof.includes('native') || prof.includes('c2')) {
              proficiency = "Native";
            } else if (prof.includes('advanced') || prof.includes('c1')) {
              proficiency = "Advanced";
            } else if (prof.includes('intermediate') || prof.includes('b1') || prof.includes('b2')) {
              proficiency = "Intermediate";
            } else {
              proficiency = "Basic";
            }
          } else {
            proficiency = "Basic";
          }

          fixed.push({
            language: language,
            proficiency: proficiency as "Basic" | "Intermediate" | "Advanced" | "Native",
          });
        }
      }
    }

    return fixed;
  }

  /**
   * Fix projects array
   */
  private fixProjectsArray(projects: any): any[] {
    const fixed: any[] = [];

    if (typeof projects === 'string') {
      try {
        const parsed = JSON.parse(projects);
        if (Array.isArray(parsed)) {
          return this.fixProjectsArray(parsed);
        }
      } catch {
        return [];
      }
    }

    if (Array.isArray(projects)) {
      for (const project of projects) {
        if (!project) continue;

        if (typeof project === 'string') {
          fixed.push({
            name: this.cleanStringField(project),
            description: "",
            technologies: [],
            url: undefined,
            startDate: undefined,
            endDate: undefined,
          });
        } else if (typeof project === 'object') {
          const name = this.cleanStringField(project.name);
          const description = this.cleanStringField(project.description);

          // Skip if both name and description are empty
          if (!name && !description) continue;

          fixed.push({
            name: name || "",
            description: description || "",
            technologies: this.parseTechnologiesArray(project.technologies),
            url: project.url ? this.cleanStringField(project.url) : undefined,
            startDate: this.normalizeDate(project.startDate),
            endDate: this.normalizeDate(project.endDate),
          });
        }
      }
    }

    return fixed;
  }

  /**
   * Helper to clean string fields
   */
  private cleanStringField(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    return "";
  }

  /**
   * Parse description array
   */
  private parseDescriptionArray(description: any): string[] {
    if (Array.isArray(description)) {
      return description.map(d => this.cleanStringField(d)).filter(Boolean);
    }
    if (typeof description === 'string') {
      try {
        const parsed = JSON.parse(description);
        if (Array.isArray(parsed)) {
          return this.parseDescriptionArray(parsed);
        }
      } catch {
        // Split by common delimiters
        return description.split(/[.;\n]/).map(d => d.trim()).filter(Boolean);
      }
    }
    return [];
  }

  /**
   * Parse technologies array
   */
  private parseTechnologiesArray(technologies: any): string[] {
    if (Array.isArray(technologies)) {
      return technologies.map(t => this.cleanStringField(t)).filter(Boolean);
    }
    if (typeof technologies === 'string') {
      try {
        const parsed = JSON.parse(technologies);
        if (Array.isArray(parsed)) {
          return this.parseTechnologiesArray(parsed);
        }
      } catch {
        return technologies.split(/[,;\s|]/).map(t => t.trim()).filter(Boolean);
      }
    }
    return [];
  }

  /**
   * Normalize date formats
   */
  private normalizeDate(date: any): string {
    if (!date) return "";

    if (typeof date === 'string') {
      const cleaned = this.cleanStringField(date);

      // Handle various date formats
      const datePatterns = [
        /(\d{4})-(\d{2})/,     // YYYY-MM
        /(\d{2})\/(\d{4})/,   // MM/YYYY
        /(\d{4})\/(\d{2})/,   // YYYY/MM
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i, // Month YYYY
        /\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY
      ];

      for (const pattern of datePatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          return cleaned;
        }
      }

      return cleaned;
    }

    return "";
  }
}