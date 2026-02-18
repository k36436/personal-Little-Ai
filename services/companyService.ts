import { GoogleGenAI } from "@google/genai";
import { LinkedInCompanyInfo } from "../types";

/**
 * Fetches company details using the provided API structure.
 * Note: Replace placeholder URL/Key with actual implementation details.
 */
export const fetchCompanyDetails = async (companyIdOrUrl: string): Promise<LinkedInCompanyInfo> => {
  // This is a template for the API call based on the provided schema
  // In a real scenario, the user would provide the endpoint URL and their rapidapi/custom key.
  const response = await fetch(`https://api.example.com/company?url=${encodeURIComponent(companyIdOrUrl)}`, {
    method: 'GET',
    headers: {
      'X-API-Key': 'YOUR_API_KEY_HERE' // Placeholder
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch company details');
  }

  return await response.json();
};

/**
 * Uses Gemini to provide a strategic analysis of the company data.
 */
export const analyzeCompanyWithGemini = async (companyData: LinkedInCompanyInfo['data']) => {
  // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze this company based on its LinkedIn profile data:
  Name: ${companyData.name}
  Tagline: ${companyData.tagline}
  Description: ${companyData.description}
  Industries: ${companyData.industries.join(', ')}
  Specialties: ${companyData.specialities.join(', ')}
  Staff Count: ${companyData.staffCount}
  Followers: ${companyData.followerCount}
  
  Provide a professional summary including:
  1. Market Position & Value Proposition.
  2. Potential SWOT analysis (Strengths, Weaknesses, Opportunities, Threats).
  3. Recommendation for a strategic partnership or investment pitch.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
  });

  return response.text;
};