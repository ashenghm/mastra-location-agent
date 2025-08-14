import { Agent } from '@mastra/core';
import { z } from 'zod';
import axios from 'axios';

// AI 增强的旅行推荐类型
const AITravelRecommendationSchema = z.object({
  destination: z.string(),
  description: z.string(),
  activities: z.array(z.string()),
  bestTimeToVisit: z.string(),
  estimatedBudget: z.string(),
  transportationOptions: z.array(z.string()),
  accommodationSuggestions: z.array(z.string()),
  duration: z.string(),
  aiInsights: z.string().optional(), // AI 生成的深度见解
  personalizedTips: z.array(z.string()).optional(), // 个性化提示
});

// OpenAI API 响应类型
const OpenAIResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
    }),
  })),
});

export type AITravelRecommendation = z.infer<typeof AITravelRecommendationSchema>;

export class AITravelAgent extends Agent {
  name = 'AITravelAgent';
  description = 'AI-powered travel planning agent using OpenAI';

  constructor() {
    super({
      name: 'AITravelAgent',
      description: 'Provides AI-enhanced travel planning and personalized recommendations',
      instructions: `
        You are an AI-powered travel planning agent that creates highly personalized travel experiences.
        You use OpenAI to generate intelligent recommendations, detailed itineraries, and personalized insights.
        Consider user preferences, current events, seasonal factors, and local cultural nuances.
        Provide creative and practical travel advice that goes beyond basic recommendations.
      `,
    });

    // 注册 AI 增强工具
    this.registerTool({
      name: 'generateAITravelRecommendations',
      description: 'Generate AI-powered travel recommendations',
      parameters: z.object({
        location: z.string().describe('Location name or coordinates'),
        interests: z.array(z.string()).describe('User interests and preferences'),
        travelStyle: z.string().optional().describe('Travel style preference'),
        budget: z.string().optional().describe('Budget range'),
        duration: z.string().optional().describe('Trip duration'),
        seasonalFactors: z.string().optional().describe('Seasonal considerations'),
        openaiApiKey: z.string().describe('OpenAI API key'),
      }),
      execute: this.generateAITravelRecommendations.bind(this),
    });

    this.registerTool({
      name: 'generatePersonalizedItinerary',
      description: 'Create personalized daily itinerary using AI',
      parameters: z.object({
        destination: z.string().describe('Destination'),
        startDate: z.string().describe('Start date'),
        endDate: z.string().describe('End date'),
        userProfile: z.object({
          age: z.number().optional(),
          interests: z.array(z.string()),
          travelStyle: z.string(),
          budget: z.string(),
          groupSize: z.number(),
          accessibility: z.string().optional(),
        }).describe('User profile for personalization'),
        openaiApiKey: z.string().describe('OpenAI API key'),
      }),
      execute: this.generatePersonalizedItinerary.bind(this),
    });

    this.registerTool({
      name: 'generateTravelInsights',
      description: 'Generate travel insights and tips using AI',
      parameters: z.object({
        destination: z.string().describe('Destination'),
        currentSeason: z.string().describe('Current season'),
        userInterests: z.array(z.string()).describe('User interests'),
        openaiApiKey: z.string().describe('OpenAI API key'),
      }),
      execute: this.generateTravelInsights.bind(this),
    });
  }

  private async callOpenAI(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini', // 使用较新的模型
        messages: [
          {
            role: 'system',
            content: `You are a professional travel advisor with extensive knowledge of global destinations, 
                     local cultures, seasonal patterns, and travel logistics. Provide detailed, practical, 
                     and personalized travel advice.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
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
      throw new Error(`Failed to generate AI recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateAITravelRecommendations({
    location,
    interests,
    travelStyle,
    budget,
    duration,
    seasonalFactors,
    openaiApiKey
  }: {
    location: string;
    interests: string[];
    travelStyle?: string;
    budget?: string;
    duration?: string;
    seasonalFactors?: string;
    openaiApiKey: string;
  }): Promise<AITravelRecommendation[]> {
    try {
      const prompt = `
Create detailed travel recommendations for ${location} based on the following preferences:

**User Profile:**
- Interests: ${interests.join(', ')}
- Travel Style: ${travelStyle || 'balanced'}
- Budget: ${budget || 'moderate'}
- Duration: ${duration || 'flexible'}
- Seasonal Factors: ${seasonalFactors || 'current season'}

**Please provide:**
1. 3-4 distinct travel recommendations for different aspects of ${location}
2. For each recommendation, include:
   - Specific destination/area name
   - Compelling description (2-3 sentences)
   - 4-5 specific activities tailored to the user's interests
   - Best time to visit considering seasons
   - Realistic budget estimate
   - Transportation options
   - Accommodation suggestions that match the travel style
   - Recommended duration
   - AI insights about hidden gems or local secrets
   - Personalized tips based on the user's interests

**Format as JSON array with this structure:**
[
  {
    "destination": "specific area name",
    "description": "compelling description",
    "activities": ["activity 1", "activity 2", "activity 3", "activity 4"],
    "bestTimeToVisit": "specific timing advice",
    "estimatedBudget": "$X-Y per day",
    "transportationOptions": ["option 1", "option 2", "option 3"],
    "accommodationSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "duration": "X days",
    "aiInsights": "unique insights about this destination",
    "personalizedTips": ["tip 1", "tip 2", "tip 3"]
  }
]

Focus on authentic, local experiences and practical advice.
`;

      const aiResponse = await this.callOpenAI(prompt, openaiApiKey);
      
      // 尝试解析 JSON 响应
      try {
        const recommendations = JSON.parse(aiResponse);
        return recommendations.map((rec: any) => AITravelRecommendationSchema.parse(rec));
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        
        // 如果 JSON 解析失败，创建一个基于文本的推荐
        return [{
          destination: location,
          description: aiResponse.slice(0, 200) + '...',
          activities: this.extractActivitiesFromText(aiResponse),
          bestTimeToVisit: 'Year-round with seasonal considerations',
          estimatedBudget: budget || '$50-150 per day',
          transportationOptions: ['Public transport', 'Walking', 'Taxi/Rideshare'],
          accommodationSuggestions: ['Local hotels', 'Guesthouses', 'Boutique accommodations'],
          duration: duration || '3-5 days',
          aiInsights: aiResponse,
          personalizedTips: this.extractTipsFromText(aiResponse),
        }];
      }
    } catch (error) {
      console.error('Error generating AI travel recommendations:', error);
      throw new Error(`Failed to generate AI recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generatePersonalizedItinerary({
    destination,
    startDate,
    endDate,
    userProfile,
    openaiApiKey
  }: {
    destination: string;
    startDate: string;
    endDate: string;
    userProfile: {
      age?: number;
      interests: string[];
      travelStyle: string;
      budget: string;
      groupSize: number;
      accessibility?: string;
    };
    openaiApiKey: string;
  }): Promise<any> {
    try {
      const prompt = `
Create a detailed day-by-day itinerary for ${destination} from ${startDate} to ${endDate}.

**Traveler Profile:**
- Age: ${userProfile.age || 'not specified'}
- Interests: ${userProfile.interests.join(', ')}
- Travel Style: ${userProfile.travelStyle}
- Budget: ${userProfile.budget}
- Group Size: ${userProfile.groupSize}
- Accessibility Needs: ${userProfile.accessibility || 'none specified'}

**Requirements:**
1. Create a detailed itinerary for each day
2. Include specific times for activities
3. Suggest restaurants for each meal with cuisine types
4. Consider travel time between locations
5. Balance popular attractions with local experiences
6. Account for the user's interests and travel style
7. Include estimated costs for activities
8. Provide transportation suggestions between locations
9. Consider the group size for restaurant reservations and activities

**Format as JSON with this structure:**
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "day theme",
      "activities": [
        {
          "time": "09:00",
          "name": "activity name",
          "description": "detailed description",
          "location": "specific address or area",
          "estimatedCost": "$X per person",
          "duration": "X hours",
          "tips": "personalized tips"
        }
      ],
      "meals": [
        {
          "time": "08:00",
          "type": "Breakfast",
          "restaurant": "restaurant name",
          "cuisine": "cuisine type",
          "estimatedCost": "$X per person",
          "reservationNeeded": true/false
        }
      ],
      "accommodation": "hotel/area suggestion",
      "dailyBudget": "$X per person",
      "transportationNotes": "how to get around today"
    }
  ],
  "generalTips": ["tip 1", "tip 2", "tip 3"],
  "packingRecommendations": ["item 1", "item 2", "item 3"],
  "budgetBreakdown": {
    "accommodation": "$X per night",
    "food": "$X per day",
    "activities": "$X per day",
    "transportation": "$X per day"
  }
}

Make the itinerary practical, engaging, and tailored to the user's profile.
`;

      const aiResponse = await this.callOpenAI(prompt, openaiApiKey);
      
      try {
        return JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Failed to parse itinerary JSON:', parseError);
        throw new Error('Failed to parse AI-generated itinerary');
      }
    } catch (error) {
      console.error('Error generating personalized itinerary:', error);
      throw new Error(`Failed to generate personalized itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateTravelInsights({
    destination,
    currentSeason,
    userInterests,
    openaiApiKey
  }: {
    destination: string;
    currentSeason: string;
    userInterests: string[];
    openaiApiKey: string;
  }): Promise<{
    insights: string;
    hiddenGems: string[];
    localTips: string[];
    culturalNotes: string[];
    seasonalAdvice: string;
  }> {
    try {
      const prompt = `
Provide expert travel insights for ${destination} during ${currentSeason} for someone interested in ${userInterests.join(', ')}.

**Please provide:**
1. **General Insights**: 2-3 paragraphs about what makes ${destination} special during ${currentSeason}
2. **Hidden Gems**: 5 lesser-known places or experiences that locals recommend
3. **Local Tips**: 5 practical tips that only locals would know
4. **Cultural Notes**: 3-4 important cultural considerations for visitors
5. **Seasonal Advice**: Specific advice for visiting during ${currentSeason}

**Focus on:**
- Authentic local experiences
- Practical, actionable advice
- Cultural sensitivity
- Current conditions and events
- User interests: ${userInterests.join(', ')}

**Format as JSON:**
{
  "insights": "detailed insights text",
  "hiddenGems": ["gem 1", "gem 2", "gem 3", "gem 4", "gem 5"],
  "localTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "culturalNotes": ["note 1", "note 2", "note 3", "note 4"],
  "seasonalAdvice": "specific seasonal advice"
}
`;

      const aiResponse = await this.callOpenAI(prompt, openaiApiKey);
      
      try {
        return JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Failed to parse insights JSON:', parseError);
        return {
          insights: aiResponse,
          hiddenGems: this.extractListFromText(aiResponse, 'hidden'),
          localTips: this.extractListFromText(aiResponse, 'tip'),
          culturalNotes: this.extractListFromText(aiResponse, 'cultural'),
          seasonalAdvice: this.extractSeasonalAdvice(aiResponse),
        };
      }
    } catch (error) {
      console.error('Error generating travel insights:', error);
      throw new Error(`Failed to generate travel insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 辅助方法：从文本中提取活动
  private extractActivitiesFromText(text: string): string[] {
    const activities = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('visit') || line.includes('explore') || line.includes('try') || line.includes('experience')) {
        const cleaned = line.replace(/^\W+/, '').replace(/\W+$/, '');
        if (cleaned.length > 10 && cleaned.length < 100) {
          activities.push(cleaned);
        }
      }
    }
    
    return activities.slice(0, 5);
  }

  // 辅助方法：从文本中提取提示
  private extractTipsFromText(text: string): string[] {
    const tips = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('tip') || line.includes('recommend') || line.includes('suggest') || line.includes('advice')) {
        const cleaned = line.replace(/^\W+/, '').replace(/\W+$/, '');
        if (cleaned.length > 15 && cleaned.length < 150) {
          tips.push(cleaned);
        }
      }
    }
    
    return tips.slice(0, 3);
  }

  // 辅助方法：从文本中提取列表
  private extractListFromText(text: string, keyword: string): string[] {
    const items = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        const cleaned = line.replace(/^\W+/, '').replace(/\W+$/, '');
        if (cleaned.length > 10 && cleaned.length < 200) {
          items.push(cleaned);
        }
      }
    }
    
    return items.slice(0, 5);
  }

  // 辅助方法：提取季节性建议
  private extractSeasonalAdvice(text: string): string {
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('season') || line.toLowerCase().includes('weather') || line.toLowerCase().includes('climate')) {
        return line.replace(/^\W+/, '').replace(/\W+$/, '');
      }
    }
    
    return 'Consider seasonal weather patterns when planning your visit.';
  }

  // 公共方法
  async getAIRecommendations(
    location: string,
    interests: string[],
    travelStyle?: string,
    budget?: string,
    duration?: string,
    openaiApiKey?: string
  ): Promise<AITravelRecommendation[]> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for AI-powered recommendations');
    }

    return this.generateAITravelRecommendations({
      location,
      interests,
      travelStyle,
      budget,
      duration,
      openaiApiKey
    });
  }

  async createPersonalizedItinerary(
    destination: string,
    startDate: string,
    endDate: string,
    userProfile: any,
    openaiApiKey?: string
  ): Promise<any> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for personalized itinerary generation');
    }

    return this.generatePersonalizedItinerary({
      destination,
      startDate,
      endDate,
      userProfile,
      openaiApiKey
    });
  }

  async getDestinationInsights(
    destination: string,
    currentSeason: string,
    userInterests: string[],
    openaiApiKey?: string
  ): Promise<any> {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for destination insights');
    }

    return this.generateTravelInsights({
      destination,
      currentSeason,
      userInterests,
      openaiApiKey
    });
  }
}
