"use client"

import * as React from "react"
import {
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Command,
  Mail,
  Play,
  Zap,
  Globe,
  Menu,
  X,
  TrendingUp,
  Network,
  Brain,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HeroSection } from "./hero-section"
import { Features } from "./features-section"
import { InfrastructureBento } from "./infrastructure-bento"
import { StaggerTestimonials } from "./stagger-testimonials"
import { Workplace } from "./ui/workplace"
import { CTA } from "./cta-section"
import { FooterSection } from "./ui/footer-taped-design"

interface InfrastructureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  accent?: boolean
}

interface TestimonialProps {
  name: string
  role: string
  company: string
  content: string
  initials: string
}

interface PlatformMetricProps {
  number: string
  label: string
  trend?: "up" | "down"
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

// Infrastructure Component Card
function InfrastructureCard({ icon: Icon, title, description, accent = false }: InfrastructureCardProps) {
  return (
    <Card className={`group hover:ring-1 hover:ring-gray-500 rounded-3xl hover:ring-offset-0 hover:border-gray-700 transition-all duration-300 border-border/50 shadow-none ${accent ? 'border-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors ${accent ? 'bg-primary/15' : ''}`}>
            <Icon className={`h-5 w-5 text-primary transition-colors`} />
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

// Platform Metric Component
function PlatformMetric({ number, label, trend }: PlatformMetricProps) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-primary mb-2" aria-label={`${number} ${label}`}>
        {number}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
      {trend === "up" && (
        <TrendingUp className="h-4 w-4 text-green-600 mx-auto mt-1" />
      )}
    </div>
  )
}

// Testimonial Component
function TestimonialCard({ name, role, company, content, initials }: TestimonialProps) {
  return (
    <Card className="h-full rounded-3xl">
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
    <Card className={`relative rounded-3xl ${popular ? 'border-primary shadow-lg' : ''}`}>
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
    

      {/* Hero Section */}
      {/* <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 animate-in fade-in duration-700">
              <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
              AI Infrastructure Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              The AI Infrastructure
              <span className="text-primary block sm:inline"> Powering the Future of Work</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              15,000+ teams already building on the platform that will define how humanity works. 
              We&apos;re not improving project management—we&apos;re creating the AI operating system for knowledge work itself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <Button size="lg" className="min-w-[200px] text-base font-semibold" onClick={() => window.location.href = '/dashboard'}>
                Join the AI Revolution
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="min-w-[200px] text-base">
                <Play className="h-4 w-4" />
                See the Future Now
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>Platform ready for 10M+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>AI infrastructure built for scale</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>Network effects activated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>99.9% uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <HeroSection />

      {/* Market Problem Section */}
      {/* <section className="py-20 bg-muted/30 ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                The <span className="text-primary">$2.3 Trillion</span> Problem Everyone Ignores
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                While companies spend billions on productivity tools, 73% of knowledge workers still waste 21 hours per week on inefficient processes. The problem isn&apos;t more tools—it&apos;s the absence of intelligent infrastructure.
              </p>
              <p className="text-lg text-foreground font-medium">
                Traditional project management treats symptoms. ChatPM eliminates the disease.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-background p-6 border border-border shadow-none rounded-3xl">
                <div className="text-3xl font-mono font-bold text-destructive mb-2">73%</div>
                <div className="text-sm text-muted-foreground">Workers waste 21+ hours weekly</div>
              </div>
              <div className="bg-background p-6 border border-border shadow-none rounded-3xl">
                <div className="text-3xl font-mono font-bold text-destructive mb-2">$2.3T</div>
                <div className="text-sm text-muted-foreground">Lost productivity annually</div>
              </div>
              <div className="bg-background p-6 border border-border shadow-none rounded-3xl">
                <div className="text-3xl font-mono font-bold text-primary mb-2">40%</div>
                <div className="text-sm text-muted-foreground">Efficiency gained with AI</div>
              </div>
              <div className="bg-background p-6 border border-border shadow-none rounded-3xl">
                <div className="text-3xl font-mono font-bold text-primary mb-2">10M+</div>
                <div className="text-sm text-muted-foreground">Workers ready for AI</div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <Features />
      {/* AI Infrastructure Section */}
      <section id="infrastructure" className="mt-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              This Isn&apos;t Project Management.
              <span className="block text-primary">This Is the New Operating System for Work.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We&apos;re building the AI infrastructure that scales from startup to enterprise, powering the workplace transformation that&apos;s already happening.
            </p>
          </div>

         
        </div>
        <InfrastructureBento />
      </section>
    
        <section id="growth" className="py-10 sm:py-16 md:py-20 bg-background">
          <div
            className="overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 lg:rounded-[3rem] dark:border-white/5 mx-auto w-full max-w-7xl px-2 sm:px-4 md:px-6 lg:px-12 bg-blue-500/20 flex flex-col justify-center"
            style={{
              maxHeight: '700px',
              minHeight: 'auto',
              height: '100%',
            }}
          >
            <div className="bg-muted/30 w-full h-full p-4 sm:p-8 lg:p-16 flex flex-col justify-center">
              <div className="mx-auto w-full max-w-2xl sm:max-w-3xl text-center mb-10 sm:mb-14 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                  The Numbers Tell the Story of
                  <span className="block text-primary">Inevitable Dominance</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                  This isn&apos;t linear growth. This is exponential adoption of foundational infrastructure.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                <PlatformMetric
                  number="15K+"
                  label="Teams Building the Future"
                  trend="up"
                />
                <PlatformMetric
                  number="100M+"
                  label="AI-Powered Workflows"
                  trend="up"
                />
                <PlatformMetric
                  number="40%"
                  label="Efficiency Multiplier"
                  trend="up"
                />
                <PlatformMetric
                  number="99.99%"
                  label="Infrastructure Uptime"
                  trend="up"
                />
              </div>
              
              <div className="mt-10 sm:mt-14 md:mt-16 text-center">
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>15K → 100K teams (12 months)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>100M → 1B tasks (18 months)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>40% → 60% efficiency gains</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="py-0 bg-background border-b border-t">
          <div className="overflow-hidden rounded-2xl border-none border-black/10 sm:aspect-video aspect-auto lg:rounded-[3rem] dark:border-white/5 mx-auto max-w-7xl px-2 sm:px-6 lg:px-12">
            <div className="h-full p-4 sm:p-8 lg:p-16">
              <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                  We Don't Have Competitors.
                  <span className="block text-primary">We Have a Category.</span>
                </h2>
                <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  When AWS launched, they weren't competing with hosting companies. When Salesforce launched, they weren't competing with contact managers. When ChatPM launches at scale, we won't be competing with project management tools.
                </p>
                <p className="text-sm sm:text-lg text-foreground font-semibold mt-4 sm:mt-6">
                  We're the infrastructure layer that makes everything else possible.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                <div className="text-center p-4 sm:p-8 bg-background rounded-2xl sm:rounded-3xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="text-2xl sm:text-4xl font-mono font-bold text-primary mb-2 sm:mb-4">500+</div>
                  <div className="font-semibold mb-1 sm:mb-2">Integrated Tools</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">API-first architecture connects everything</div>
                </div>
                <div className="text-center p-4 sm:p-8 bg-background rounded-2xl sm:rounded-3xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="text-2xl sm:text-4xl font-mono font-bold text-primary mb-2 sm:mb-4">400%</div>
                  <div className="font-semibold mb-1 sm:mb-2">Developer Growth</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Ecosystem expanding exponentially</div>
                </div>
                <div className="text-center p-4 sm:p-8 bg-background rounded-2xl sm:rounded-3xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="text-2xl sm:text-4xl font-mono font-bold text-primary mb-2 sm:mb-4">∞</div>
                  <div className="font-semibold mb-1 sm:mb-2">Scale Potential</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Infrastructure built for infinite growth</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 bg-background">
          <div className="aspect-[2/3] min-h-[920px] lg:max-w-7xl max-w-[400px] overflow-hidden rounded-3xl border-none border-black/10 sm:aspect-video lg:rounded-[3rem] dark:border-white/5 mx-auto  px-6 lg:px-12">
            <div className="h-full p-8 lg:p-16">
              <div className="mx-auto max-w-3xl text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  The Companies Building Tomorrow
                  <span className="block text-primary">Choose ChatPM</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  See how forward-thinking leaders are using ChatPM as the AI infrastructure to power their competitive advantage.
                </p>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TestimonialCard
                  name="Sarah Chen"
                  role="CTO"
                  company="VelocityAI"
                  initials="SC"
                  content="ChatPM isn't just a tool—it's the AI infrastructure our entire company runs on. We've built our competitive advantage on this platform, and it scales with our exponential growth without missing a beat."
                />

                <TestimonialCard
                  name="Marcus Rodriguez"
                  role="Head of Engineering"
                  company="ScaleFlow"
                  initials="MR"
                  content="The AI capabilities are genuinely foundational to how we operate. This is the infrastructure layer that will power the next decade of work. We're building the future on ChatPM's platform."
                />

                <TestimonialCard
                  name="Alex Kim"
                  role="VP of Operations"
                  company="NeuralWorks"
                  initials="AK"
                  content="ChatPM is our secret weapon for moving 40% faster than competitors. The network effects and collective intelligence give us an unfair advantage that compounds over time."
                />

                <TestimonialCard
                  name="Jordan Walsh"
                  role="CEO"
                  company="FutureStack"
                  initials="JW"
                  content="We've tried every productivity tool. ChatPM is different—it's the operating system for knowledge work. Our entire company thinks and moves through this platform now."
                />

                <TestimonialCard
                  name="Elena Vasquez"
                  role="Chief Innovation Officer"
                  company="TechForward"
                  initials="EV"
                  content="The platform thinking is what sets ChatPM apart. This isn't project management; it's the AI backbone that connects everything we do. Our growth trajectory speaks for itself."
                />

                <TestimonialCard
                  name="David Park"
                  role="Director of AI Strategy"
                  company="InnovateCore"
                  initials="DP"
                  content="ChatPM's infrastructure approach is exactly what we needed to scale our AI initiatives. The platform grows with us and amplifies our team's capabilities exponentially."
                />
              </div> */}
              {/* <div className="flex w-full h-screen justify-center items-center"> */}
      <StaggerTestimonials />
    {/* </div> */}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-background">
          <div className="overflow-hidden rounded-2xl border border-black/10 sm:aspect-video aspect-auto lg:rounded-[3rem] dark:border-white/5 mx-auto max-w-7xl px-2 sm:px-6 lg:px-12">
            <div className="h-full p-4 sm:p-8 lg:p-16">
              <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight sm:text-4xl mb-3 sm:mb-4">
                  Simple, transparent pricing
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Choose the plan that works best for your team. Start with a 14-day free trial on any plan. No credit card required.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-full md:max-w-5xl mx-auto">
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

              <div className="mt-10 sm:mt-16 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  All plans include 14-day free trial • No credit card required • Cancel anytime
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
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
          </div>
        </section>

        <section className="mt-12 sm:mt-16 md:mt-20 bg-background">
          <div className="w-full mx-auto max-w-7xl px-2 sm:px-4 lg:px-12">
            <div className="overflow-auto rounded-2xl sm:rounded-3xl lg:rounded-[3rem] border-none border-black/10 dark:border-white/5  bg-background">
              <div className="h-full mb-10">
                <div className="mx-auto max-w-3xl text-center mb-0 sm:mb-0">
                  <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">
                    The Workplace of 2030
                    <span className="block text-primary">Runs on ChatPM</span>
                  </h2>
                  <p className="text-base xs:text-lg sm:text-xl text-muted-foreground leading-relaxed">
                    This isn't speculation. This is the logical evolution of work itself, and we're building the infrastructure to power it.
                  </p>
                </div>
                
              </div>
              
            </div>
            
          </div>
          
        </section>
         <Workplace />
       
        {/* <section className="py-20 bg-background">
          <div className="aspect-[2/3] overflow-hidden rounded-3xl border border-black/10 sm:aspect-video lg:rounded-[3rem] dark:border-white/5 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="bg-primary text-primary-foreground h-full p-8 lg:p-16">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                  Join the AI Workplace Revolution
                </h2>
                <p className="text-lg opacity-90 mb-8 leading-relaxed">
                  Every day you wait, your competitors get further ahead. The infrastructure is ready. The future is here. The only question is whether you'll lead or follow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button size="lg" variant="secondary" className="min-w-[200px] text-base font-semibold">
                    Claim Your Spot in the Future
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="min-w-[200px] text-gray-200 font-semibold bg-transparent border cursor-pointer"
                  >
                    <Play className="h-4 w-4" />
                    See What&apos;s Already Possible
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm opacity-80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Limited early adopter pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span>Priority implementation support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" aria-hidden="true" />
                    <span>Exclusive access to new AI capabilities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        <CTA />

    
        <FooterSection />
</div>
 
  )
}