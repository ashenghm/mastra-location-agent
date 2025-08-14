import { Agent } from '@mastra/core';
import { z } from 'zod';
import axios from 'axios';

// Travel data schemas
const TravelRecommendationSchema = z.object({
  destination: z.string(),
  description: z.string(),
  activities: z.array(z.string()),
  bestTimeToVisit: z.string(),
  estimatedBudget: z.string(),
  transportationOptions: z.array(z.string()),
  accommodationSuggestions: z.array(z.string()),
  duration: z.string(),
});

const ActivitySchema = z.object({
  time: z.string(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
  estimatedCost: z.string().optional(),
  duration: z.string(),
});

const MealSchema = z.object({
  time: z.string(),
  type: z.string(),
  restaurant: z.string(),
  cuisine: z.string(),
  estimatedCost: z.string().optional(),
});

const ItineraryItemSchema = z.object({
  day: z.number(),
  date: z.string(),
  activities: z.array(ActivitySchema),
  meals: z.array(MealSchema),
  accommodation: z.string().optional(),
});

const TravelPlanSchema = z.object({
  id: z.string(),
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  itinerary: z.array(ItineraryItemSchema),
  totalBudget: z.string(),
  weatherForecast: z.array(z.object({
    date: z.string(),
    maxTemp: z.number(),
    minTemp: z.number(),
    description: z.string(),
    icon: z.string(),
    precipitation: z.number(),
  })),
  recommendations: z.array(TravelRecommendationSchema),
  createdAt: z.string(),
});

const TravelPlanInputSchema = z.object({
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.string().optional(),
  travelers: z.number(),
  interests: z.array(z.string()),
  travelStyle: z.string().optional(),
});

export type TravelRecommendation = z.infer<typeof TravelRecommendationSchema>;
export type TravelPlan = z.infer<typeof TravelPlanSchema>;
export type TravelPlanInput = z.infer<typeof TravelPlanInputSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Meal = z.infer<typeof MealSchema>;
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;

export class TravelAgent extends Agent {
  name = 'TravelAgent';
  description = 'Agent for travel planning and recommendations';
  private travelPlans: Map<string, TravelPlan> = new Map();

  constructor() {
    super({
      name: 'TravelAgent',
      description: 'Provides intelligent travel planning and recommendations',
      instructions: `
        You are a travel planning agent that creates personalized travel experiences.
        You can generate travel recommendations, create detailed itineraries, and suggest activities.
        Consider user preferences, budget, travel dates, and local conditions.
        Provide practical and actionable travel advice.
      `,
    });

    // Register tools
    this.registerTool({
      name: 'generateTravelRecommendations',
      description: 'Generate travel recommendations based on location and interests',
      parameters: z.object({
        latitude: z.number().describe('Latitude coordinate'),
        longitude: z.number().describe('Longitude coordinate'),
        interests: z.array(z.string()).describe('User interests and preferences'),
        budget: z.string().optional().describe('Budget range'),
        duration: z.string().optional().describe('Trip duration'),
      }),
      execute: this.generateTravelRecommendations.bind(this),
    });

    this.registerTool({
      name: 'createTravelPlan',
      description: 'Create a detailed travel plan with itinerary',
      parameters: TravelPlanInputSchema,
      execute: this.createTravelPlan.bind(this),
    });

    this.registerTool({
      name: 'generateItinerary',
      description: 'Generate detailed daily itinerary for a destination',
      parameters: z.object({
        destination: z.string().describe('Destination city/location'),
        startDate: z.string().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().describe('End date (YYYY-MM-DD)'),
        interests: z.array(z.string()).describe('User interests'),
        budget: z.string().optional().describe('Budget range'),
        travelStyle: z.string().optional().describe('Travel style preference'),
      }),
      execute: this.generateItinerary.bind(this),
    });
  }

  private async generateTravelRecommendations({
    latitude,
    longitude,
    interests,
    budget,
    duration
  }: {
    latitude: number;
    longitude: number;
    interests: string[];
    budget?: string;
    duration?: string;
  }): Promise<TravelRecommendation[]> {
    try {
      // This would typically use a travel API or AI service
      // For now, we'll generate recommendations based on location and interests
      const recommendations: TravelRecommendation[] = [];

      // Sample recommendation based on interests
      if (interests.includes('culture') || interests.includes('history')) {
        recommendations.push({
          destination: 'Local Cultural District',
          description: 'Explore the rich cultural heritage and historical landmarks in the area',
          activities: [
            'Visit local museums',
            'Take a historical walking tour',
            'Explore traditional markets',
            'Attend cultural performances'
          ],
          bestTimeToVisit: 'Year-round, best in spring and fall',
          estimatedBudget: budget || '$50-100 per day',
          transportationOptions: ['Walking', 'Public transit', 'Taxi/rideshare'],
          accommodationSuggestions: ['Boutique hotels', 'Cultural guesthouses', 'Historic B&Bs'],
          duration: duration || '2-3 days'
        });
      }

      if (interests.includes('nature') || interests.includes('outdoor')) {
        recommendations.push({
          destination: 'Nearby Natural Areas',
          description: 'Discover beautiful natural landscapes and outdoor activities',
          activities: [
            'Hiking trails',
            'Nature photography',
            'Bird watching',
            'Scenic viewpoints'
          ],
          bestTimeToVisit: 'Spring through fall for best weather',
          estimatedBudget: budget || '$30-70 per day',
          transportationOptions: ['Car rental', 'Tour bus', 'Bicycle'],
          accommodationSuggestions: ['Eco-lodges', 'Camping', 'Nature resorts'],
          duration: duration || '1-2 days'
        });
      }

      if (interests.includes('food') || interests.includes('cuisine')) {
        recommendations.push({
          destination: 'Local Food Scene',
          description: 'Experience the local culinary culture and specialties',
          activities: [
            'Food tours',
            'Cooking classes',
            'Local market visits',
            'Restaurant hopping'
          ],
          bestTimeToVisit: 'Year-round',
          estimatedBudget: budget || '$40-80 per day',
          transportationOptions: ['Walking', 'Food tour transport', 'Public transit'],
          accommodationSuggestions: ['City center hotels', 'Food-focused B&Bs'],
          duration: duration || '1-2 days'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating travel recommendations:', error);
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createTravelPlan(input: TravelPlanInput): Promise<TravelPlan> {
    try {
      const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate itinerary
      const itinerary = await this.generateItinerary({
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate,
        interests: input.interests,
        budget: input.budget,
        travelStyle: input.travelStyle,
      });

      // Generate recommendations
      // For simplicity, using mock coordinates - in real implementation, 
      // you'd geocode the destination
      const recommendations = await this.generateTravelRecommendations({
        latitude: 0, // Mock coordinates
        longitude: 0,
        interests: input.interests,
        budget: input.budget,
        duration: this.calculateDuration(input.startDate, input.endDate),
      });

      const travelPlan: TravelPlan = {
        id: planId,
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate,
        itinerary,
        totalBudget: input.budget || 'Budget not specified',
        weatherForecast: [], // Would be populated by weather agent
        recommendations,
        createdAt: new Date().toISOString(),
      };

      // Store the travel plan
      this.travelPlans.set(planId, travelPlan);

      return travelPlan;
    } catch (error) {
      console.error('Error creating travel plan:', error);
      throw new Error(`Failed to create travel plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateItinerary({
    destination,
    startDate,
    endDate,
    interests,
    budget,
    travelStyle
  }: {
    destination: string;
    startDate: string;
    endDate: string;
    interests: string[];
    budget?: string;
    travelStyle?: string;
  }): Promise<ItineraryItem[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const itinerary: ItineraryItem[] = [];

      for (let day = 1; day <= days; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + day - 1);
        
        const activities: Activity[] = [];
        const meals: Meal[] = [];

        // Generate activities based on interests and day
        if (day === 1) {
          // Arrival day - lighter schedule
          activities.push({
            time: '14:00',
            name: 'Check-in and City Orientation',
            description: 'Arrive at accommodation and get oriented with the city',
            location: destination,
            duration: '2 hours',
            estimatedCost: 'Free'
          });

          activities.push({
            time: '16:30',
            name: 'Welcome Walk',
            description: 'Take a leisurely walk around the neighborhood',
            location: `Central ${destination}`,
            duration: '1.5 hours',
            estimatedCost: 'Free'
          });
        } else if (day === days) {
          // Departure day
          activities.push({
            time: '10:00',
            name: 'Last-minute Shopping',
            description: 'Pick up souvenirs and local specialties',
            location: `${destination} Shopping District`,
            duration: '2 hours',
            estimatedCost: budget ? 'Within budget' : '$20-50'
          });
        } else {
          // Full days - generate based on interests
          let morningActivity = 'City Tour';
          let afternoonActivity = 'Local Experience';
          
          if (interests.includes('culture')) {
            morningActivity = 'Museum and Cultural Sites Visit';
            afternoonActivity = 'Traditional Craft Workshop';
          } else if (interests.includes('nature')) {
            morningActivity = 'Nature Hike';
            afternoonActivity = 'Scenic Photography Tour';
          } else if (interests.includes('food')) {
            morningActivity = 'Food Market Tour';
            afternoonActivity = 'Cooking Class';
          }

          activities.push({
            time: '09:00',
            name: morningActivity,
            description: `Explore ${destination}'s ${morningActivity.toLowerCase()}`,
            location: destination,
            duration: '3 hours',
            estimatedCost: budget ? 'Within budget' : '$15-30'
          });

          activities.push({
            time: '14:00',
            name: afternoonActivity,
            description: `Participate in ${afternoonActivity.toLowerCase()}`,
            location: destination,
            duration: '2.5 hours',
            estimatedCost: budget ? 'Within budget' : '$25-45'
          });
        }

        // Generate meals
        meals.push({
          time: '08:00',
          type: 'Breakfast',
          restaurant: 'Local Café',
          cuisine: 'Local',
          estimatedCost: '$8-15'
        });

        meals.push({
          time: '12:30',
          type: 'Lunch',
          restaurant: 'Traditional Restaurant',
          cuisine: 'Regional',
          estimatedCost: '$12-25'
        });

        meals.push({
          time: '19:00',
          type: 'Dinner',
          restaurant: interests.includes('food') ? 'Fine Dining' : 'Local Favorite',
          cuisine: 'Local Specialty',
          estimatedCost: '$20-40'
        });

        itinerary.push({
          day,
          date: currentDate.toISOString().split('T')[0],
          activities,
          meals,
          accommodation: day === days ? undefined : `${destination} Hotel/Guesthouse`
        });
      }

      return itinerary;
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw new Error(`Failed to generate itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  // Public methods for direct use
  async getRecommendations(
    latitude: number, 
    longitude: number, 
    interests: string[],
    budget?: string,
    duration?: string
  ): Promise<TravelRecommendation[]> {
    return this.generateTravelRecommendations({ latitude, longitude, interests, budget, duration });
  }

  async createPlan(input: TravelPlanInput): Promise<TravelPlan> {
    return this.createTravelPlan(input);
  }

  async getTravelPlan(id: string): Promise<TravelPlan | null> {
    return this.travelPlans.get(id) || null;
  }

  async getAllTravelPlans(): Promise<TravelPlan[]> {
    return Array.from(this.travelPlans.values());
  }

  async updateTravelPlan(id: string, input: TravelPlanInput): Promise<TravelPlan | null> {
    const existingPlan = this.travelPlans.get(id);
    if (!existingPlan) {
      return null;
    }

    // Create updated plan
    const updatedPlan = await this.createTravelPlan(input);
    updatedPlan.id = id; // Keep the same ID
    updatedPlan.createdAt = existingPlan.createdAt; // Keep original creation date

    this.travelPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteTravelPlan(id: string): Promise<boolean> {
    return this.travelPlans.delete(id);
  }
}
