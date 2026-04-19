import { Resend } from 'resend';
import { buildRegisterOtpEmailTemplate } from './emailTemplates';

const resendApiKey = process.env.RESEND_API_KEY || '';
const otpFromEmail = process.env.OTP_FROM_EMAIL || '';
const otpAppName = process.env.OTP_APP_NAME || 'Thu vien UTT';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendRegisterOtpEmailInput = {
  to: string;
  otpCode: string;
  expiresInSeconds: number;
};

export const sendRegisterOtpEmail = async (input: SendRegisterOtpEmailInput) => {
  if (!resend || !otpFromEmail) {
    return {
      sent: false,
      reason: 'missing-email-config',
    };
  }

  const expiresInMinutes = Math.max(1, Math.ceil(input.expiresInSeconds / 60));
  const template = buildRegisterOtpEmailTemplate({
    appName: otpAppName,
    otpCode: input.otpCode,
    expiresInMinutes,
  });

  const { error } = await resend.emails.send({
    from: otpFromEmail,
    to: [input.to],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (error) {
    throw new Error(error.message || 'Khong the gui email OTP qua Resend');
  }

  return { sent: true as const };
};
