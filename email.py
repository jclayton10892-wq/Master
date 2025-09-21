import os, base64, datetime, uuid, smtplib
from email.message import EmailMessage
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class EmailReq(BaseModel):
    to: str
    subject: str
    html: str
    attachments: list[dict] = []  # [{"filename": "...", "content_b64": "...", "mime": "text/html"}]

@app.post('/email')
def send_email(req: EmailReq):
    msg = EmailMessage()
    msg['From'] = os.getenv('SMTP_FROM', 'no-reply@scenicroots.local')
    msg['To'] = req.to
    msg['Subject'] = req.subject
    msg.set_content('Your mail client does not support HTML.')
    msg.add_alternative(req.html, subtype='html')
    for a in req.attachments:
        data = base64.b64decode(a.get('content_b64',''))
        mime = a.get('mime','application/octet-stream')
        maintype, subtype = mime.split('/',1) if '/' in mime else ('application','octet-stream')
        msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=a.get('filename','attachment'))
    outbox = os.path.join(os.getcwd(), 'outbox')
    os.makedirs(outbox, exist_ok=True)
    fname = f"{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex}.eml"
    path = os.path.join(outbox, fname)
    with open(path, 'wb') as f:
        f.write(bytes(msg))
    sent = False
    if os.getenv('SMTP_HOST'):
        with smtplib.SMTP(os.getenv('SMTP_HOST'), int(os.getenv('SMTP_PORT','587'))) as s:
            if os.getenv('SMTP_STARTTLS','1') == '1':
                s.starttls()
            if os.getenv('SMTP_USER'):
                s.login(os.getenv('SMTP_USER'), os.getenv('SMTP_PASS',''))
            s.send_message(msg)
            sent = True
    return {"saved_eml": path, "sent": sent}
