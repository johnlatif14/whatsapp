require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// CSRF protection
const csrfProtection = csrf({ cookie: false });
app.use(csrfProtection);

// Helpers لقراءة وحفظ البيانات
function saveData(data) {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

function readData() {
  if (!fs.existsSync('data.json')) return [];
  return JSON.parse(fs.readFileSync('data.json'));
}

// صفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// صفحة تسجيل دخول الأدمن
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// استقبال رقم الهاتف
app.post('/send-otp', (req, res) => {
  const phone = req.body.phone;
  if(!phone) return res.send('يرجى إدخال رقم الهاتف');

  const otp = Math.floor(1000 + Math.random() * 9000); // OTP وهمي
  const data = readData();
  data.push({ phone, otp });
  saveData(data);

  res.redirect('/otp.html?phone=' + phone);
});

// صفحة OTP
app.get('/otp.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/otp.html'));
});

// التحقق من OTP
app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const data = readData();
  const record = data.find(d => d.phone === phone && d.otp == otp);

  if (record) {
    res.redirect('/test.html');
  } else {
    res.send('<h2>OTP خاطئ، حاول مرة أخرى</h2><a href="/">رجوع</a>');
  }
});

// صفحة "متثقش في حد تاني"
app.get('/test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/test.html'));
});

// تسجيل دخول الأدمن
app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if(username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS){
    req.session.admin = true;
    res.redirect('/dashboard.html');
  } else {
    res.send('<h2>خطأ في بيانات الدخول</h2><a href="/login.html">رجوع</a>');
  }
});

// صفحة الأدمن
app.get('/dashboard.html', (req, res) => {
  if(req.session.admin){
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
  } else {
    res.redirect('/login.html');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
