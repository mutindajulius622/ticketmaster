"""
Email utility for sending ticket confirmation emails.
Uses Python's built-in smtplib. Configure SMTP settings in .env.
If SMTP is not configured, emails are simulated (logged to console).
"""
import smtplib
import os
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import logging

logger = logging.getLogger(__name__)


SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
SMTP_FROM = os.environ.get('SMTP_FROM', SMTP_USER or 'noreply@ticketmaster.com')


def send_ticket_email(recipient_email: str, ticket: dict, event: dict) -> bool:
    """
    Send a ticket confirmation email with the QR code embedded.
    Returns True on success, False on failure.
    """
    try:
        seat = ticket.get('seat_details') or {}
        ticket_number = ticket.get('ticket_number', 'N/A')
        event_title = event.get('title', ticket.get('event_title', 'Event'))
        event_location = event.get('location', 'TBD')
        event_date = event.get('start_date', 'TBD')
        price = ticket.get('price', 0)
        qr_b64 = ticket.get('qr_code', '')

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: Arial, sans-serif; background:#f0f2f5; margin:0; padding:20px; }}
    .card {{ max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1); }}
    .header {{ background:#026CDF; color:#fff; padding:32px; text-align:center; }}
    .header h1 {{ margin:0; font-size:24px; font-weight:900; letter-spacing:-0.5px; }}
    .header p {{ margin:6px 0 0; opacity:0.8; font-size:14px; }}
    .body {{ padding:32px; }}
    .ticket-num {{ text-align:center; font-family:monospace; font-size:13px; color:#999; margin-bottom:20px; }}
    .qr-wrap {{ text-align:center; margin:20px 0; }}
    .qr-wrap img {{ width:200px; height:200px; border:1px solid #eee; border-radius:12px; }}
    .details {{ border-top: 2px dashed #eee; padding-top:20px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; text-align:center; }}
    .detail-item p:first-child {{ font-size:10px; font-weight:900; color:#aaa; text-transform:uppercase; letter-spacing:1px; margin:0; }}
    .detail-item p:last-child {{ font-size:16px; font-weight:700; color:#222; margin:4px 0 0; }}
    .footer {{ text-align:center; padding:20px; background:#f8fafc; color:#aaa; font-size:12px; }}
    .badge {{ display:inline-block; background:#dcfce7; color:#16a34a; font-size:11px; font-weight:900; padding:4px 12px; border-radius:999px; margin-bottom:16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🎟 Your Ticket is Confirmed!</h1>
      <p>{event_title}</p>
    </div>
    <div class="body">
      <div style="text-align:center;">
        <span class="badge">✓ CONFIRMED</span>
      </div>
      <div class="ticket-num">TICKET # {ticket_number}</div>
      {'<div class="qr-wrap"><img src="cid:qrcode" alt="QR Code" /></div>' if qr_b64 else ''}
      <div class="details">
        <div class="detail-item">
          <p>Section</p>
          <p>{seat.get('section', '-')}</p>
        </div>
        <div class="detail-item">
          <p>Row</p>
          <p>{seat.get('row', '-')}</p>
        </div>
        <div class="detail-item">
          <p>Seat</p>
          <p>{seat.get('seat_number', '-')}</p>
        </div>
      </div>
      <div style="margin-top:24px; background:#f8fafc; border-radius:8px; padding:16px;">
        <p style="margin:4px 0; font-size:13px; color:#555;">📍 <strong>Location:</strong> {event_location}</p>
        <p style="margin:4px 0; font-size:13px; color:#555;">📅 <strong>Date:</strong> {event_date}</p>
        <p style="margin:4px 0; font-size:13px; color:#555;">💰 <strong>Price Paid:</strong> ${price:.2f}</p>
      </div>
    </div>
    <div class="footer">
      Please present this ticket (or QR code) at the gate.<br/>
      Ticket Master &copy; 2026
    </div>
  </div>
</body>
</html>
        """

        # Log to console regardless (useful for debugging)
        logger.info(f"[EMAIL] Sending ticket {ticket_number} to {recipient_email}")

        # If SMTP is not configured, just simulate
        if not SMTP_HOST or not SMTP_USER:
            logger.info(f"[EMAIL SIMULATED] No SMTP configured. Would send to: {recipient_email}")
            logger.info(f"[EMAIL SIMULATED] Subject: Your Ticket - {event_title}")
            return True

        msg = MIMEMultipart('related')
        msg['From'] = SMTP_FROM
        msg['To'] = recipient_email
        msg['Subject'] = f"Your Ticket - {event_title} | #{ticket_number}"

        msg.attach(MIMEText(html_body, 'html'))

        # Attach QR code image if available
        if qr_b64:
            qr_bytes = base64.b64decode(qr_b64)
            img = MIMEImage(qr_bytes, _subtype='png')
            img.add_header('Content-ID', '<qrcode>')
            img.add_header('Content-Disposition', 'inline', filename='ticket-qr.png')
            msg.attach(img)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, recipient_email, msg.as_string())

        logger.info(f"[EMAIL] Successfully sent to {recipient_email}")
        return True

    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send to {recipient_email}: {e}")
        return False


def send_welcome_email(recipient_email: str, first_name: str) -> bool:
    """Send a welcome email to a new user who registered via Google OAuth."""
    try:
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: Arial, sans-serif; background:#f0f2f5; margin:0; padding:20px; }}
    .card {{ max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1); }}
    .header {{ background:linear-gradient(135deg,#0047b3,#026cdf); color:#fff; padding:36px; text-align:center; }}
    .header h1 {{ margin:0; font-size:26px; font-weight:900; }}
    .body {{ padding:32px; }}
    .cta {{ display:block; text-align:center; background:#026cdf; color:#fff; text-decoration:none;
            font-weight:bold; padding:14px 28px; border-radius:12px; margin:24px auto; width:fit-content; }}
    .footer {{ text-align:center; padding:20px; background:#f8fafc; color:#aaa; font-size:12px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🎟 Welcome to Ticket Master!</h1>
    </div>
    <div class="body">
      <p style="font-size:16px;color:#333;">Hi <strong>{first_name}</strong>,</p>
      <p style="color:#555;">Your account has been created using your Google account. You can now:</p>
      <ul style="color:#555;line-height:2;">
        <li>⭐ Save your favourite events</li>
        <li>🎫 Purchase &amp; manage tickets</li>
        <li>📲 Download ticket QR codes</li>
        <li>🔄 Transfer tickets to friends</li>
      </ul>
      <a href="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard" class="cta">Go to My Dashboard →</a>
    </div>
    <div class="footer">Ticket Master &copy; 2026 &nbsp;|&nbsp; Powered by Google OAuth</div>
  </div>
</body>
</html>
        """

        logger.info(f"[EMAIL] Welcome email to {recipient_email}")

        if not SMTP_HOST or not SMTP_USER:
            logger.info(f"[EMAIL SIMULATED] Welcome email would be sent to {recipient_email}")
            return True

        msg = MIMEMultipart('related')
        msg['From'] = SMTP_FROM
        msg['To'] = recipient_email
        msg['Subject'] = "Welcome to Ticket Master 🎟"
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, recipient_email, msg.as_string())

        logger.info(f"[EMAIL] Welcome sent to {recipient_email}")
        return True

    except Exception as e:
        logger.error(f"[EMAIL ERROR] Welcome email failed for {recipient_email}: {e}")
        return False
