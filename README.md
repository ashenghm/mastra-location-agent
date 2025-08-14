# Mastra Location Agent

A powerful location-based services agent built with Mastra framework, GraphQL, and deployed on Cloudflare Workers. This intelligent agent can determine location from IP addresses, provide weather information, and create personalized travel plans.

## 🚀 Features

- **IP Geolocation**: Determine geographic location from IP addresses
- **Weather Services**: Get current weather and forecasts for any location
- **Travel Planning**: Create intelligent travel recommendations and detailed itineraries
- **Workflow Engine**: Execute complex multi-step workflows combining location, weather, and travel services
- **GraphQL API**: Clean, efficient API with queries, mutations, and subscriptions
- **Real-time Updates**: Subscribe to workflow execution updates
- **Cloudflare Workers**: Fast, globally distributed edge computing

## 🏗️ Architecture

The project uses the Mastra framework to create intelligent agents that work together:

- **LocationAgent**: Handles IP geolocation using ipgeolocation.io API
- **WeatherAgent**: Provides weather data using OpenWeatherMap API
- **TravelAgent**: Creates travel plans and recommendations
- **WorkflowEngine**: Orchestrates complex multi-agent workflows

## 📋 Prerequisites

- Node.js 18+ 
- Cloudflare account
- API keys for:
  - [ipgeolocation.io](https://ipgeolocation.io/) (for IP geolocation)
  - [OpenWeatherMap](https://openweathermap.org/api) (for weather data)
  - [OpenAI](https://openai.com/) (optional, for enhanced travel planning)

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
   npx wrangler secret put OPENAI_API_KEY  # Optional
   ```

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

#### Get Current Weather
```graphql
query GetCurrentLocation {
  getCurrentLocation {
    city
    country
    latitude
    longitude
  }
}

query GetWeatherByIP {
  getWeatherByIP {
    location
    temperature
    description
    humidity
    windSpeed
  }
}
```

#### Create Travel Plan
```graphql
mutation CreateTravelPlan {
  createTravelPlan(input: {
    destination: "Paris, France"
    startDate: "2024-06-01"
    endDate: "2024-06-05"
    travelers: 2
    interests: ["culture", "food", "history"]
    budget: "$150-250 per day"
    travelStyle: "comfortable"
  }) {
    id
    destination
    itinerary {
      day
      date
      activities {
        time
        name
        description
        location
      }
      meals {
        time
        type
        restaurant
        cuisine
      }
    }
    recommendations {
      destination
      description
      activities
    }
  }
}
```

#### Execute Workflows
```graphql
# Location workflow
mutation ExecuteLocationWorkflow {
  executeLocationWorkflow(ip: "8.8.8.8") {
    id
    status
    steps {
      name
      status
      duration
    }
    result
  }
}

# Weather workflow
mutation ExecuteWeatherWorkflow {
  executeWeatherWorkflow(ip: "8.8.8.8") {
    id
    status
    steps {
      name
      status
      output
    }
  }
}

# Travel planning workflow
mutation ExecuteTravelPlanningWorkflow {
  executeTravelPlanningWorkflow(
    destination: "Tokyo, Japan"
    startDate: "2024-09-01"
    endDate: "2024-09-07"
  ) {
    id
    status
    steps {
      name
      status
      output
    }
    result
  }
}
```

#### Subscribe to Workflow Updates
```graphql
subscription WorkflowUpdates {
  workflowUpdates(workflowId: "exec_1234567890_abc123") {
    id
    status
    steps {
      name
      status
      duration
    }
    completedAt
  }
}
```

## 🔧 Configuration

### Environment Variables

Set these in your Cloudflare Workers environment:

- `IPGEOLOCATION_API_KEY`: Your ipgeolocation.io API key
- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key  
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
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

## 🏃‍♂️ Development

### Project Structure
```
src/
├── agents/           # Mastra agents
│   ├── location-agent.ts
│   ├── weather-agent.ts
│   └── travel-agent.ts
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

## 📊 Monitoring

The service includes built-in monitoring and health checks:

- **Health endpoint**: `GET /health`
- **Workflow execution tracking**
- **Error logging and handling**
- **Performance monitoring via Cloudflare Analytics**

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
- Check the documentation
- Review example queries in the GraphQL Playground

## 🔮 Future Enhancements

- [ ] Add more travel APIs (hotels, flights, activities)
- [ ] Implement user authentication and saved preferences
- [ ] Add machine learning for personalized recommendations
- [ ] Support for multiple languages
- [ ] Integration with calendar services
- [ ] Mobile app with push notifications
- [ ] Real-time collaboration on travel plans

---

Built with ❤️ using [Mastra](https://mastra.ai), GraphQL, and Cloudflare Workers.
