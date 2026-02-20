require("dotenv").config();

const mailSender = async (email, title, body) => {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
      console.log("[mailSender] BREVO_API_KEY or SENDER_EMAIL not set. Skipping email.");
      return null;
    }
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "GFGxBVCOE",
          email: process.env.SENDER_EMAIL,
        },
        to: [{ email }],
        subject: title,
        htmlContent: body,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Brevo error:", data.message || response.statusText);
      return null;
    }
    return data;
  } catch (error) {
    console.error("mailSender error:", error.message);
    return null;
  }
};

module.exports = mailSender;
