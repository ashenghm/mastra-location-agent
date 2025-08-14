import { LocationAgent } from '../agents/location-agent';
import { AILocationAgent } from '../agents/ai-location-agent';
import { Env } from '../index';

export interface GraphQLContext extends Env {
  locationAgent: LocationAgent;
  aiLocationAgent: AILocationAgent;
  clientIP?: string;
}

export function createContext(
  request: Request, 
  agents: {
    locationAgent: LocationAgent;
    aiLocationAgent: AILocationAgent;
  }
): Partial<GraphQLContext> {
  // Extract client IP from various headers
  const clientIP = 
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    request.headers.get('X-Real-IP') ||
    request.headers.get('X-Client-IP') ||
    '127.0.0.1';

  return {
    ...agents,
    clientIP,
  };
}
