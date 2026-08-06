import { NotificationTemplate, NotificationChannel } from '../contracts/notification.contracts';

export class TemplateEngine {
  public static render(
    template: NotificationTemplate,
    variables?: Record<string, any>,
  ): { subject?: string; body: string } {
    let subject = template.subject || '';
    let body = template.htmlBody || template.textBody;

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        subject = subject.replace(regex, String(value));
        body = body.replace(regex, String(value));
      }
    }

    return { subject, body };
  }
}

export class TemplateRegistry {
  private static templates = new Map<string, NotificationTemplate>([
    [
      'WelcomeEmail:v1',
      {
        id: 'WelcomeEmail',
        version: 'v1',
        channel: 'email',
        locale: 'en-US',
        subject: 'Welcome to EduTrack ERP, {{ name }}!',
        textBody: 'Hello {{ name }}, welcome to EduTrack ERP platform.',
        htmlBody: '<h1>Hello {{ name }}</h1><p>Welcome to EduTrack ERP platform.</p>',
      },
    ],
    [
      'PasswordReset:v1',
      {
        id: 'PasswordReset',
        version: 'v1',
        channel: 'email',
        locale: 'en-US',
        subject: 'EduTrack ERP — Password Reset Request',
        textBody: 'Hello {{ name }}, your reset token is: {{ resetToken }}',
        htmlBody:
          '<p>Hello {{ name }}, click to reset: <a href="{{ resetUrl }}">Reset Password</a></p>',
      },
    ],
  ]);

  public static getTemplate(id: string, version = 'v1'): NotificationTemplate | undefined {
    return this.templates.get(`${id}:${version}`);
  }
}
