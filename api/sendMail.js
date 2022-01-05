import { createTransport } from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { ProcessingError } from "../src/ProcessingError";
require("dotenv").config();

function getTransporter() {
  return createTransport({
    host: process.env.HOST,
    port: process.env.PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_ADRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

const transport = getTransporter();

async function sendMail(options) {
  try {
    await transport.sendMail(options);
    return { success: true };
  } catch (error) {
    throw new ProcessingError("An error occurred while sending an email", 500);
  }
}
const from = `Seva Incorporation - ${process.env.EMAIL_ADRESS}`;
function formSubmit(formData) {
  let html = "";
  for (const option in formData) {
    html += option + " : " + formData[option] + "<br/>";
  }
  return sendMail({
    from,
    to: process.env.EMAIL_TO_USER,
    subject: "New form submission",
    html: sanitizeHtml(html),
  });
}

const history = new Map();
const rateLimit = (ip, limit = 3) => {
  const count = history.get(ip) ? history.get(ip) : 0;
  if (count > limit) {
    throw new ProcessingError("You've sent too many requests", 429);
  }
  history.set(ip, count + 1);
};

const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameValid = /[a-zA-ZЁёА-я]+$/;

const validate = (body) => {
  const { email, name, password, confirmPassword } = body;
  if (!email || !name || !password || !confirmPassword) {
    throw new ProcessingError("You must fill all the fields!");
  }
  if (!emailValid.test(email)) {
    throw new ProcessingError("Invalid email is entered");
  }
  if (!nameValid.test(name)) {
    throw new ProcessingError("Invalid name is entered");
  }
  if (password !== confirmPassword) {
    throw new ProcessingError("Passwords should match");
  }
};

module.exports = async (req, res) => {
  try {
    rateLimit(req.headers["x-real-ip"], 5);
    validate(req.body);
    const result = await formSubmit(req.body);
    res.json({ result });
  } catch (e) {
    return res.status(e.status).json({
      status: e.status,
      errors: [e.message],
      result: {
        success: false,
      },
    });
  }
};
