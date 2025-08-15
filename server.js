require('dotenv').config(); // قراءة .env
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// إعدادات Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// إعدادات CSRF
const csrfProtection = csrf();
app.use(csrfProtection);

// قراءة وحفظ البيانات في data.json
function saveData(data) {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

function readData() {
    if (!fs.existsSync('data.json')) return [];
    const raw = fs.readFileSync('data.json');
    return JSON.parse(raw);
}

// صفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// استقبال رقم التليفون
app.post('/send-otp', (req, res) => {
    const phone = req.body.phone;
    const otp = Math.floor(1000 + Math.random() * 9000); // OTP وهمي

    const data = readData();
    data.push({ phone, otp });
    saveData(data);

    // حفظ الهاتف في الجلسة
    req.session.phone = phone;

    res.redirect('/login.html');
});

// التحقق من OTP
app.post('/verify-otp', (req, res) => {
    const { otp } = req.body;
    const phone = req.session.phone;

    const data = readData();
    const record = data.find(d => d.phone === phone && d.otp == otp);

    if (record) {
        res.redirect('/dashboard.html');
    } else {
        res.send('<h2>OTP خاطئ، حاول مرة تانية</h2><a href="/">رجوع</a>');
    }
});

// تسجيل دخول الادمن
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.isAdmin = true;
        res.redirect('/admin-dashboard.html');
    } else {
        res.send('<h2>بيانات خاطئة</h2><a href="/admin">رجوع</a>');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
