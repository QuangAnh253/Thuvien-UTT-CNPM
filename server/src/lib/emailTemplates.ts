export const buildRegisterOtpEmailTemplate = (params: {
  appName: string;
  otpCode: string;
  expiresInMinutes: number;
}) => {
  const { appName, otpCode, expiresInMinutes } = params;

  const subject = `[${appName}] Ma OTP xac thuc dang ky`;
  const text = [
    `Ma OTP cua ban la: ${otpCode}`,
    `Ma co hieu luc trong ${expiresInMinutes} phut.`,
    'Neu ban khong thuc hien yeu cau nay, vui long bo qua email.',
  ].join('\n');

  const html = `
    <div style="margin:0;padding:24px;background:#f6f8fb;font-family:Arial,sans-serif;color:#1f2937;">
      <table role="presentation" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="padding:20px 24px;background:#262262;color:#ffffff;">
            <h1 style="margin:0;font-size:20px;line-height:28px;">${appName}</h1>
            <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">Xac thuc dang ky tai khoan</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 12px;font-size:14px;line-height:22px;">Xin chao,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:22px;">Ban vua yeu cau dang ky tai khoan. Vui long su dung ma OTP ben duoi de xac thuc:</p>
            <div style="text-align:center;margin:20px 0;">
              <span style="display:inline-block;padding:12px 18px;border:1px dashed #f79421;border-radius:10px;font-size:30px;font-weight:700;letter-spacing:8px;color:#262262;background:#fff8ee;">${otpCode}</span>
            </div>
            <p style="margin:0 0 12px;font-size:14px;line-height:22px;">Ma OTP co hieu luc trong <strong>${expiresInMinutes} phut</strong>.</p>
            <p style="margin:0;font-size:12px;line-height:20px;color:#6b7280;">Neu ban khong thuc hien yeu cau nay, vui long bo qua email nay.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { subject, text, html };
};
