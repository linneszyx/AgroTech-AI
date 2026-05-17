import express from 'express';
import mongoose from "mongoose";
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import cors from 'cors';
import customerdata from './modules/Customer.js';

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5001,
})
  .then(() => console.log("Connected to Database & Listening on localhost:5001"))
  .catch(err => console.error("Database connection error:", err));

app.listen(5001, () => console.log("Server running on port 5001"));

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.post('/signup', async (req, res) => {
  console.log(req.body);
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password || !phone) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  let existingUser;
  try {
    existingUser = await customerdata.findOne({ email });
  } catch (err) {
    console.error("DB lookup error:", err);
    return res.status(500).json({ msg: "Database error, please try again" });
  }

  if (existingUser) {
    return res.status(200).json({ msg: "email exists!.." });
  }

  try {
    const stud = new customerdata({ username, email, password, phone });
    await stud.save();
  } catch (err) {
    console.error("Save error:", err);
    return res.status(500).json({ msg: "Could not create account, please try again" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kukkiupadhyay343@gmail.com',
        pass: '',
      },
    });

    const emailBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background-color: #4CAF50; color: #fff; padding: 15px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f4f4f4; padding: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header"><h2>Registration Successful</h2></div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>Congratulations! Your registration was successful.</p>
          <ul>
            <li>Email: ${email}</li>
            <li>Phone: ${phone}</li>
          </ul>
          <p>Thank you for joining our community.</p>
        </div>
        <div class="footer"><p>© 2024 All rights reserved.</p></div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: 'kukkiupadhyay343@gmail.com',
      to: email,
      subject: 'Registration Successful',
      html: emailBody,
    });

    console.log('Welcome email sent to:', email);
  } catch (emailErr) {
    console.error("Email sending failed (non-fatal):", emailErr.message);
  }

  return res.status(200).json({ msg: "Account registered successfully" });
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  let users;
  try {
    users = await customerdata.findOne({ email });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ msg: "Database error, please try again" });
  }

  if (!users) {
    return res.status(200).json({ msg: "Not registered" });
  }

  if (users.password === password) {
    return res.status(200).json({ msg: "login successful", email: users });
  } else {
    return res.status(200).json({ msg: "password incorrect" });
  }
});


app.put('/forgot', async (req, res) => {
  console.log(req.body.formDataF);
  const { email, password, confirmpassword } = req.body.formDataF;

  if (!email || !password || !confirmpassword) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  let users;
  try {
    users = await customerdata.findOne({ email });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ msg: "Database error, please try again" });
  }

  if (!users) {
    return res.status(200).json({ msg: "email incorrect" });
  }

  if (password !== confirmpassword) {
    return res.status(200).json({ msg: "Passwords do not match" });
  }

  try {
    await customerdata.findByIdAndUpdate(users._id, { password });
    return res.status(200).json({ msg: "password updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ msg: "Could not update password, please try again" });
  }
});
