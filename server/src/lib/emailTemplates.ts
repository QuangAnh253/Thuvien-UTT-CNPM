export const buildRegisterOtpEmailTemplate = (params: {
  appName: string;
  otpCode: string;
  expiresInMinutes: number;
}) => {
  const { appName, otpCode, expiresInMinutes } = params;

  const subject = `[${appName}] Mã OTP xác thực đăng ký tài khoản`;

  const text = [
    `Xin chào,`,
    ``,
    `Bạn vừa yêu cầu đăng ký tài khoản trên ${appName}.`,
    `Mã OTP của bạn là: ${otpCode}`,
    `Mã có hiệu lực trong ${expiresInMinutes} phút.`,
    ``,
    `Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.`,
  ].join('\n');

  const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Mã OTP ${otpCode} - hết hạn sau ${expiresInMinutes} phút
    </div>

    <div style="margin:0;padding:32px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <table role="presentation" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">

        <!-- HEADER -->
        <tr>
          <td style="padding:20px 24px;background:#262262;color:#ffffff;">
            <table style="width:100%;">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="https://cnpm.lequanganh.id.vn/LogoUTT_square_blue.png"
                       alt="UTT Logo"
                       style="width:40px;height:40px;border-radius:8px;background:#fff;padding:4px;">
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <h1 style="margin:0;font-size:18px;line-height:22px;">
                    ${appName}
                  </h1>
                  <p style="margin:4px 0 0;font-size:12px;opacity:0.85;">
                    Hệ thống Quản lý Thư viện UTT
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 12px;font-size:15px;">Xin chào,</p>

            <p style="margin:0 0 18px;font-size:14px;line-height:22px;">
              Bạn vừa yêu cầu đăng ký tài khoản. Vui lòng sử dụng mã OTP dưới đây để xác thực:
            </p>

            <!-- OTP BOX -->
            <div style="text-align:center;margin:24px 0;">
              <span style="
                display:inline-block;
                padding:14px 24px;
                border-radius:12px;
                font-size:32px;
                font-weight:bold;
                letter-spacing:10px;
                color:#262262;
                background:#fef3e7;
                border:2px dashed #f79421;
              ">
                ${otpCode}
              </span>
            </div>

            <p style="margin:0 0 12px;font-size:14px;">
              Mã OTP có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.
            </p>

            <p style="margin:0;font-size:12px;color:#6b7280;line-height:20px;">
              Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © 2026 ${appName} - Nhóm 1 - 74DCHT22
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
              Công nghệ phần mềm - UTT
            </p>
          </td>
        </tr>

      </table>
    </div>
  `;

  return { subject, text, html };
};

export const buildResetPasswordOtpEmailTemplate = (params: {
  appName: string;
  otpCode: string;
  expiresInMinutes: number;
}) => {
  const { appName, otpCode, expiresInMinutes } = params;

  const subject = `[${appName}] Mã OTP đặt lại mật khẩu`;

  const text = [
    `Xin chào,`,
    ``,
    `Bạn vừa yêu cầu đặt lại mật khẩu trên ${appName}.`,
    `Mã OTP của bạn là: ${otpCode}`,
    `Mã có hiệu lực trong ${expiresInMinutes} phút.`,
    ``,
    `Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.`,
  ].join('\n');

  // HTML
  const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      OTP đặt lại mật khẩu: ${otpCode} (hết hạn sau ${expiresInMinutes} phút)
    </div>

    <div style="margin:0;padding:32px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <table role="presentation" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">

        <tr>
          <td style="padding:20px 24px;background:#262262;color:#ffffff;">
            <table style="width:100%;">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="https://cnpm.lequanganh.id.vn/LogoUTT_square_blue.png"
                       alt="UTT Logo"
                       style="width:40px;height:40px;border-radius:8px;background:#fff;padding:4px;">
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <h1 style="margin:0;font-size:18px;line-height:22px;">
                    ${appName}
                  </h1>
                  <p style="margin:4px 0 0;font-size:12px;opacity:0.85;">
                    Hệ thống Quản lý Thư viện UTT
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 12px;font-size:15px;">Xin chào,</p>

            <p style="margin:0 0 18px;font-size:14px;line-height:22px;">
              Bạn vừa yêu cầu <strong>đặt lại mật khẩu</strong>. Sử dụng mã OTP dưới đây để tiếp tục:
            </p>

            <div style="text-align:center;margin:24px 0;">
              <span style="
                display:inline-block;
                padding:14px 24px;
                border-radius:12px;
                font-size:32px;
                font-weight:bold;
                letter-spacing:10px;
                color:#b91c1c;
                background:#fef2f2;
                border:2px dashed #ef4444;
              ">
                ${otpCode}
              </span>
            </div>

            <p style="margin:0 0 12px;font-size:14px;">
              Mã OTP có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.
            </p>

            <p style="margin:0;font-size:12px;color:#6b7280;line-height:20px;">
              Nếu bạn không yêu cầu thao tác này, tài khoản của bạn có thể đang gặp rủi ro.
              Hãy đổi mật khẩu ngay sau khi đăng nhập.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © 2026 ${appName} - Nhóm 1 - 74DCHT22
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
              Công nghệ phần mềm - UTT
            </p>
          </td>
        </tr>

      </table>
    </div>
  `;

  return { subject, text, html };
};