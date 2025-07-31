import { Invitation, UserProfile } from "./types";

export interface EmailInvitationData {
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteeEmail: string;
  invitationToken: string;
  organizationName: string;
}

export class EmailService {
  // In a real application, you would use a service like SendGrid, AWS SES, or Resend
  // For now, we'll create a placeholder that logs the email content
  static async sendInvitationEmail(data: EmailInvitationData): Promise<{ success: boolean; error?: string }> {
    try {
      // Create the invitation link
      const invitationUrl = `${window.location.origin}/invite/${data.invitationToken}`;
      
      // Email template
      const emailSubject = `${data.inviterName} invited you to join ${data.workspaceName} on ChatPM`;
      const emailBody = this.generateInvitationEmailHTML(data, invitationUrl);
      
      // In a real app, you would send this via your email service
      // For now, we'll log it and show a browser notification
      console.log('=== EMAIL INVITATION ===');
      console.log('To:', data.inviteeEmail);
      console.log('From:', data.inviterEmail);
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBody);
      console.log('========================');
      
      // For development, we can show a browser notification or copy to clipboard
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Invitation Sent!', {
          body: `Invitation sent to ${data.inviteeEmail}`,
          icon: '/favicon.ico'
        });
      }
      
      // In production, replace this with actual email sending logic:
      /*
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.inviteeEmail,
          from: data.inviterEmail,
          subject: emailSubject,
          html: emailBody,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      */
      
      return { success: true };
    } catch (error: any) {
      console.error('Error sending invitation email:', error);
      return { success: false, error: error.message };
    }
  }

  private static generateInvitationEmailHTML(data: EmailInvitationData, invitationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to ${data.workspaceName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eee;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .content {
            padding: 30px 0;
        }
        .invitation-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .workspace-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .cta-button:hover {
            background: #1d4ed8;
        }
        .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #eee;
            color: #64748b;
            font-size: 14px;
        }
        .link {
            color: #2563eb;
            text-decoration: none;
        }
        .small-text {
            font-size: 12px;
            color: #64748b;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">ChatPM</div>
    </div>
    
    <div class="content">
        <h2>Hi! 👋</h2>
        
        <blockquote style="border-left: 4px solid #2563eb; padding-left: 16px; margin: 20px 0; font-style: italic; color: #64748b;">
            "Hi, I am inviting you to join my workspace on ChatPM. Let's build something cool!"
            <br><br>
            — <strong>${data.inviterName}</strong>
        </blockquote>
        
        <div class="invitation-box">
            <div class="workspace-name">${data.workspaceName}</div>
            <p style="margin: 10px 0; color: #64748b;">
                ${data.organizationName}
            </p>
        </div>
        
        <div style="text-align: center;">
            <a href="${invitationUrl}" class="cta-button">
                Join Workspace
            </a>
        </div>
        
        <p>ChatPM is an AI-powered project management platform that helps teams collaborate more effectively and reduce project delivery time by 40%.</p>
        
        <p>Ready to transform how your team works? Click the button above to get started!</p>
        
        <div class="small-text">
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${invitationUrl}" class="link">${invitationUrl}</a></p>
            <p>This invitation will expire in 7 days.</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This invitation was sent by ${data.inviterName} (${data.inviterEmail})</p>
        <p>
            <a href="https://chatpm.ai" class="link">ChatPM</a> - 
            AI-Powered Project Management
        </p>
    </div>
</body>
</html>
    `.trim();
  }

  // Helper method to request notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Method to show invitation preview (for development)
  static showInvitationPreview(data: EmailInvitationData): void {
    const invitationUrl = `${window.location.origin}/invite/${data.invitationToken}`;
    const emailHTML = this.generateInvitationEmailHTML(data, invitationUrl);
    
    // Open preview in new window
    const previewWindow = window.open('', '_blank', 'width=700,height=800');
    if (previewWindow) {
      previewWindow.document.write(emailHTML);
      previewWindow.document.close();
    }
  }
}