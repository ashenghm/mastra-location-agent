import { Agent } from '@mastra/core';
import { z } from 'zod';
import axios from 'axios';

// Weather data schema
const WeatherSchema = z.object({
  location: z.string(),
  temperature: z.number(),
  description: z.string(),
  humidity: z.number(),
  windSpeed: z.number(),
  windDirection: z.number(),
  pressure: z.number(),
  uvIndex: z.number().optional(),
  visibility: z.number().optional(),
  icon: z.string(),
  lastUpdated: z.string(),
});

const WeatherForecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  description: z.string(),
  icon: z.string(),
  precipitation: z.number(),
});

export type Weather = z.infer<typeof WeatherSchema>;
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

export class WeatherAgent extends Agent {
  name = 'WeatherAgent';
  description = 'Agent for weather information and forecasts';

  constructor() {
    super({
      name: 'WeatherAgent',
      description: 'Provides current weather conditions and forecasts',
      instructions: `
        You are a weather agent that provides accurate weather information.
        You can get current weather and forecasts for any location.
        Always include temperature, humidity, wind, and conditions.
        Provide weather data in a user-friendly format.
      `,
    });

    // Register tools
    this.registerTool({
      name: 'getCurrentWeather',
      description: 'Get current weather conditions for a location',
      parameters: z.object({
        latitude: z.number().describe('Latitude coordinate'),
        longitude: z.number().describe('Longitude coordinate'),
        apiKey: z.string().describe('OpenWeatherMap API key'),
      }),
      execute: this.getCurrentWeather.bind(this),
    });

    this.registerTool({
      name: 'getWeatherByCity',
      description: 'Get current weather by city name',
      parameters: z.object({
        city: z.string().describe('City name'),
        country: z.string().optional().describe('Country code'),
        apiKey: z.string().describe('OpenWeatherMap API key'),
      }),
      execute: this.getWeatherByCity.bind(this),
    });

    this.registerTool({
      name: 'getWeatherForecast',
      description: 'Get 5-day weather forecast',
      parameters: z.object({
        latitude: z.number().describe('Latitude coordinate'),
        longitude: z.number().describe('Longitude coordinate'),
        apiKey: z.string().describe('OpenWeatherMap API key'),
      }),
      execute: this.getWeatherForecast.bind(this),
    });
  }

  private async getCurrentWeather({ 
    latitude, 
    longitude, 
    apiKey 
  }: { 
    latitude: number; 
    longitude: number; 
    apiKey: string; 
  }): Promise<Weather> {
    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric', // Use Celsius
        },
        timeout: 10000,
      });

      const data = response.data;

      return WeatherSchema.parse({
        location: `${data.name}, ${data.sys.country}`,
        temperature: Math.round(data.main.temp * 10) / 10,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        pressure: data.main.pressure,
        uvIndex: data.uvi,
        visibility: data.visibility ? data.visibility / 1000 : undefined, // Convert to km
        icon: data.weather[0].icon,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting current weather:', error);
      throw new Error(`Failed to get weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getWeatherByCity({ 
    city, 
    country, 
    apiKey 
  }: { 
    city: string; 
    country?: string; 
    apiKey: string; 
  }): Promise<Weather> {
    try {
      const query = country ? `${city},${country}` : city;
      
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: query,
          appid: apiKey,
          units: 'metric',
        },
        timeout: 10000,
      });

      const data = response.data;

      return WeatherSchema.parse({
        location: `${data.name}, ${data.sys.country}`,
        temperature: Math.round(data.main.temp * 10) / 10,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        pressure: data.main.pressure,
        uvIndex: data.uvi,
        visibility: data.visibility ? data.visibility / 1000 : undefined,
        icon: data.weather[0].icon,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting weather by city:', error);
      throw new Error(`Failed to get weather for ${city}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getWeatherForecast({ 
    latitude, 
    longitude, 
    apiKey 
  }: { 
    latitude: number; 
    longitude: number; 
    apiKey: string; 
  }): Promise<WeatherForecast[]> {
    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric',
        },
        timeout: 10000,
      });

      const data = response.data;
      const forecasts: WeatherForecast[] = [];
      
      // Group by date and get daily summary
      const dailyData: { [key: string]: any[] } = {};
      
      data.list.forEach((item: any) => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(item);
      });

      // Create daily forecasts
      Object.entries(dailyData).slice(0, 5).forEach(([date, items]) => {
        const temps = items.map(item => item.main.temp);
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        
        // Use midday weather for description and icon
        const middayWeather = items.find(item => 
          item.dt_txt.includes('12:00:00')
        ) || items[Math.floor(items.length / 2)];

        const precipitation = items.reduce((sum, item) => 
          sum + (item.rain?.['3h'] || item.snow?.['3h'] || 0), 0
        );

        forecasts.push(WeatherForecastSchema.parse({
          date,
          maxTemp: Math.round(maxTemp * 10) / 10,
          minTemp: Math.round(minTemp * 10) / 10,
          description: middayWeather.weather[0].description,
          icon: middayWeather.weather[0].icon,
          precipitation: Math.round(precipitation * 10) / 10,
        }));
      });

      return forecasts;
    } catch (error) {
      console.error('Error getting weather forecast:', error);
      throw new Error(`Failed to get weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Public methods for direct use
  async getWeather(latitude: number, longitude: number, apiKey: string): Promise<Weather> {
    return this.getCurrentWeather({ latitude, longitude, apiKey });
  }

  async getWeatherByCityName(city: string, country: string | undefined, apiKey: string): Promise<Weather> {
    return this.getWeatherByCity({ city, country, apiKey });
  }

  async getForecast(latitude: number, longitude: number, apiKey: string): Promise<WeatherForecast[]> {
    return this.getWeatherForecast({ latitude, longitude, apiKey });
  }

  // Get weather with fallback handling
  async getWeatherWithFallback(
    latitude?: number, 
    longitude?: number, 
    city?: string, 
    country?: string,
    apiKey?: string
  ): Promise<Weather | null> {
    if (!apiKey) {
      console.warn('No API key provided for weather service');
      return null;
    }

    try {
      if (latitude !== undefined && longitude !== undefined) {
        return await this.getWeather(latitude, longitude, apiKey);
      } else if (city) {
        return await this.getWeatherByCityName(city, country, apiKey);
      } else {
        console.warn('Insufficient location data for weather query');
        return null;
      }
    } catch (error) {
      console.error('Failed to get weather with fallback:', error);
      return null;
    }
  }
}
