import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmail(subject: string, message: string, toEmail: string): Promise<void> {
    const user = this.config.get<string>('EMAIL');
    const pass = this.config.get<string>('EMAIL_PASS');
    if (!user || !pass) {
      this.logger.error('⚠️ Email credentials missing');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
    });

    try {
      const info = await transporter.sendMail({ from: user, to: toEmail, subject, text: message });
      this.logger.log(`✅ Email sent: ${info.response}`);
    } catch (err) {
      this.logger.error('❌ Email send failed', err);
    }
  }
}
