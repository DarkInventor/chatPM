"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Users, Zap } from 'lucide-react';

export default function OnboardingPage() {
  const { user, userProfile } = useAuth();
  const { createOrganization, organizations, isLoadingOrganizations } = useWorkspace();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isWaitingForSync, setIsWaitingForSync] = useState(false);

  // Monitor organizations and redirect when one appears
  React.useEffect(() => {
    if (isWaitingForSync && organizations.length > 0 && !isLoadingOrganizations) {
      console.log('Organization synced, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [organizations.length, isLoadingOrganizations, isWaitingForSync, router]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || !user) return;

    setIsCreating(true);
    setError('');

    try {
      console.log('Creating organization through context:', workspaceName.trim());
      const result = await createOrganization({
        name: workspaceName.trim(),
        plan: 'free'
      });

      console.log('Organization creation result:', result);

      if (result.success) {
        console.log('Organization created successfully, waiting for sync...');
        setIsWaitingForSync(true);
        // The useEffect will handle the redirect when organizations are synced
      } else {
        setError(result.error || 'Failed to create workspace');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError('An unexpected error occurred');
      setIsCreating(false);
    }
  };

  // Skip function removed as button is commented out
  // const handleSkip = async () => {
  //   if (!user) return;
  //   setIsCreating(true);
  //   try {
  //     const result = await createOrganization({
  //       name: `${userProfile?.displayName || 'My'} Organization`,
  //       plan: 'free'
  //     });

  //     if (result.success) {
  //       setTimeout(() => {
  //         router.push('/dashboard');
  //       }, 1500);
  //     } else {
  //       setError(result.error || 'Failed to create workspace');
  //     }
  //   } catch (error) {
  //     setError('An unexpected error occurred');
  //   } finally {
  //     setIsCreating(false);
  //   }
  // };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Welcome to ChatPM!</CardTitle>
              <CardDescription>
                Let's set up your workspace to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">What should we call your workspace?</Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., Acme Inc, My Team, Personal Projects"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={isCreating}
                />
                <p className="text-sm text-gray-500">
                  This is where you and your team will collaborate
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={handleCreateWorkspace}
                  disabled={!workspaceName.trim() || isCreating || isWaitingForSync}
                  className="w-full"
                >
                  {isWaitingForSync ? 'Syncing...' : isCreating ? 'Creating workspace...' : 'Create workspace'}
                </Button>
                
                {/* <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  disabled={isCreating}
                  className="w-full"
                >
                  Skip for now
                </Button> */}
              </div>

              <div className="mt-8 space-y-4">
                <div className="text-center text-sm text-gray-500 mb-4">
                  What you'll get:
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">A General workspace to start organizing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">Ability to invite team members</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">Project management tools</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}