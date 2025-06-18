import os
import smtplib

from email.mime.text import MIMEText

sender = os.getenv("MAIL_USERNAME")
password = os.getenv("MAIL_PASSWORD")
server = os.getenv("MAIL_SERVER")
port = 587
receiver = "youngteee123@gmail.com"

msg = MIMEText("Test email from FlowTech backend.")
msg["Subject"] = "SMTP Test"
msg["From"] = sender
msg["To"] = receiver

with smtplib.SMTP(server, port) as smtp:
    smtp.starttls()
    smtp.login(sender, password)
    smtp.sendmail(sender, receiver, msg.as_string())
print("Sent!")