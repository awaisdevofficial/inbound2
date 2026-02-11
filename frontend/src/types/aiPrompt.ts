export type AgentPromptProfile = {
  companyName: string;
  companyAddress: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  
  businessIndustry: string;
  businessDescription: string;
  
  agentPurpose: string;
  callType: "Sales" | "Support" | "Booking" | "Billing" | "Complaint" | "Mixed";
  
  targetAudience: string;
  callGoal: "Book Appointment" | "Close Sale" | "Qualify Lead" | "Collect Information" | "Support Resolution";
  
  services: string[];
  pricingInfo?: string;
  businessHours?: string;
  
  bookingMethod?: string;
  appointmentRules?: string;
  escalationProcess?: string;
  
  requiredCustomerFields: string[];
  faqs: string[];
  objections: string[];
  policies: string[];
  
  tone: "Friendly" | "Professional" | "Empathetic" | "Energetic" | "Strict";
  languages?: string[];
};

export type DocumentExtractionResult = {
  extractedProfile: Partial<AgentPromptProfile>;
  missingFields: string[];
};

export type PromptGenerationResult = {
  status: "ready" | "needs_clarification";
  clarificationQuestions: string[];
  finalPrompt: string;
};

export type CompanyDocument = {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  extracted_text: string | null;
  extracted_profile: Partial<AgentPromptProfile> | null;
  missing_fields: string[];
  created_at: string;
  updated_at: string;
};
