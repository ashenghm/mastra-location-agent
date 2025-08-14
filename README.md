# Mastra Location Agent

A powerful location-based services agent built with Mastra framework, GraphQL, and deployed on Cloudflare Workers. This intelligent agent can determine location from IP addresses, provide weather information, and create personalized travel plans using **AI-powered recommendations**.

## 🚀 Features

- **IP Geolocation**: Determine geographic location from IP addresses
- **Weather Services**: Get current weather and forecasts for any location
- **Travel Planning**: Create intelligent travel recommendations and detailed itineraries
- **🤖 AI-Powered Travel Agent**: Enhanced with OpenAI for personalized recommendations
- **Workflow Engine**: Execute complex multi-step workflows combining location, weather, and travel services
- **GraphQL API**: Clean, efficient API with queries, mutations, and subscriptions
- **Real-time Updates**: Subscribe to workflow execution updates
- **Cloudflare Workers**: Fast, globally distributed edge computing

## 🏗️ Architecture

The project uses the Mastra framework to create intelligent agents that work together:

- **LocationAgent**: Handles IP geolocation using ipgeolocation.io API
- **WeatherAgent**: Provides weather data using OpenWeatherMap API
- **TravelAgent**: Creates travel plans and recommendations
- **🆕 AITravelAgent**: AI-enhanced travel planning using OpenAI GPT-4
- **WorkflowEngine**: Orchestrates complex multi-agent workflows

## 📋 Prerequisites

- Node.js 18+ 
- Cloudflare account
- API keys for:
  - [ipgeolocation.io](https://ipgeolocation.io/) (for IP geolocation)
  - [OpenWeatherMap](https://openweathermap.org/api) (for weather data)
  - [OpenAI](https://openai.com/) (for AI-powered travel planning) 🔑

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ashenghm/mastra-location-agent.git
   cd mastra-location-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Set your API keys as Cloudflare Workers secrets
   npx wrangler secret put IPGEOLOCATION_API_KEY
   npx wrangler secret put OPENWEATHER_API_KEY
   npx wrangler secret put OPENAI_API_KEY  # 🔑 Required for AI features
   ```

## 🔑 OpenAI Configuration

### Getting OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Create a new API key
5. Set it as a Cloudflare Workers secret:
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   ```

### OpenAI Usage & Features
The AI Travel Agent uses **GPT-4o-mini** for:
- **Intelligent Recommendations**: Context-aware travel suggestions
- **Personalized Itineraries**: Detailed day-by-day plans based on user preferences
- **Cultural Insights**: Local tips and hidden gems
- **Budget Optimization**: Smart budget allocation and cost estimates
- **Seasonal Advice**: Weather-aware activity recommendations

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run deploy
```

The service will be available at your Cloudflare Workers domain.

## 📖 API Usage

### GraphQL Playground

Visit your deployed URL to access the GraphQL Playground where you can explore the API interactively.

### Example Queries

#### Get Location from IP
```graphql
query GetLocationFromIP {
  getLocationFromIP(ip: "8.8.8.8") {
    ip
    country
    region
    city
    latitude
    longitude
    timezone
  }
}
```

#### Get AI-Powered Travel Recommendations
```graphql
query GetAITravelRecommendations {
  getAITravelRecommendations(
    location: "Tokyo, Japan"
    interests: ["culture", "food", "technology"]
    travelStyle: "comfortable"
    budget: "$150-300 per day"
    duration: "5 days"
  ) {
    destination
    description
    activities
    aiInsights
    personalizedTips
    bestTimeToVisit
    estimatedBudget
  }
}
```

#### Create AI-Enhanced Travel Plan
```graphql
mutation CreateAITravelPlan {
  createAITravelPlan(
    input: {
      destination: "Paris, France"
      startDate: "2024-06-01"
      endDate: "2024-06-05"
      travelers: 2
      interests: ["culture", "food", "history"]
      budget: "$150-250 per day"
      travelStyle: "comfortable"
      useAI: true
    }
    userProfile: {
      age: 30
      interests: ["culture", "food", "history"]
      travelStyle: "comfortable"
      budget: "$150-250 per day"
      groupSize: 2
    }
  ) {
    id
    destination
    aiRecommendations {
      destination
      description
      activities
      aiInsights
      personalizedTips
    }
    personalizedItinerary {
      itinerary {
        day
        date
        theme
        activities {
          time
          name
          description
          tips
        }
      }
      generalTips
      packingRecommendations
      budgetBreakdown {
        accommodation
        food
        activities
        transportation
      }
    }
    travelInsights {
      insights
      hiddenGems
      localTips
      culturalNotes
      seasonalAdvice
    }
  }
}
```

#### Generate Personalized Itinerary
```graphql
query GeneratePersonalizedItinerary {
  generatePersonalizedItinerary(
    destination: "Barcelona, Spain"
    startDate: "2024-07-15"
    endDate: "2024-07-20"
    userProfile: {
      age: 28
      interests: ["architecture", "food", "nightlife"]
      travelStyle: "adventurous"
      budget: "$100-180 per day"
      groupSize: 2
    }
  ) {
    itinerary {
      day
      date
      theme
      activities {
        time
        name
        description
        location
        estimatedCost
        tips
      }
      meals {
        time
        type
        restaurant
        cuisine
        reservationNeeded
      }
      dailyBudget
      transportationNotes
    }
    generalTips
    packingRecommendations
    budgetBreakdown {
      accommodation
      food
      activities
      transportation
    }
  }
}
```

### AI Features Availability

The AI features are automatically enabled when you provide an OpenAI API key. Check feature availability:

```bash
# Check service status
curl https://your-worker-domain.workers.dev/health
```

Response will show:
```json
{
  "services": {
    "aiTravelAgent": "operational"  // or "disabled (no API key)"
  },
  "apiKeys": {
    "openAI": "configured"  // or "missing"
  }
}
```

## 🔧 Configuration

### Environment Variables

Set these in your Cloudflare Workers environment:

- `IPGEOLOCATION_API_KEY`: Your ipgeolocation.io API key
- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key  
- `OPENAI_API_KEY`: Your OpenAI API key 🔑 **Required for AI features**
- `ENVIRONMENT`: `production` or `development`

### Cloudflare Workers Setup

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Configure wrangler.toml** (already included in the project)

4. **Set up KV namespace for caching**:
   ```bash
   wrangler kv:namespace create "CACHE"
   ```

5. **Set API keys**:
   ```bash
   # Required for basic functionality
   wrangler secret put IPGEOLOCATION_API_KEY
   wrangler secret put OPENWEATHER_API_KEY
   
   # Required for AI features 🤖
   wrangler secret put OPENAI_API_KEY
   ```

## 🏃‍♂️ Development

### Project Structure
```
src/
├── agents/           # Mastra agents
│   ├── location-agent.ts
│   ├── weather-agent.ts
│   ├── travel-agent.ts
│   └── ai-travel-agent.ts  # 🆕 AI-powered agent
├── graphql/          # GraphQL setup
│   ├── schema.ts
│   ├── resolvers.ts
│   └── context.ts
├── workflows/        # Workflow engine
│   └── workflow-engine.ts
└── index.ts          # Main entry point
```

### Local Development
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test
```

## 💰 Cost Considerations

### OpenAI API Costs
- **GPT-4o-mini**: ~$0.150 per 1M input tokens, ~$0.600 per 1M output tokens
- **Typical travel plan**: Uses ~2,000-5,000 tokens (~$0.001-0.003 per request)
- **Budget estimate**: $10-20/month for moderate usage

### Optimization Tips
- Responses are cached when possible
- AI features are optional (set `useAI: false` to skip)
- Rate limiting prevents excessive API calls

## 📊 Monitoring

The service includes built-in monitoring and health checks:

- **Health endpoint**: `GET /health` - Service status and API key configuration
- **Documentation endpoint**: `GET /docs` - API documentation and examples
- **Workflow execution tracking**: Real-time workflow status
- **Error logging and handling**: Comprehensive error tracking
- **Performance monitoring**: Via Cloudflare Analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Create an issue on GitHub
- Check the documentation at `/docs` endpoint
- Review example queries in the GraphQL Playground

## 🔮 Future Enhancements

- [ ] **Enhanced AI Models**: Support for GPT-4 and specialized travel models
- [ ] **Multi-language Support**: AI responses in multiple languages
- [ ] **Real-time Travel Updates**: Flight delays, weather alerts, local events
- [ ] **Social Integration**: Share travel plans and get community recommendations
- [ ] **Booking Integration**: Direct booking for hotels, flights, and activities
- [ ] **Mobile App**: Native iOS/Android apps with offline capabilities
- [ ] **Voice Interface**: AI-powered voice travel assistant
- [ ] **Photo Recognition**: AI-powered landmark and food identification
- [ ] **Sustainable Travel**: Carbon footprint tracking and eco-friendly recommendations
- [ ] **Local Guide Matching**: Connect with verified local guides

## 🎯 AI Roadmap

- [ ] **Advanced Personalization**: Learning from user feedback and preferences
- [ ] **Predictive Analytics**: Anticipate travel needs and preferences
- [ ] **Dynamic Pricing**: Real-time budget optimization
- [ ] **Cultural AI**: Deeper cultural insights and etiquette guidance
- [ ] **Emergency AI**: AI-powered emergency assistance and crisis management

---

Built with ❤️ using [Mastra](https://mastra.ai), GraphQL, OpenAI, and Cloudflare Workers.

## 🔗 Quick Links

- **GraphQL Playground**: `https://your-domain.workers.dev/`
- **API Documentation**: `https://your-domain.workers.dev/docs`
- **Health Check**: `https://your-domain.workers.dev/health`
- **GitHub Repository**: `https://github.com/ashenghm/mastra-location-agent`
