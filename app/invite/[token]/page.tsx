"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MemberService } from '@/lib/member-service';
import { firestoreService } from '@/lib/firestore';
import { Invitation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Mail, Users, Building2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface InvitationData extends Invitation {
  inviterProfile: {
    displayName: string;
    photoURL?: string;
    email: string;
  };
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get invitation details
      const invitationData = await MemberService.getInvitationByToken(token);
      
      if (!invitationData) {
        setError('Invalid or expired invitation link');
        return;
      }

      // Check if invitation is still valid
      if (invitationData.status !== 'pending') {
        if (invitationData.status === 'accepted') {
          setError('This invitation has already been accepted');
        } else if (invitationData.status === 'expired') {
          setError('This invitation has expired');
        } else {
          setError('This invitation is no longer valid');
        }
        return;
      }

      // Check if invitation has expired
      if (invitationData.expiresAt.toDate() < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Get inviter profile
      const inviterProfile = await firestoreService.getUserProfile(invitationData.invitedBy);
      if (!inviterProfile) {
        setError('Could not load invitation details');
        return;
      }

      setInvitation({
        ...invitationData,
        inviterProfile
      });

    } catch (err: any) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!user || !invitation) return;

    // Check if user's email matches invitation
    if (userProfile?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      setError('This invitation was sent to a different email address');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const result = await MemberService.acceptInvitation(token, user.uid);
      
      if (result.success) {
        setSuccess(true);
        
        // Redirect to workspace after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(result.error || 'Failed to join workspace');
      }
    } catch (err: any) {
      console.error('Error joining workspace:', err);
      setError('An unexpected error occurred');
    } finally {
      setJoining(false);
    }
  };

  const handleSignIn = () => {
    // Store the invitation token in localStorage so we can redirect back after sign in
    localStorage.setItem('pendingInvitation', token);
    router.push('/signin');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'guest': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Mail className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Invitation</h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to the team!</h3>
              <p className="text-sm text-gray-500 mb-4">
                You've successfully joined <strong>{invitation?.workspaceName}</strong>
              </p>
              <p className="text-xs text-gray-400">Redirecting to your workspace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>
              Sign in to join <strong>{invitation?.organizationName}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {invitation && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invitation.inviterProfile.photoURL} />
                    <AvatarFallback className="text-xs">
                      {getInitials(invitation.inviterProfile.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {invitation.inviterProfile.displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {invitation.inviterProfile.email}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Organization:</span>
                    <span className="font-medium">{invitation.organizationName}</span>
                  </div>
                  
                  {invitation.workspaceName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Workspace:</span>
                      <span className="font-medium">{invitation.workspaceName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className={getRoleBadgeColor(invitation.role)}>
                      {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center text-sm text-gray-500">
              <p>You need to sign in to accept this invitation</p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button onClick={handleSignIn} className="w-full">
              Sign In to Join
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            Join <strong>{invitation?.organizationName}</strong> and start collaborating
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {invitation && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={invitation.inviterProfile.photoURL} />
                  <AvatarFallback className="text-xs">
                    {getInitials(invitation.inviterProfile.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {invitation.inviterProfile.displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    invited you to join
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium">{invitation.organizationName}</span>
                </div>
                
                {invitation.workspaceName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Workspace:</span>
                    <span className="font-medium">{invitation.workspaceName}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Role:</span>
                  <Badge variant="secondary" className={getRoleBadgeColor(invitation.role)}>
                    {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Expires on {invitation.expiresAt.toDate().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">Invited as: <strong>{userProfile?.email}</strong></p>
            {userProfile?.email.toLowerCase() !== invitation?.email.toLowerCase() && (
              <p className="text-red-600 text-xs">
                ⚠️ This invitation was sent to {invitation?.email}
              </p>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1"
            disabled={joining}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleJoinWorkspace}
            disabled={joining || userProfile?.email.toLowerCase() !== invitation?.email.toLowerCase()}
            className="flex-1"
          >
            {joining ? 'Joining...' : 'Join Workspace'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}