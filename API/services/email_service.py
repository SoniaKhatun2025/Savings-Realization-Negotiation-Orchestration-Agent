import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_notification_email(to_email: str, subject: str, message_body: str) -> bool:
    """
    Sends an email notification using SMTP configuration from environment variables.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "True").lower() == "true"

    if not smtp_host or not smtp_user or not smtp_password:
        print("SMTP configuration is missing. Email not sent.")
        return False

    msg = MIMEMultipart()
    msg['From'] = smtp_from
    msg['To'] = to_email
    msg['Subject'] = subject

    # Attach the HTML body
    message_html = message_body.replace('\n', '<br>')
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #1e293b; margin-top: 0;">NexusProcure Notification</h2>
          <div style="font-size: 16px; line-height: 1.5;">
            {message_html}
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">
            This is an automated message from the Savings Realization & Negotiation Orchestration Agent.<br>
            Please do not reply directly to this email.
          </p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_body, 'html'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        if smtp_use_tls:
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False
