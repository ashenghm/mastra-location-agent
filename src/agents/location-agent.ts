import { Agent } from '@mastra/core';
import { z } from 'zod';
import axios from 'axios';

// Location data schema
const LocationSchema = z.object({
  ip: z.string(),
  country: z.string(),
  region: z.string(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  isp: z.string().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

export class LocationAgent extends Agent {
  name = 'LocationAgent';
  description = 'Agent for IP-based geolocation services';

  constructor() {
    super({
      name: 'LocationAgent',
      description: 'Provides location information based on IP addresses',
      instructions: `
        You are a location agent that specializes in IP geolocation.
        You can determine geographic location information from IP addresses.
        Always validate IP addresses before processing.
        Provide accurate and detailed location information including coordinates.
      `,
    });

    // Register tools
    this.registerTool({
      name: 'getLocationFromIP',
      description: 'Get geographic location from IP address',
      parameters: z.object({
        ip: z.string().describe('IP address to geolocate'),
        apiKey: z.string().describe('API key for geolocation service'),
      }),
      execute: this.getLocationFromIP.bind(this),
    });

    this.registerTool({
      name: 'validateIP',
      description: 'Validate if a string is a valid IP address',
      parameters: z.object({
        ip: z.string().describe('IP address to validate'),
      }),
      execute: this.validateIP.bind(this),
    });
  }

  private async getLocationFromIP({ ip, apiKey }: { ip: string; apiKey: string }): Promise<Location> {
    try {
      // Validate IP first
      if (!this.isValidIP(ip)) {
        throw new Error(`Invalid IP address: ${ip}`);
      }

      // Use ipgeolocation.io API
      const response = await axios.get(`https://api.ipgeolocation.io/ipgeo`, {
        params: {
          apiKey,
          ip,
          fields: 'country_name,state_prov,city,latitude,longitude,timezone_name,isp',
        },
        timeout: 10000,
      });

      const data = response.data;

      if (data.message) {
        throw new Error(`Geolocation API error: ${data.message}`);
      }

      return LocationSchema.parse({
        ip,
        country: data.country_name || 'Unknown',
        region: data.state_prov || 'Unknown',
        city: data.city || 'Unknown',
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        timezone: data.timezone_name || 'UTC',
        isp: data.isp,
      });
    } catch (error) {
      console.error('Error getting location from IP:', error);
      throw new Error(`Failed to get location for IP ${ip}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateIP({ ip }: { ip: string }): Promise<boolean> {
    return this.isValidIP(ip);
  }

  private isValidIP(ip: string): boolean {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // Public methods for direct use
  async getLocation(ip: string, apiKey: string): Promise<Location> {
    return this.getLocationFromIP({ ip, apiKey });
  }

  async isValidAddress(ip: string): Promise<boolean> {
    return this.validateIP({ ip });
  }

  // Get location with automatic IP detection fallback
  async getLocationWithFallback(ip?: string, apiKey?: string): Promise<Location | null> {
    if (!apiKey) {
      console.warn('No API key provided for location service');
      return null;
    }

    try {
      // If no IP provided, use a default or detect from request
      const targetIP = ip || '8.8.8.8'; // Fallback to public IP for testing
      return await this.getLocation(targetIP, apiKey);
    } catch (error) {
      console.error('Failed to get location with fallback:', error);
      return null;
    }
  }
}
