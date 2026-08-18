import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"Citi Bank" <${process.env.GMAIL_USER}>`;
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

function baseTemplate(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f8}
    .wrapper{max-width:600px;margin:0 auto;padding:40px 20px}
    .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#003B70,#0066B3);padding:32px;text-align:center}
    .logo{font-size:28px;font-weight:900;color:#fff}
    .body{padding:40px 36px}
    .title{font-size:22px;font-weight:700;color:#003B70;margin-bottom:12px}
    .text{font-size:15px;color:#5F6368;line-height:1.7;margin-bottom:20px}
    .otp-box{background:#f0f4ff;border:2px dashed #003B70;border-radius:12px;padding:24px;text-align:center;margin:24px 0}
    .otp-code{font-size:42px;font-weight:900;color:#003B70;letter-spacing:12px;font-family:monospace}
    .otp-expire{font-size:13px;color:#80868B;margin-top:8px}
    .btn{display:inline-block;padding:14px 36px;background:#003B70;color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;margin:16px 0}
    .divider{height:1px;background:#E8EAED;margin:24px 0}
    .small{font-size:12px;color:#9AA0A6;line-height:1.6}
    .footer{text-align:center;padding:24px;background:#f9f9fb}
    .footer p{font-size:12px;color:#9AA0A6}
    .warning{background:#FFF8E1;border-left:4px solid #FFC107;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0}
    .warning p{font-size:13px;color:#856404}
  </style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header"><div class="logo">CITI®</div>
    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:6px">The Citi Mobile® App</p></div>
    <div class="body">${content}</div>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Citibank, N.A. Member FDIC.</p>
    <p>This is an automated message. Please do not reply.</p>
  </div></div></body></html>`;
}

transporter.verify((error, success) => {
  if (error) console.error('❌ Email error:', error);
  else console.log('✅ Email service ready');
});

export async function sendLoginOTP(email: string, firstName: string, otp: string) {
  const content = `
    <h2 class="title">Verify your identity</h2>
    <p class="text">Hi <strong>${firstName}</strong>, use the code below to complete your Citi login.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-expire">Expires in <strong>10 minutes</strong></div>
    </div>
    <div class="warning"><p>⚠️ Never share this code. Citi will never ask for your OTP.</p></div>
    <div class="divider"></div>
    <p class="small">If you did not attempt to sign in, change your password immediately.</p>`;
  await transporter.sendMail({ from: FROM, to: email, subject: `${otp} is your Citi verification code`, html: baseTemplate(content) });
}

export async function sendPasswordResetOTP(email: string, firstName: string, otp: string) {
  const content = `
    <h2 class="title">Reset your password</h2>
    <p class="text">Hi <strong>${firstName}</strong>, use this code to reset your Citi password.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-expire">Expires in <strong>10 minutes</strong></div>
    </div>
    <div class="warning"><p>⚠️ If you did not request this, ignore this email.</p></div>`;
  await transporter.sendMail({ from: FROM, to: email, subject: `Reset your Citi password — Code: ${otp}`, html: baseTemplate(content) });
}

export async function sendWelcomeEmail(email: string, firstName: string, accountNumber: string) {
  const content = `
    <h2 class="title">Welcome to Citi, ${firstName}!</h2>
    <p class="text">Your Citi checking account has been opened. Here are your details:</p>
    <div class="otp-box" style="text-align:left;padding:20px 24px">
      <p style="font-size:13px;color:#5F6368">Account Number</p>
      <p style="font-size:22px;font-weight:800;color:#003B70;font-family:monospace;letter-spacing:4px">${accountNumber}</p>
      <p style="font-size:13px;color:#5F6368;margin-top:12px">Routing Number</p>
      <p style="font-size:18px;font-weight:700;color:#003B70;font-family:monospace">021000089</p>
      <p style="font-size:13px;color:#5F6368;margin-top:12px">SWIFT Code</p>
      <p style="font-size:18px;font-weight:700;color:#003B70;font-family:monospace">CITIUS33</p>
    </div>
    <a href="${APP_URL}/dashboard" class="btn">Go to My Account →</a>`;
  await transporter.sendMail({ from: FROM, to: email, subject: `Welcome to Citi — Your account is ready`, html: baseTemplate(content) });
}

export async function sendTransactionReceipt({ email, firstName, amount, type, description, reference, balanceAfter, recipientName, recipientBank, date }: {
  email: string; firstName: string; amount: number; type: string;
  description: string; reference: string; balanceAfter: number;
  recipientName?: string; recipientBank?: string; date: Date;
}) {
  const isCredit = ['CREDIT','TRANSFER_IN','ADMIN_CREDIT','DEPOSIT'].includes(type);
  const sign  = isCredit ? '+' : '-';
  const color = isCredit ? '#1A8C4E' : '#D22630';
  const content = `
    <h2 class="title">Transaction Confirmation</h2>
    <p class="text">Hi <strong>${firstName}</strong>, your transaction was processed successfully.</p>
    <div class="otp-box" style="text-align:left;padding:20px 24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <span style="color:#5F6368">Amount</span>
        <span style="font-size:24px;font-weight:900;color:${color}">${sign}$${amount.toFixed(2)}</span>
      </div>
      ${[
        ['Reference', reference],
        ['Description', description],
        ['Date', date.toLocaleString('en-US')],
        ['Status', '✓ Completed'],
        ...(recipientName ? [['Recipient', recipientName]] : []),
        ...(recipientBank ? [['Bank', recipientBank]] : []),
        ['Balance After', `$${balanceAfter.toFixed(2)}`],
      ].map(([l,v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0"><span style="font-size:13px;color:#80868B">${l}</span><span style="font-size:13px;font-weight:600">${v}</span></div>`).join('')}
    </div>
    <a href="${APP_URL}/dashboard/transactions" class="btn">View Transactions →</a>`;
  await transporter.sendMail({ from: FROM, to: email, subject: `Transaction ${isCredit?'Received':'Sent'}: ${sign}$${amount.toFixed(2)} — Ref: ${reference}`, html: baseTemplate(content) });
}