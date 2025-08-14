import { Agent } from '@mastra/core';
import { z } from 'zod';
import axios from 'axios';

// Location insights schema
const LocationInsightsSchema = z.object({
  demographics: z.string(),
  economy: z.string(),
  culture: z.string(),
  attractions: z.array(z.string()),
  climate: z.string(),
  livingCosts: z.string(),
  safetyInfo: z.string(),
  localTips: z.array(z.string()),
  bestTimeToVisit: z.string(),
  transportation: z.array(z.string()),
});

const NearbyPlaceSchema = z.object({
  name: z.string(),
  type: z.string(),
  distance: z.string(),
  description: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

const LocationAnalysisSchema = z.object({
  location: z.object({
    city: z.string(),
    country: z.string(),
    region: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }),
  insights: LocationInsightsSchema,
  nearbyPlaces: z.array(NearbyPlaceSchema),
  recommendations: z.array(z.string()),
  riskAssessment: z.object({
    overall: z.string(),
    naturalDisasters: z.string(),
    crimeSafety: z.string(),
    healthRisks: z.string(),
    travelAdvisory: z.string(),
  }),
});

// OpenAI API response schema
const OpenAIResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
    }),
  })),
});

export type LocationInsights = z.infer<typeof LocationInsightsSchema>;
export type NearbyPlace = z.infer<typeof NearbyPlaceSchema>;
export type LocationAnalysis = z.infer<typeof LocationAnalysisSchema>;

export class AILocationAgent extends Agent {
  name = 'AILocationAgent';
  description = 'AI-powered location analysis and insights agent';

  constructor() {
    super({
      name: 'AILocationAgent',
      description: 'Provides AI-enhanced location analysis, insights, and recommendations',
      instructions: `
        You are an AI location analysis agent that provides comprehensive insights about geographic locations.
        You can analyze locations for demographics, culture, attractions, safety, economy, and practical information.
        Provide accurate, up-to-date, and culturally sensitive information about any location worldwide.
        Focus on practical insights that would be valuable for visitors, residents, or business purposes.
      `,
    });

    // Register AI-powered tools
    this.registerTool({
      name: 'generateLocationInsights',
      description: 'Generate comprehensive AI-powered location insights',
      parameters: z.object({
        city: z.string().describe('City name'),
        country: z.string().describe('Country name'),
        region: z.string().optional().describe('Region or state'),
        latitude: z.number().describe('Latitude coordinate'),
        longitude: z.number().describe('Longitude coordinate'),
        purpose: z.enum(['tourism', 'business', 'relocation', 'general']).optional().describe('Analysis purpose'),
        openaiApiKey: z.string().describe('OpenAI API key'),
      }),
      execute: this.generateLocationInsights.bind(this),
    });

    this.registerTool({
      name: 'analyzeLocationRisks',
      description: 'Analyze location-specific risks and safety information',
      parameters: z.object({
        city: z.string().describe('City name'),
        country: z.string().describe('Country name'),
        openaiApiKey: z.string().describe('OpenAI API key'),
      }),
      execute: this.analyzeLocationRisks.bind(this),
    });

    this.registerTool({
      name: 'findNearbyPlaces',
      description: 'Find and describe nearby places of interest',
      parameters: z.object({
        city: z.string().describe('City name'),
        country: z.string().describe('Country name'),
        radius: z.string().optional().describe('Search radius (e.g., "50km", "100 miles")'),
        categories: z.array(z.string()).optional().describe('Categories of places to find'),
        openaiApiKey: z.string().describe('OpenAI API key'),
      }),
      execute: this.findNearbyPlaces.bind(this),
    });

    this.registerTool({
      name: 'generateLocationComparison',
      description: 'Compare multiple locations across various factors',
      parameters: z.object({
        locations: z.array(z.object({
          city: z.string(),
          country: z.string(),
        })).describe('Locations to compare'),
        criteria: z.array(z.string()).optional().describe('Comparison criteria'),
        openaiApiKey: z.string().describe('OpenAI API key'),
      }),
      execute: this.generateLocationComparison.bind(this),
    });
  }

  private async callOpenAI(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional location analyst and geographic information specialist with extensive knowledge of:
                     - Global demographics and cultural patterns
                     - Economic conditions and business environments
                     - Tourist attractions and local points of interest
                     - Safety conditions and risk factors
                     - Climate patterns and living conditions
                     - Transportation and infrastructure
                     - Local customs and practical tips for visitors
                     
                     Provide accurate, balanced, and culturally sensitive information. Always include practical details
                     that would be valuable for someone visiting or learning about the location.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const openAIResponse = OpenAIResponseSchema.parse(response.data);
      return openAIResponse.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (error.response?.status === 429) {
          throw new Error('OpenAI API rate limit exceeded');
        }
      }
      throw new Error(`Failed to generate location insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateLocationInsights({
    city,
    country,
    region,
    latitude,
    longitude,
    purpose = 'general',
    openaiApiKey
  }: {
    city: string;
    country: string;
    region?: string;
    latitude: number;
    longitude: number;
    purpose?: 'tourism' | 'business' | 'relocation' | 'general';
    openaiApiKey: string;
  }): Promise<LocationAnalysis> {
    try {
      const locationName = region ? `${city}, ${region}, ${country}` : `${city}, ${country}`;
      
      const prompt = `
Provide a comprehensive analysis of ${locationName} (${latitude}, ${longitude}) for ${purpose} purposes.

**Please provide detailed information in the following categories:**

1. **Demographics**: Population size, age distribution, ethnic composition, languages spoken
2. **Economy**: Major industries, economic conditions, employment opportunities, business environment
3. **Culture**: Cultural highlights, traditions, festivals, arts scene, local customs
4. **Attractions**: Top 5-8 must-see attractions, landmarks, museums, natural sites
5. **Climate**: Weather patterns, seasons, best times to visit, temperature ranges
6. **Living Costs**: Cost of accommodation, food, transportation, general expenses
7. **Safety**: General safety level, common risks, areas to avoid, emergency contacts
8. **Local Tips**: 5-7 practical tips for visitors, cultural etiquette, useful phrases
9. **Transportation**: Available transport options, getting around, accessibility
10. **Nearby Places**: Interesting places within 50-100km radius

**Risk Assessment:**
- Overall risk level (Low/Medium/High)
- Natural disaster risks
- Crime and safety concerns
- Health risks and medical facilities
- Current travel advisories

**Format as JSON:**
{
  "location": {
    "city": "${city}",
    "country": "${country}",
    "region": "${region || ''}",
    "latitude": ${latitude},
    "longitude": ${longitude},
    "timezone": "estimated timezone"
  },
  "insights": {
    "demographics": "detailed demographics info",
    "economy": "economic overview",
    "culture": "cultural information",
    "attractions": ["attraction 1", "attraction 2", "attraction 3", "attraction 4", "attraction 5"],
    "climate": "climate description",
    "livingCosts": "cost information",
    "safetyInfo": "safety overview",
    "localTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
    "bestTimeToVisit": "optimal timing",
    "transportation": ["option 1", "option 2", "option 3"]
  },
  "nearbyPlaces": [
    {
      "name": "place name",
      "type": "attraction/city/natural site",
      "distance": "X km",
      "description": "brief description"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "riskAssessment": {
    "overall": "Low/Medium/High",
    "naturalDisasters": "risk description",
    "crimeSafety": "safety level",
    "healthRisks": "health considerations",
    "travelAdvisory": "current status"
  }
}

Provide accurate, current information and be objective about both positive and negative aspects.
`;

      const aiResponse = await this.callOpenAI(prompt, openaiApiKey);
      
      try {
        const analysis = JSON.parse(aiResponse);
        return LocationAnalysisSchema.parse(analysis);
      } catch (parseError) {
        console.error('Failed to parse location analysis JSON:', parseError);
        
        // Fallback: create structured response from text
        return {
          location: {
            city,
            country,
            region: region || '',
            latitude,
            longitude,
            timezone: 'Unknown',
          },
          insights: {
            demographics: this.extractSectionFromText(aiResponse, 'demographics') || 'Information not available',
            economy: this.extractSectionFromText(aiResponse, 'economy') || 'Information not available',
            culture: this.extractSectionFromText(aiResponse, 'culture') || 'Information not available',
            attractions: this.extractListFromText(aiResponse, 'attraction') || ['Local attractions available'],
            climate: this.extractSectionFromText(aiResponse, 'climate') || 'Varied climate conditions',
            livingCosts: this.extractSectionFromText(aiResponse, 'cost') || 'Cost information varies',
            safetyInfo: this.extractSectionFromText(aiResponse, 'safety') || 'General safety precautions advised',
            localTips: this.extractListFromText(aiResponse, 'tip') || ['Research local customs', 'Learn basic phrases'],
            bestTimeToVisit: 'Year-round with seasonal considerations',
            transportation: ['Public transport', 'Taxi/rideshare', 'Walking'],
          },
          nearbyPlaces: this.extractNearbyPlaces(aiResponse) || [],
          recommendations: this.extractListFromText(aiResponse, 'recommend') || ['Explore local culture', 'Try local cuisine'],
          riskAssessment: {
            overall: 'Medium',
            naturalDisasters: 'Standard precautions advised',
            crimeSafety: 'Exercise normal safety measures',
            healthRisks: 'Standard health precautions',
            travelAdvisory: 'Check current travel advisories',
          },
        };
      }
    } catch (error) {
      console.error('Error generating location insights:', error);
      throw new Error(`Failed to generate insights for ${city}, ${country}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeLocationRisks({
    city,
    country,
    openaiApiKey
  }: {
    city: string;
    country: string;
    openaiApiKey: string;
  }): Promise<any> {
    try {
      const prompt = `
Provide a detailed risk analysis for ${city}, ${country}.

**Analyze the following risk categories:**

1. **Natural Disasters**: Earthquakes, floods, hurricanes, volcanic activity, etc.
2. **Crime and Safety**: Crime rates, common risks, safe/unsafe areas
3. **Health Risks**: Disease outbreaks, air quality, water safety, medical facilities
4. **Political Stability**: Government stability, civil unrest, protests
5. **Transportation Safety**: Road conditions, public transport safety, traffic
6. **Economic Risks**: Currency stability, economic conditions affecting visitors
7. **Environmental Hazards**: Pollution, extreme weather, natural hazards

**For each category, provide:**
- Current risk level (Low/Medium/High/Very High)
- Specific risks and concerns
- Mitigation strategies
- Emergency contacts and procedures where relevant

**Format as JSON:**
{
  "overall": "Low/Medium/High",
  "categories": {
    "naturalDisasters": {
      "level": "Low/Medium/High",
      "risks": ["risk 1", "risk 2"],
      "mitigation": ["strategy 1", "strategy 2"]
    },
    "crimeSafety": {
      "level": "Low/Medium/High",
      "risks": ["risk 1", "risk 2"],
      "mitigation": ["strategy 1", "strategy 2"]
    },
    "healthRisks": {
      "level": "Low/Medium/High",
      "risks": ["risk 1", "risk 2"],
      "mitigation": ["strategy 1", "strategy 2"]
    }
  },
  "emergencyContacts": {
    "police": "local emergency number",
    "medical": "medical emergency number",
    "embassy": "relevant embassy contact"
  },
  "lastUpdated": "current date"
}

Be objective and factual. Include current information about any ongoing situations.
`;

      const aiResponse = await this.callOpenAI(prompt, openaiApiKey);
      
      try {
        return JSON.parse(aiResponse);
      } catch (parseError) {
        return {
          overall: 'Medium',
          summary: aiResponse,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
    } catch (error) {
      console.error('Error analyzing location risks:', error);
      throw new Error(`Failed to analyze risks for ${city}, ${country}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findNearbyPlaces({
    city,
    country,
    radius = '50km',
    categories = ['attractions', 'cities', 'natural sites'],
    openaiApiKey
  }: {
    city: string;
    country: string;
    radius?: string;
    categories?: string[];
    openaiApiKey: string;
  }): Promise<NearbyPlace[]> {
    try {
      const prompt = `
Find interesting places near ${city}, ${country} within a ${radius} radius.

**Categories to include:** ${categories.join(', ')}

**For each place, provide:**
- Name of the place
- Type/category (attraction, city, natural site, historical site, etc.)
- Approximate distance from ${city}
- Brief description (2-3 sentences)
- Why it's worth visiting

**Focus on:**
- Tourist attractions and landmarks
- Nearby cities and towns
- Natural sites (parks, beaches, mountains, etc.)
- Historical and cultural sites
- Unique local experiences

**Format as JSON array:**
[
  {
    "name": "place name",
    "type": "attraction/city/natural site/historical site",
    "distance": "X km from ${city}",
    "description": "Detailed description of the place and why it's worth visiting"
  }
]

Provide 8-12 notable places, prioritizing those most interesting to visitors.
`;

      const aiResponse = await this.callOpenAI(prompt, openaiApiKey);
      
      try {
        const places = JSON.parse(aiResponse);
        return places.map((place: any) => NearbyPlaceSchema.parse(place));
      } catch (parseError) {
        return this.extractNearbyPlaces(aiResponse) || [];
      }
    } catch (error) {
      console.error('Error finding nearby places:', error);
      throw new Error(`Failed to find nearby places for ${city}, ${country}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateLocationComparison({
    locations,
    criteria = ['cost of living', 'safety', 'culture', 'climate', 'attractions'],
    openaiApiKey
  }: {
    locations: Array<{ city: string; country: string }>;
    criteria?: string[];
    openaiApiKey: string;
  }): Promise<any> {
    try {
      const locationNames = locations.map(loc => `${loc.city}, ${loc.country}`).join(' vs ');
      
      const prompt = `
Compare the following locations: ${locationNames}

**Comparison criteria:** ${criteria.join(', ')}

**For each location, analyze:**
1. Cost of living (accommodation, food, transportation)
2. Safety and security levels
3. Cultural attractions and experiences
4. Climate and weather patterns
5. Main tourist attractions
6. Quality of life factors
7. Accessibility and transportation
8. Unique characteristics

**Provide:**
- Side-by-side comparison
- Pros and cons for each location
- Best choice for different types of visitors (budget travelers, families, business, etc.)
- Overall recommendation

**Format as JSON:**
{
  "summary": "brief comparison overview",
  "locations": [
    {
      "name": "City, Country",
      "scores": {
        "costOfLiving": "Low/Medium/High",
        "safety": "Low/Medium/High",
        "culture": "rating/description",
        "climate": "rating/description",
        "attractions": "rating/description"
      },
      "pros": ["pro 1", "pro 2", "pro 3"],
      "cons": ["con 1", "con 2", "con 3"],
      "bestFor": ["type of visitor 1", "type of visitor 2"]
    }
  ],
  "recommendations": {
    "budget": "best location for budget travelers",
    "luxury": "best location for luxury travel",
    "culture": "best location for cultural experiences",
    "safety": "safest location",
    "overall": "best overall choice and why"
  }
}

Be objective and provide balanced comparisons based on factual information.
`;

      const aiResponse = await this.callOpenAI(prompt, openaiApiKey);
      
      try {
        return JSON.parse(aiResponse);
      } catch (parseError) {
        return {
          summary: aiResponse,
          locations: locations.map(loc => ({
            name: `${loc.city}, ${loc.country}`,
            analysis: 'Detailed comparison available in summary'
          }))
        };
      }
    } catch (error) {
      console.error('Error generating location comparison:', error);
      throw new Error(`Failed to compare locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods for text parsing
  private extractSectionFromText(text: string, keyword: string): string | null {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        // Return the next few lines that contain content
        const content = [];
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim() && !lines[j].includes(':')) {
            content.push(lines[j].trim());
          }
        }
        return content.join(' ');
      }
    }
    return null;
  }

  private extractListFromText(text: string, keyword: string): string[] | null {
    const items: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase()) && 
          (line.includes('-') || line.includes('•') || line.includes('*'))) {
        const cleaned = line.replace(/^[-•*\s]+/, '').trim();
        if (cleaned.length > 5) {
          items.push(cleaned);
        }
      }
    }
    
    return items.length > 0 ? items.slice(0, 8) : null;
  }

  private extractNearbyPlaces(text: string): NearbyPlace[] | null {
    const places: NearbyPlace[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if ((line.includes('km') || line.includes('mile')) && line.length > 20) {
        const cleaned = line.replace(/^[-•*\s]+/, '').trim();
        const parts = cleaned.split('-');
        if (parts.length >= 2) {
          places.push({
            name: parts[0].trim(),
            type: 'attraction',
            distance: '~50km',
            description: parts.slice(1).join('-').trim()
          });
        }
      }
    }
    
    return places.length > 0 ? places.slice(0, 6) : null;
  }

  // Public methods
  async getLocationInsights(
    city: string,
    country: string,
    region: string | undefined,
    latitude: number,
    longitude: number,
    purpose: 'tourism' | 'business' | 'relocation' | 'general' = 'general',
    openaiApiKey?: string
  ): Promise<LocationAnalysis> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for location insights');
    }

    return this.generateLocationInsights({
      city,
      country,
      region,
      latitude,
      longitude,
      purpose,
      openaiApiKey
    });
  }

  async getRiskAnalysis(
    city: string,
    country: string,
    openaiApiKey?: string
  ): Promise<any> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for risk analysis');
    }

    return this.analyzeLocationRisks({ city, country, openaiApiKey });
  }

  async getNearbyPlaces(
    city: string,
    country: string,
    radius?: string,
    categories?: string[],
    openaiApiKey?: string
  ): Promise<NearbyPlace[]> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for nearby places search');
    }

    return this.findNearbyPlaces({ city, country, radius, categories, openaiApiKey });
  }

  async compareLocations(
    locations: Array<{ city: string; country: string }>,
    criteria?: string[],
    openaiApiKey?: string
  ): Promise<any> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for location comparison');
    }

    return this.generateLocationComparison({ locations, criteria, openaiApiKey });
  }
}
