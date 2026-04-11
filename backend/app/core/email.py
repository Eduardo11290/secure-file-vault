import resend
from app.core.config import settings


def send_share_email(
    recipient_email: str,
    sender_email: str,
    filename: str,
    download_url: str,
) -> bool:
    """
    Sends a secure file share email to the recipient.
    Returns True on success, False on failure.
    """
    if not settings.RESEND_API_KEY:
        raise ValueError("RESEND_API_KEY is not configured in .env")

    resend.api_key = settings.RESEND_API_KEY

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

              <!-- Header -->
              <tr>
                <td style="padding-bottom:32px;text-align:center;">
                  <span style="font-size:28px;font-weight:800;background:linear-gradient(90deg,#34d399,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                    SecureVault
                  </span>
                  <p style="margin:4px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#64748b;">
                    Enterprise Edition
                  </p>
                </td>
              </tr>

              <!-- Card -->
              <tr>
                <td style="background-color:#1e293b;border-radius:16px;border:1px solid #334155;padding:40px 36px;">

                  <!-- Icon -->
                  <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;text-align:center;">
                      🔒
                    </div>
                  </div>

                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f5f9;text-align:center;">
                    Secure File Shared
                  </h1>
                  <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;text-align:center;">
                    <strong style="color:#e2e8f0;">{sender_email}</strong> shared a file with you
                  </p>

                  <!-- File info box -->
                  <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;">
                      File
                    </p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#e2e8f0;font-family:monospace;word-break:break-all;">
                      {filename}
                    </p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="{download_url}"
                       style="display:inline-block;background:#10b981;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.3px;">
                      ⬇ Download Secure File
                    </a>
                  </div>

                  <!-- Warning box -->
                  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.6;">
                      🔥 <strong>Burn after reading</strong> — this link can only be used <strong>once</strong>.<br>
                      ⏱ Expires automatically after <strong>24 hours</strong>.<br>
                      🛡 File is encrypted with <strong>AES-256-GCM</strong> at all times.
                    </p>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding-top:24px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                    If you didn't expect this file, you can safely ignore this email.<br>
                    This message was sent via <strong style="color:#64748b;">SecureVault</strong>.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    params = {
        "from": "SecureVault <onboarding@resend.dev>",
        "to": [recipient_email],
        "subject": f"🔒 {sender_email} shared a secure file with you",
        "html": html_body,
    }

    resend.Emails.send(params)
    return True
