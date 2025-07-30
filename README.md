# ChatPM - AI-Powered Project Management Platform

ChatPM is a modern, AI-powered project management platform that combines intelligent project management with seamless collaboration. Built with Next.js 15, React 19, and TypeScript, it features an intuitive interface designed to help teams reduce project delivery time by 40% through AI-powered insights and automated workflows.

## 🚀 Features

### Core Functionality
- **AI-Powered Conversations**: Context-aware AI chat that understands your projects and provides intelligent suggestions
- **Real-Time Collaboration**: Seamless team collaboration across multiple workspaces with live updates
- **Smart Scheduling**: Intelligent calendar integration with conflict detection and optimal meeting suggestions
- **Advanced Analytics**: Comprehensive insights into team performance, project velocity, and resource utilization
- **Goal Tracking & OKRs**: Set, track, and achieve team objectives with automated progress updates
- **Enterprise Security**: Bank-level security with end-to-end encryption, SSO integration, and compliance

### User Interface
- **Modern Dashboard**: Clean, intuitive interface with project overview, deadlines, and recent activity
- **Dual Sidebar Layout**: Left sidebar for navigation and workspaces, right sidebar for additional features
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Mode**: Built-in theme support with Tailwind CSS

### Project Management
- **Project Overview**: Visual project cards with progress tracking and team member avatars
- **Task Management**: Create, assign, and track tasks with priority levels and deadlines
- **Team Collaboration**: Real-time activity feed and team member management
- **File Management**: Integrated file sharing and storage capabilities

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives with custom components
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Date Handling**: date-fns
- **Package Manager**: pnpm

## 🏗️ Project Structure

```
chatpm/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main dashboard application
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── chat.tsx          # AI chat interface
│   ├── home.tsx          # Dashboard home view
│   ├── landing-page.tsx  # Marketing landing page
│   ├── sidebar-left.tsx  # Left navigation sidebar
│   └── sidebar-right.tsx # Right feature sidebar
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── public/               # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chatpm
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📱 Usage

### Landing Page
- Visit the root URL to see the marketing landing page
- Features pricing plans, testimonials, and feature overview

### Dashboard
- Navigate to `/dashboard` to access the main application
- Use the left sidebar to navigate between different sections
- Access AI chat functionality through the "Ask AI" option
- Manage projects, view deadlines, and track team activity

### AI Chat
- Integrated AI assistant for project management queries
- Context-aware responses based on your projects and tasks
- Available throughout the application via the bottom chat input

## 🎨 Customization

The application uses a component-based architecture with:
- **Tailwind CSS** for styling with custom design tokens
- **Radix UI** primitives for accessible components
- **Custom UI components** in `components/ui/`
- **Theme support** with CSS variables for colors and spacing

## 🔧 Development

### Available Scripts
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For internal contributions, please follow the established code style and component patterns.

---

**ChatPM** - Transform your team's productivity with AI-powered project management.
