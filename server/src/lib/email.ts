import { Resend } from 'resend';
import {
  buildRegisterOtpEmailTemplate,
  buildResetPasswordOtpEmailTemplate,
  buildBorrowRequestEmailTemplate,
  buildBorrowApprovedEmailTemplate,
  buildBorrowDueSoonReminderEmailTemplate,
  buildBorrowOverdueReminderEmailTemplate,
} from './emailTemplates';

const resendApiKey = process.env.RESEND_API_KEY || '';
const otpFromEmail = process.env.OTP_FROM_EMAIL || '';
const otpAppName = process.env.OTP_APP_NAME || 'Thu vien UTT';

const resend = resendApiKey ? new Resend(resendApiKey) : null;
const isGmailAddress = (email: string) => /@gmail\.com$/i.test(String(email || '').trim());

type SendRegisterOtpEmailInput = {
  to: string;
  otpCode: string;
  expiresInSeconds: number;
};

type SendResetPasswordOtpEmailInput = {
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

export const sendResetPasswordOtpEmail = async (input: SendResetPasswordOtpEmailInput) => {
  if (!resend || !otpFromEmail) {
    return {
      sent: false,
      reason: 'missing-email-config',
    };
  }

  const expiresInMinutes = Math.max(1, Math.ceil(input.expiresInSeconds / 60));
  const template = buildResetPasswordOtpEmailTemplate({
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
    throw new Error(error.message || 'Khong the gui email OTP dat lai mat khau qua Resend');
  }

  return { sent: true as const };
};

type SendBorrowRequestEmailInput = {
  to: string;
  readerName: string;
  bookTitle: string;
  pickupDeadline: Date | string;
};

type SendBorrowApprovedEmailInput = {
  to: string;
  readerName: string;
  bookTitle: string;
  borrowDate: Date | string;
  dueDate: Date | string;
};

type SendBorrowDueSoonReminderEmailInput = {
  to: string;
  readerName: string;
  bookTitle: string;
  dueDate: Date | string;
  daysLeft: number;
};

type SendBorrowOverdueReminderEmailInput = {
  to: string;
  readerName: string;
  bookTitle: string;
  dueDate: Date | string;
  overdueDays: number;
};

const sendLibraryTemplateEmail = async (to: string, template: { subject: string; html: string; text: string }) => {
  if (!isGmailAddress(to)) {
    return { sent: false as const, reason: 'unsupported-email-domain' };
  }

  if (!resend || !otpFromEmail) {
    return { sent: false as const, reason: 'missing-email-config' };
  }

  const { error } = await resend.emails.send({
    from: otpFromEmail,
    to: [to],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (error) {
    throw new Error(error.message || 'Khong the gui email thong bao qua Resend');
  }

  return { sent: true as const };
};

export const sendBorrowRequestEmail = async (input: SendBorrowRequestEmailInput) => {
  const template = buildBorrowRequestEmailTemplate({
    appName: otpAppName,
    readerName: input.readerName,
    bookTitle: input.bookTitle,
    pickupDeadline: input.pickupDeadline,
  });

  return sendLibraryTemplateEmail(input.to, template);
};

export const sendBorrowApprovedEmail = async (input: SendBorrowApprovedEmailInput) => {
  const template = buildBorrowApprovedEmailTemplate({
    appName: otpAppName,
    readerName: input.readerName,
    bookTitle: input.bookTitle,
    borrowDate: input.borrowDate,
    dueDate: input.dueDate,
  });

  return sendLibraryTemplateEmail(input.to, template);
};

export const sendBorrowDueSoonReminderEmail = async (input: SendBorrowDueSoonReminderEmailInput) => {
  const template = buildBorrowDueSoonReminderEmailTemplate({
    appName: otpAppName,
    readerName: input.readerName,
    bookTitle: input.bookTitle,
    dueDate: input.dueDate,
    daysLeft: input.daysLeft,
  });

  return sendLibraryTemplateEmail(input.to, template);
};

export const sendBorrowOverdueReminderEmail = async (input: SendBorrowOverdueReminderEmailInput) => {
  const template = buildBorrowOverdueReminderEmailTemplate({
    appName: otpAppName,
    readerName: input.readerName,
    bookTitle: input.bookTitle,
    dueDate: input.dueDate,
    overdueDays: input.overdueDays,
  });

  return sendLibraryTemplateEmail(input.to, template);
};
