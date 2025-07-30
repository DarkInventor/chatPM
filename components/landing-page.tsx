"use client"

import * as React from "react"
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  MessageSquare,
  Users,
  Star,
  Shield,
  Sparkles,
  Command,
  Mail,
  Play,
  BarChart3,
  Target,
  Zap,
  Clock,
  Globe,
  Menu,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

interface TestimonialProps {
  name: string
  role: string
  company: string
  content: string
  initials: string
}

interface PricingPlanProps {
  name: string
  description: string
  price: string
  period?: string
  popular?: boolean
  features: string[]
  ctaText: string
  ctaVariant?: "default" | "outline"
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

// Testimonial Component
function TestimonialCard({ name, role, company, content, initials }: TestimonialProps) {
  return (
    <Card className="h-full">
      <CardContent className="pt-6 h-full flex flex-col">
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <blockquote className="text-sm mb-6 flex-grow leading-relaxed">
          &ldquo;{content}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3 mt-auto">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">{initials}</span>
          </div>
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{role}, {company}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Pricing Plan Component
function PricingCard({ name, description, price, period, popular, features, ctaText, ctaVariant = "outline" }: PricingPlanProps) {
  return (
    <Card className={`relative ${popular ? 'border-primary shadow-lg' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="px-3">Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
        <div className="mt-6">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground ml-1">{period}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <Button variant={popular ? "default" : ctaVariant} className="w-full mb-6">
          {ctaText}
        </Button>
        <ul className="space-y-3 text-sm">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Command className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xl font-semibold">ChatPM</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
              >
                Pricing
              </a>
              <a 
                href="#testimonials" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
              >
                Reviews
              </a>
            </div>
            
            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
              <Button size="sm">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border bg-background">
              <div className="flex flex-col space-y-4">
                <a 
                  href="#features" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#testimonials" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reviews
                </a>
                <div className="flex flex-col gap-2 px-2 pt-2">
                  <Button variant="ghost" size="sm" className="justify-center">
                    Sign In
                  </Button>
                  <Button size="sm" className="justify-center">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 animate-in fade-in duration-700">
              <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
              AI-Powered Project Management
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Transform Your Team&rsquo;s
              <span className="text-primary block sm:inline"> Productivity</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              ChatPM combines intelligent project management with seamless collaboration. 
              Reduce project delivery time by 40% with AI-powered insights and automated workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <Button size="lg" className="min-w-[200px] text-base font-semibold">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="min-w-[200px] text-base">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to manage projects efficiently
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Powerful features designed to help teams collaborate effectively, reduce overhead, and deliver results 40% faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={MessageSquare}
              title="AI-Powered Conversations"
              description="Context-aware AI chat that understands your projects and provides intelligent suggestions. Get instant answers, automate routine decisions, and accelerate problem-solving."
            />

            <FeatureCard
              icon={Users}
              title="Real-Time Collaboration"
              description="Seamlessly work with your team across multiple workspaces. Share files, assign tasks, track progress, and maintain alignment with live updates and notifications."
            />

            <FeatureCard
              icon={Calendar}
              title="Smart Scheduling"
              description="Intelligent calendar integration with conflict detection and optimal meeting suggestions. Manage deadlines, set reminders, and never miss important milestones."
            />

            <FeatureCard
              icon={BarChart3}
              title="Advanced Analytics"
              description="Comprehensive insights into team performance, project velocity, and resource utilization. Make data-driven decisions with beautiful visualizations and custom reports."
            />

            <FeatureCard
              icon={Target}
              title="Goal Tracking & OKRs"
              description="Set, track, and achieve team objectives with automated progress updates. Maintain focus on key results with clear visibility into individual and team achievements."
            />

            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="Bank-level security with end-to-end encryption, SSO integration, RBAC permissions, and compliance with SOC 2, GDPR, and industry standards."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-12">Trusted by teams worldwide</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2" aria-label="15,000 plus active teams">15K+</div>
                <div className="text-sm text-muted-foreground">Active Teams</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2" aria-label="99.9 percent uptime">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2" aria-label="100 million plus tasks completed">100M+</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2" aria-label="40 percent faster project delivery">40%</div>
                <div className="text-sm text-muted-foreground">Faster Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Loved by product teams everywhere
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              See how ChatPM is transforming project management for teams of all sizes across industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              name="Sarah Johnson"
              role="Product Manager"
              company="TechCorp"
              initials="SJ"
              content="ChatPM has revolutionized how our team collaborates. The AI features are incredibly helpful for project planning, and we've reduced our delivery time by 35%. The intelligent insights help us make better decisions faster."
            />

            <TestimonialCard
              name="Mike Chen"
              role="Engineering Lead"
              company="StartupXYZ"
              initials="MC"
              content="The interface is clean and intuitive. We've seen a 40% increase in productivity since switching to ChatPM. The automated workflows and smart notifications keep everyone aligned without overwhelming us."
            />

            <TestimonialCard
              name="Alex Rodriguez"
              role="Creative Director"
              company="Agency Co"
              initials="AR"
              content="Best project management tool we've used. The AI suggestions have saved us countless hours of planning and resource allocation. Our team can now focus on creative work instead of administrative tasks."
            />

            <TestimonialCard
              name="Emily Watson"
              role="Operations Director"
              company="ScaleUp Inc"
              initials="EW"
              content="ChatPM scales beautifully with our growing team. The enterprise features, security, and comprehensive analytics give us complete visibility into our operations while maintaining simplicity."
            />

            <TestimonialCard
              name="David Kim"
              role="CTO"
              company="InnovateLab"
              initials="DK"
              content="The integration capabilities are outstanding. ChatPM seamlessly connects with our existing tools, and the API allows us to customize workflows perfectly for our unique requirements."
            />

            <TestimonialCard
              name="Lisa Parker"
              role="Project Manager"
              company="ConsultPro"
              initials="LP"
              content="Managing multiple client projects has never been easier. The workspace organization and client collaboration features help us deliver exceptional results while maintaining complete transparency."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Choose the plan that works best for your team. Start with a 14-day free trial on any plan. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Starter"
              description="Perfect for small teams getting started with project management"
              price="$12"
              period="/user/month"
              ctaText="Start Free Trial"
              ctaVariant="outline"
              features={[
                "Up to 10 team members",
                "5 active projects",
                "Basic AI chat assistant",
                "Email support",
                "Mobile apps",
                "Basic integrations",
                "2GB storage per user"
              ]}
            />

            <PricingCard
              name="Professional"
              description="Best for growing teams and established businesses"
              price="$24"
              period="/user/month"
              popular={true}
              ctaText="Start Free Trial"
              ctaVariant="default"
              features={[
                "Up to 100 team members",
                "Unlimited projects",
                "Advanced AI features",
                "Priority support",
                "Advanced analytics",
                "Custom integrations",
                "20GB storage per user",
                "Advanced security"
              ]}
            />

            <PricingCard
              name="Enterprise"
              description="For large organizations with custom requirements"
              price="Custom"
              ctaText="Contact Sales"
              ctaVariant="outline"
              features={[
                "Unlimited team members",
                "Unlimited everything",
                "Dedicated AI model",
                "24/7 phone support",
                "Custom integrations",
                "SSO & SAML",
                "Unlimited storage",
                "SLA guarantee",
                "On-premise deployment"
              ]}
            />
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              All plans include 14-day free trial • No credit card required • Cancel anytime
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                GDPR Ready
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                99.9% Uptime SLA
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Ready to transform your team&rsquo;s productivity?
            </h2>
            <p className="text-lg opacity-90 mb-8 leading-relaxed">
              Join over 15,000 teams already using ChatPM to deliver projects 40% faster 
              with AI-powered insights and seamless collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" variant="secondary" className="min-w-[200px] text-base font-semibold">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="min-w-[200px] text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/50"
              >
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>Trusted by 15K+ teams</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Command className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">ChatPM</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered project management for modern teams.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Follow us on Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="View our GitHub repository"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Contact us via email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ChatPM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}