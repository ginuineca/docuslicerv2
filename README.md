# DocuSlicer

A modern PDF workflow automation platform built with React, Node.js, and TypeScript.

## 🚀 Features

- **PDF Processing**: Extract, convert, merge, and split PDFs
- **Workflow Automation**: Create custom workflows for document processing
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Secure**: Enterprise-grade security with Supabase authentication
- **Scalable**: Built with modern architecture and best practices

## 🏗️ Architecture

This is a monorepo containing:

- **`apps/web`**: React frontend with Vite
- **`apps/api`**: Node.js/Express backend API
- **`packages/shared`**: Shared utilities and types

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- Supabase for database and auth
- Stripe for payments
- PDF processing libraries

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ginuineca/docuslicerv2.git
cd docuslicerv2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit the .env files with your configuration
```

4. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🚀 Deployment

### DigitalOcean App Platform

This project is configured for deployment on DigitalOcean App Platform:

1. Connect your GitHub repository
2. Configure build settings:
   - **Web Service**: `apps/web` (React app)
   - **API Service**: `apps/api` (Node.js API)
3. Set environment variables
4. Deploy!

### Manual Deployment

```bash
# Build all apps
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
docuslicerv2/
├── apps/
│   ├── web/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── lib/
│   │   └── package.json
│   └── api/                 # Node.js backend
│       ├── src/
│       └── package.json
├── packages/
│   └── shared/              # Shared utilities
├── package.json             # Root package.json
└── README.md
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:web          # Start only frontend
npm run dev:api          # Start only backend

# Building
npm run build            # Build all apps
npm run build:web        # Build frontend only
npm run build:api        # Build backend only

# Testing
npm test                 # Run tests for all apps
npm run lint             # Lint all apps
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.
