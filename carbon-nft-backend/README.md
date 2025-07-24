# Carbon NFT Backend

Backend service for the Carbon NFT platform that handles smart contract compilation and IPFS metadata uploads.

## Features

- ✅ Smart contract compilation using Solidity compiler
- ✅ IPFS metadata upload via Pinata
- ✅ CORS-enabled API for frontend integration
- ✅ Environment-based configuration
- ✅ Railway deployment ready

## API Endpoints

### Health Check
```
GET /api/health
```

### Contract Compilation
```
POST /api/compile
Content-Type: application/json

{
  "sourceCode": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n..."
}
```

### IPFS Upload
```
POST /api/ipfs/upload
Content-Type: application/json

{
  "carbonCreditDataList": [
    {
      "serialNumber": "CC001",
      "projectName": "Forest Conservation",
      "country": "Brazil",
      "methodology": "REDD+",
      "vintage": "2023",
      "volume": "1 tCO2e"
    }
  ]
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

## Local Development

```bash
npm install
npm run dev
```

## Railway Deployment

1. Create a new Railway project
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard:
   - `PINATA_API_KEY`
   - `PINATA_SECRET_KEY`
   - `FRONTEND_URL` (your deployed frontend URL)
4. Deploy automatically via GitHub integration

## Security

- API keys stored securely in environment variables
- CORS properly configured for frontend domain
- Helmet.js for security headers
- Input validation on all endpoints