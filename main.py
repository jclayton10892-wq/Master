from fastapi import FastAPI
from pydantic import BaseModel
from email import message  # stdlib
import importlib

app = FastAPI()

# import email endpoint definitions
email_mod = importlib.import_module('email')  # our local email.py

class Quote(BaseModel):
    client: str
    materials: float
    hours: float
    overhead_pct: float = 0.15
    profit_pct: float = 0.25
    existing_customer: bool = False

@app.get('/health')
def health():
    return {"status":"ok"}

@app.post('/quote')
def make_quote(q: Quote):
    # labor rate blended for 3-man crew: 20+20+15 = $55/hr
    labor = q.hours * 55
    overhead = (labor + q.materials) * q.overhead_pct
    base = labor + q.materials + overhead
    suggested = base * (1 + q.profit_pct)
    price = suggested * (0.85 if q.existing_customer else 1.0)
    return {
        "labor_cost": round(labor,2),
        "overhead": round(overhead,2),
        "base_cost": round(base,2),
        "suggested_price": round(suggested,2),
        "final_price": round(price,2)
    }


from pydantic import BaseModel
from typing import Optional

class HtmlDoc(BaseModel):
    html: str

@app.post('/render_pdf')
def render_pdf(doc: HtmlDoc):
    # Try WeasyPrint HTML->PDF
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=doc.html).write_pdf()
        import base64
        return {"ok": True, "pdf_b64": base64.b64encode(pdf_bytes).decode('utf-8')}
    except Exception as e:
        return {"ok": False, "error": str(e)}
