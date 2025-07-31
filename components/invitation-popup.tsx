"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { MemberService } from '@/lib/member-service';
import { firestoreService } from '@/lib/firestore';
import { Invitation } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Users, Building2, Clock } from 'lucide-react';

interface InvitationWithDetails extends Invitation {
  inviterProfile: {
    displayName: string;
    photoURL?: string;
    email: string;
  };
}

export function InvitationPopup() {
  const { user, userProfile } = useAuth();
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [currentInvitationIndex, setCurrentInvitationIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && userProfile?.email) {
      loadPendingInvitations();
    }
  }, [user, userProfile]);

  const loadPendingInvitations = async () => {
    if (!userProfile?.email) return;

    try {
      console.log('Loading pending invitations for:', userProfile.email);
      const pendingInvitations = await MemberService.getPendingInvitationsForUser(userProfile.email);
      
      if (pendingInvitations.length > 0) {
        console.log('Found pending invitations:', pendingInvitations.length);
        
        // Load inviter profiles for each invitation
        const invitationsWithDetails = await Promise.all(
          pendingInvitations.map(async (invitation) => {
            const inviterProfile = await firestoreService.getUserProfile(invitation.invitedBy);
            return {
              ...invitation,
              inviterProfile: inviterProfile || {
                displayName: 'Unknown User',
                email: 'unknown@example.com'
              }
            };
          })
        );

        setInvitations(invitationsWithDetails);
        setCurrentInvitationIndex(0);
        setIsOpen(true);
      } else {
        console.log('No pending invitations found');
      }
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user || invitations.length === 0) return;

    const currentInvitation = invitations[currentInvitationIndex];
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Accepting invitation:', currentInvitation.token);
      const result = await MemberService.acceptInvitation(currentInvitation.token, user.uid);
      
      if (result.success) {
        console.log('Invitation accepted successfully');
        
        // Remove the accepted invitation from the list
        const updatedInvitations = invitations.filter((_, index) => index !== currentInvitationIndex);
        setInvitations(updatedInvitations);
        
        // Show next invitation or close popup
        if (updatedInvitations.length > 0) {
          // Adjust index if we removed the last item
          const nextIndex = currentInvitationIndex >= updatedInvitations.length 
            ? updatedInvitations.length - 1 
            : currentInvitationIndex;
          setCurrentInvitationIndex(nextIndex);
        } else {
          setIsOpen(false);
        }

        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Invitation Accepted!', {
            body: `You've joined ${currentInvitation.workspaceName || currentInvitation.organizationName}`,
            icon: '/favicon.ico'
          });
        }
      } else {
        setError(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineInvitation = () => {
    // Remove the declined invitation from the list
    const updatedInvitations = invitations.filter((_, index) => index !== currentInvitationIndex);
    setInvitations(updatedInvitations);
    
    // Show next invitation or close popup
    if (updatedInvitations.length > 0) {
      const nextIndex = currentInvitationIndex >= updatedInvitations.length 
        ? updatedInvitations.length - 1 
        : currentInvitationIndex;
      setCurrentInvitationIndex(nextIndex);
    } else {
      setIsOpen(false);
    }
  };

  const handleNextInvitation = () => {
    if (currentInvitationIndex < invitations.length - 1) {
      setCurrentInvitationIndex(currentInvitationIndex + 1);
    }
  };

  const handlePrevInvitation = () => {
    if (currentInvitationIndex > 0) {
      setCurrentInvitationIndex(currentInvitationIndex - 1);
    }
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

  if (!isOpen || invitations.length === 0) {
    return null;
  }

  const currentInvitation = invitations[currentInvitationIndex];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle>You're Invited!</DialogTitle>
                <DialogDescription>
                  {invitations.length > 1 && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {currentInvitationIndex + 1} of {invitations.length}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentInvitation.inviterProfile.photoURL} />
                <AvatarFallback className="text-xs">
                  {getInitials(currentInvitation.inviterProfile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {currentInvitation.inviterProfile.displayName}
                </p>
                <p className="text-xs text-gray-500">
                  invited you to join
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Organization:</span>
                <span className="font-medium">{currentInvitation.organizationName}</span>
              </div>
              
              {currentInvitation.workspaceName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Workspace:</span>
                  <span className="font-medium">{currentInvitation.workspaceName}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Role:</span>
                <Badge variant="secondary" className={getRoleBadgeColor(currentInvitation.role)}>
                  {currentInvitation.role.charAt(0).toUpperCase() + currentInvitation.role.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Expires on {currentInvitation.expiresAt.toDate().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleDeclineInvitation}
              disabled={isProcessing}
              className="flex-1"
            >
              Decline
            </Button>
            <Button
              onClick={handleAcceptInvitation}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Accepting...' : 'Accept'}
            </Button>
          </div>
          
          {invitations.length > 1 && (
            <div className="flex gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevInvitation}
                disabled={currentInvitationIndex === 0}
                className="flex-1 text-xs"
              >
                ← Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextInvitation}
                disabled={currentInvitationIndex === invitations.length - 1}
                className="flex-1 text-xs"
              >
                Next →
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}