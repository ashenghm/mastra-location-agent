# Mastra Location Agent

A powerful IP geolocation service built with Mastra framework, GraphQL, and deployed on Cloudflare Workers. This intelligent agent can determine location from IP addresses and provide **AI-powered location insights** and analysis.

## 🚀 Features

- **IP Geolocation**: Determine geographic location from IP addresses
- **🤖 AI-Powered Location Insights**: Enhanced with OpenAI for comprehensive location analysis
- **Location Analysis**: Demographics, culture, economy, attractions, and safety information
- **Risk Assessment**: AI-powered risk analysis for any location
- **Nearby Places**: Discover interesting places near any location
- **Location Comparison**: Compare multiple locations across various criteria
- **Workflow Engine**: Execute complex multi-step location analysis workflows
- **GraphQL API**: Clean, efficient API with queries, mutations, and subscriptions
- **Real-time Updates**: Subscribe to workflow execution updates
- **Cloudflare Workers**: Fast, globally distributed edge computing

## 🏗️ Architecture

The project uses the Mastra framework to create intelligent agents:

- **LocationAgent**: Handles IP geolocation using ipgeolocation.io API
- **🆕 AILocationAgent**: AI-enhanced location analysis using OpenAI GPT-4
- **WorkflowEngine**: Orchestrates complex location analysis workflows

## 📋 Prerequisites

- Node.js 18+ 
- Cloudflare account
- API keys for:
  - [ipgeolocation.io](https://ipgeolocation.io/) (for IP geolocation)
  - [OpenAI](https://openai.com/) (for AI-powered location insights) 🔑

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
The AI Location Agent uses **GPT-4o-mini** for:
- **Location Demographics**: Population, languages, cultural information
- **Economic Analysis**: Industries, business environment, economic conditions
- **Cultural Insights**: Traditions, customs, local attractions
- **Risk Assessment**: Safety analysis, natural disasters, travel advisories
- **Location Comparison**: Multi-criteria location analysis

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

#### Get Current Location
```graphql
query GetCurrentLocation {
  getCurrentLocation {
    city
    country
    latitude
    longitude
    timezone
  }
}
```

#### Get AI-Powered Location Insights
```graphql
query GetLocationInsights {
  getLocationInsights(ip: "8.8.8.8", purpose: "tourism") {
    location {
      city
      country
      latitude
      longitude
    }
    insights {
      demographics
      economy
      culture
      attractions
      climate
      livingCosts
      safetyInfo
      localTips
    }
    nearbyPlaces {
      name
      type
      distance
      description
    }
    recommendations
    riskAssessment {
      overall
      naturalDisasters
      crimeSafety
      healthRisks
      travelAdvisory
    }
  }
}
```

#### Get Risk Analysis
```graphql
query GetRiskAnalysis {
  getRiskAnalysis(city: "Tokyo", country: "Japan")
}
```

#### Find Nearby Places
```graphql
query GetNearbyPlaces {
  getNearbyPlaces(
    city: "Paris"
    country: "France"
    radius: "100km"
    categories: ["attractions", "natural sites", "cities"]
  ) {
    name
    type
    distance
    description
  }
}
```

#### Compare Locations
```graphql
query CompareLocations {
  compareLocations(
    locations: [
      { city: "Tokyo", country: "Japan" }
      { city: "Seoul", country: "South Korea" }
      { city: "Singapore", country: "Singapore" }
    ]
    criteria: ["cost of living", "safety", "culture", "climate"]
  ) {
    summary
    locations {
      name
      scores {
        costOfLiving
        safety
        culture
        climate
      }
      pros
      cons
      bestFor
    }
    recommendations {
      budget
      safety
      culture
      overall
    }
  }
}
```

#### Execute Location Analysis Workflow
```graphql
mutation ExecuteLocationAnalysisWorkflow {
  executeLocationAnalysisWorkflow(
    ip: "8.8.8.8"
    purpose: "business"
  ) {
    id
    status
    steps {
      name
      status
      duration
      output
    }
    result
  }
}
```

### Subscribe to Workflow Updates
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

- `IPGEOLOCATION_API_KEY`: Your ipgeolocation.io API key 🔑 **Required**
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

3. **Set up KV namespace for caching**:
   ```bash
   wrangler kv:namespace create "CACHE"
   ```

4. **Set API keys**:
   ```bash
   # Required for basic functionality
   wrangler secret put IPGEOLOCATION_API_KEY
   
   # Required for AI features 🤖
   wrangler secret put OPENAI_API_KEY
   ```

## 💰 Cost Considerations

### OpenAI API Costs
- **GPT-4o-mini**: ~$0.150 per 1M input tokens, ~$0.600 per 1M output tokens
- **Typical location analysis**: Uses ~1,500-3,000 tokens (~$0.0005-0.002 per request)
- **Budget estimate**: $5-15/month for moderate usage

### Optimization Tips
- Responses are cached when possible
- Rate limiting prevents excessive API calls
- Efficient prompt engineering minimizes token usage

## 📊 Monitoring

The service includes built-in monitoring and health checks:

- **Health endpoint**: `GET /health` - Service status and API key configuration
- **Documentation endpoint**: `GET /docs` - API documentation and examples
- **Workflow execution tracking**: Real-time workflow status
- **Error logging and handling**: Comprehensive error tracking

## 🏃‍♂️ Development

### Project Structure
```
src/
├── agents/           # Mastra agents
│   ├── location-agent.ts      # Basic IP geolocation
│   └── ai-location-agent.ts   # 🆕 AI-powered location analysis
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

### AI Features Availability

Check if AI features are enabled:

```bash
# Check service status
curl https://your-worker-domain.workers.dev/health
```

Response will show:
```json
{
  "services": {
    "aiLocationAgent": "operational"  // or "disabled (no API key)"
  },
  "apiKeys": {
    "openAI": "configured"  // or "missing"
  }
}
```

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

- [ ] **Enhanced Geocoding**: Support for address-to-coordinates conversion
- [ ] **Real-time Events**: Integration with news and events APIs
- [ ] **Business Intelligence**: Company and business location analysis
- [ ] **Multi-language Support**: AI responses in multiple languages
- [ ] **Historical Analysis**: Temporal analysis of location changes
- [ ] **Mobile SDK**: Native mobile app integration
- [ ] **Batch Processing**: Bulk location analysis capabilities
- [ ] **Custom AI Models**: Fine-tuned models for specific use cases

---

Built with ❤️ using [Mastra](https://mastra.ai), GraphQL, OpenAI, and Cloudflare Workers.

## 🔗 Quick Links

- **GraphQL Playground**: `https://your-domain.workers.dev/`
- **API Documentation**: `https://your-domain.workers.dev/docs`
- **Health Check**: `https://your-domain.workers.dev/health`
- **GitHub Repository**: `https://github.com/ashenghm/mastra-location-agent`
