import ssl
import smtplib
from email.message import EmailMessage
from typing import Optional
from config import Config


def send_smtp_email(recipient: str, subject: str, body: str, sender: Optional[str] = None) -> None:
    sender = sender or Config.SMTP_FROM or Config.SMTP_USERNAME
    if not sender:
        raise ValueError("SMTP sender address is not configured.")
    if not recipient:
        raise ValueError("Email recipient is required.")
    if not Config.SMTP_SERVER or not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
        raise ValueError("SMTP server credentials are not configured.")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient
    message.set_content(body)

    port = Config.SMTP_PORT
    if Config.SMTP_USE_TLS:
        context = ssl.create_default_context()
        with smtplib.SMTP(Config.SMTP_SERVER, port, timeout=20) as server:
            server.starttls(context=context)
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(Config.SMTP_SERVER, port, timeout=20) as server:
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(message)
