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
    <!-- PREHEADER -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Mã OTP đăng ký: ${otpCode} (hết hạn sau ${expiresInMinutes} phút)
    </div>

    <div style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000;">
      <table role="presentation" style="max-width:520px;margin:0 auto;border:1px solid #e5e7eb;">
        
        <!-- HEADER -->
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <img src="https://eoffice.utt.edu.vn/new-logo-utt-login.png"
                 alt="UTT"
                 style="height:40px;">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 12px;">Xin chào,</p>

            <p style="margin:0 0 16px;">
              Bạn vừa yêu cầu đăng ký tài khoản tại <strong>${appName}</strong>.
            </p>

            <p style="margin:0 0 8px;">Mã OTP của bạn là:</p>

            <!-- OTP -->
            <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:12px 0;">
              ${otpCode}
            </p>

            <p style="margin:16px 0;">
              Mã có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.
            </p>

            <p style="font-size:13px;color:#555;margin-top:20px;">
              Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#777;">
            © 2026 ${appName} - Hệ thống Quản lý Thư viện UTT
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
    `Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`,
  ].join('\n');

  const html = `
    <div style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000;">
      <table role="presentation" style="max-width:520px;margin:0 auto;border:1px solid #e5e7eb;">
        
        <!-- HEADER -->
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <img src="https://eoffice.utt.edu.vn/new-logo-utt-login.png"
                 alt="UTT"
                 style="height:40px;">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 12px;">Xin chào,</p>

            <p style="margin:0 0 16px;">
              Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>${appName}</strong>.
            </p>

            <p style="margin:0 0 8px;">Mã OTP của bạn là:</p>

            <!-- OTP -->
            <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:12px 0;">
              ${otpCode}
            </p>

            <p style="margin:16px 0;">
              Mã có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.
            </p>

            <p style="font-size:13px;color:#555;margin-top:20px;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#777;">
            © 2026 ${appName} - Hệ thống Quản lý Thư viện UTT
          </td>
        </tr>

      </table>
    </div>
  `;

  return { subject, text, html };
};

const formatDateTimeVi = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const buildBorrowRequestEmailTemplate = (params: {
  appName: string;
  readerName: string;
  bookTitle: string;
  pickupDeadline: Date | string;
}) => {
  const { appName, readerName, bookTitle, pickupDeadline } = params;
  const pickupDeadlineText = formatDateTimeVi(pickupDeadline);

  const subject = `[${appName}] Đăng ký mượn sách thành công`;

  const text = [
    `Xin chào ${readerName},`,
    ``,
    `Bạn đã đăng ký mượn sách thành công.`,
    `Tên sách: ${bookTitle}`,
    `Hạn đến thư viện nhận sách trước: ${pickupDeadlineText}`,
    ``,
    `Vui lòng đến nhận sách đúng hạn.`,
  ].join('\n');

  const html = `
    <!-- PREHEADER -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Xác nhận mượn sách: ${bookTitle}
    </div>

    <div style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000;">
      <table role="presentation" style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;">

        <!-- HEADER -->
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <img src="https://eoffice.utt.edu.vn/new-logo-utt-login.png"
                 alt="UTT"
                 style="height:40px;">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px;line-height:1.6;">
            <p style="margin:0 0 12px;">
              Xin chào <strong>${readerName}</strong>,
            </p>

            <p style="margin:0 0 12px;">
              Bạn đã đăng ký mượn sách thành công tại <strong>${appName}</strong>.
            </p>

            <p style="margin:12px 0;">
              <strong>Tên sách:</strong><br>
              ${bookTitle}
            </p>

            <p style="margin:12px 0;">
              <strong>Hạn đến thư viện nhận sách trước:</strong><br>
              ${pickupDeadlineText}
            </p>

            <p style="margin-top:16px;">
              Vui lòng đến nhận sách đúng hạn theo quy định.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#777;">
            © 2026 ${appName} - Hệ thống Quản lý Thư viện UTT
          </td>
        </tr>

      </table>
    </div>
  `;

  return { subject, text, html };
};

export const buildBorrowApprovedEmailTemplate = (params: {
  appName: string;
  readerName: string;
  bookTitle: string;
  borrowDate: Date | string;
  dueDate: Date | string;
}) => {
  const { appName, readerName, bookTitle, borrowDate, dueDate } = params;
  const borrowDateText = formatDateTimeVi(borrowDate);
  const dueDateText = formatDateTimeVi(dueDate);

  const subject = `[${appName}] Phiếu mượn đã được duyệt`;

  const text = [
    `Xin chào ${readerName},`,
    ``,
    `Phiếu mượn sách của bạn đã được duyệt.`,
    `Tên sách: ${bookTitle}`,
    `Ngày mượn: ${borrowDateText}`,
    `Hạn trả: ${dueDateText}`,
    ``,
    `Vui lòng theo dõi hạn trả để tránh bị phạt.`,
  ].join('\n');

  const html = `
    <!-- PREHEADER -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Phiếu mượn đã được duyệt - ${bookTitle}
    </div>

    <div style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000;">
      <table role="presentation" style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;">

        <!-- HEADER -->
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <img src="https://eoffice.utt.edu.vn/new-logo-utt-login.png"
                 alt="UTT"
                 style="height:40px;">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px;line-height:1.6;">
            <p style="margin:0 0 12px;">
              Xin chào <strong>${readerName}</strong>,
            </p>

            <p style="margin:0 0 12px;">
              Phiếu mượn sách của bạn tại <strong>${appName}</strong> đã được duyệt.
            </p>

            <!-- INFO BLOCK -->
            <table role="presentation" style="width:100%;margin:16px 0;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;width:40%;">
                  <strong>Tên sách</strong>
                </td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  ${bookTitle}
                </td>
              </tr>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  <strong>Ngày mượn</strong>
                </td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  ${borrowDateText}
                </td>
              </tr>
              <tr>
                <td style="padding:8px;">
                  <strong>Hạn trả</strong>
                </td>
                <td style="padding:8px;">
                  ${dueDateText}
                </td>
              </tr>
            </table>

            <p style="margin-top:16px;">
              Vui lòng theo dõi hạn trả để tránh phát sinh phí phạt.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#777;">
            © 2026 ${appName} - Hệ thống Quản lý Thư viện UTT
          </td>
        </tr>

      </table>
    </div>
  `;

  return { subject, text, html };
};

export const buildBorrowDueSoonReminderEmailTemplate = (params: {
  appName: string;
  readerName: string;
  bookTitle: string;
  dueDate: Date | string;
  daysLeft: number;
}) => {
  const { appName, readerName, bookTitle, dueDate, daysLeft } = params;
  const dueDateText = formatDateTimeVi(dueDate);

  const subject = `[${appName}] Nhắc hạn trả sách (${daysLeft} ngày còn lại)`;

  const text = [
    `Xin chào ${readerName},`,
    ``,
    `Sách bạn đang mượn sắp đến hạn trả.`,
    `Tên sách: ${bookTitle}`,
    `Còn ${daysLeft} ngày đến hạn trả (${dueDateText}).`,
    ``,
    `Vui lòng sắp xếp thời gian trả sách đúng hạn để tránh phát sinh phí.`,
  ].join('\n');

  const html = `
    <!-- PREHEADER -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Còn ${daysLeft} ngày đến hạn trả sách
    </div>

    <div style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000;">
      <table role="presentation" style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;">

        <!-- HEADER -->
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <img src="https://eoffice.utt.edu.vn/new-logo-utt-login.png"
                 alt="UTT"
                 style="height:40px;">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px;line-height:1.6;">
            <p style="margin:0 0 12px;">
              Xin chào <strong>${readerName}</strong>,
            </p>

            <p style="margin:0 0 12px;">
              Sách bạn đang mượn tại <strong>${appName}</strong> sắp đến hạn trả.
            </p>

            <!-- INFO BLOCK -->
            <table role="presentation" style="width:100%;margin:16px 0;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;width:40%;">
                  <strong>Tên sách</strong>
                </td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  ${bookTitle}
                </td>
              </tr>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  <strong>Hạn trả</strong>
                </td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  ${dueDateText}
                </td>
              </tr>
              <tr>
                <td style="padding:8px;">
                  <strong>Thời gian còn lại</strong>
                </td>
                <td style="padding:8px;">
                  <strong>${daysLeft} ngày</strong>
                </td>
              </tr>
            </table>

            <p style="margin-top:16px;">
              Vui lòng sắp xếp thời gian trả sách đúng hạn để tránh phát sinh phí.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#777;">
            © 2026 ${appName} - Hệ thống Quản lý Thư viện UTT
          </td>
        </tr>

      </table>
    </div>
  `;

  return { subject, text, html };
};

export const buildBorrowOverdueReminderEmailTemplate = (params: {
  appName: string;
  readerName: string;
  bookTitle: string;
  dueDate: Date | string;
  overdueDays: number;
}) => {
  const { appName, readerName, bookTitle, dueDate, overdueDays } = params;
  const dueDateText = formatDateTimeVi(dueDate);

  const subject = `[${appName}] Cảnh báo: Sách đã quá hạn ${overdueDays} ngày`;

  const text = [
    `Xin chào ${readerName},`,
    ``,
    `Sách bạn đang mượn đã quá hạn.`,
    `Tên sách: ${bookTitle}`,
    `Quá hạn: ${overdueDays} ngày`,
    `Hạn trả trước đó: ${dueDateText}`,
    ``,
    `Vui lòng trả sách sớm nhất có thể để tránh phát sinh thêm phí.`,
  ].join('\n');

  const html = `
    <!-- PREHEADER -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Sách đã quá hạn ${overdueDays} ngày
    </div>

    <div style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000;">
      <table role="presentation" style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;">

        <!-- HEADER -->
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <img src="https://eoffice.utt.edu.vn/new-logo-utt-login.png"
                 alt="UTT"
                 style="height:40px;">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px;line-height:1.6;">
            <p style="margin:0 0 12px;">
              Xin chào <strong>${readerName}</strong>,
            </p>

            <p style="margin:0 0 12px;">
              Sách bạn đang mượn tại <strong>${appName}</strong> đã quá hạn.
            </p>

            <!-- INFO BLOCK -->
            <table role="presentation" style="width:100%;margin:16px 0;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;width:40%;">
                  <strong>Tên sách</strong>
                </td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  ${bookTitle}
                </td>
              </tr>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  <strong>Hạn trả</strong>
                </td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                  ${dueDateText}
                </td>
              </tr>
              <tr>
                <td style="padding:8px;">
                  <strong>Quá hạn</strong>
                </td>
                <td style="padding:8px;">
                  <strong>${overdueDays} ngày</strong>
                </td>
              </tr>
            </table>

            <p style="margin-top:16px;">
              Vui lòng trả sách sớm nhất có thể để tránh phát sinh thêm phí phạt.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#777;">
            © 2026 ${appName} - Hệ thống Quản lý Thư viện UTT
          </td>
        </tr>

      </table>
    </div>
  `;

  return { subject, text, html };
};