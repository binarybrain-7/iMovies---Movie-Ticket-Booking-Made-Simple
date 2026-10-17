const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: { user, pass },
    });
    logger.info('[Email] Nodemailer SMTP transporter initialized');
  }

  return transporter;
};

const sendBookingConfirmationEmail = async ({ toEmail, username, booking, movie, theatre, show }) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    logger.info(`[Email] SMTP not configured. Skipping physical email delivery for booking ${booking.bookingReference}`);
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    const seatList = booking.seats.map((s) => s.seatNumber).join(', ');
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background: #08090D; color: #F9FAFB; padding: 24px; border-radius: 8px;">
        <h1 style="color: #E50935;">IMovies - Booking Confirmed!</h1>
        <p>Dear ${username},</p>
        <p>Your tickets have been successfully booked. Here are your booking details:</p>
        <div style="background: #111827; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
          <p><strong>Movie:</strong> ${movie.title}</p>
          <p><strong>Theatre:</strong> ${theatre.name} (${theatre.location})</p>
          <p><strong>Date & Time:</strong> ${show.showDate} at ${show.startTime}</p>
          <p><strong>Seats:</strong> ${seatList}</p>
          <p><strong>Total Paid:</strong> ₹${booking.totalAmount}</p>
        </div>
        <p>Present the QR code in your IMovies dashboard at the theatre entrance.</p>
        <p>Enjoy your movie!</p>
        <p style="color: #9CA3AF; font-size: 12px;">IMovies - Movie Ticket Booking Made Simple</p>
      </div>
    `;

    const info = await mailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"IMovies" <tickets@imovies.app>',
      to: toEmail,
      subject: `IMovies Booking Confirmation: ${movie.title} [${booking.bookingReference}]`,
      html: htmlContent,
    });

    logger.info(`[Email] Confirmation email sent to ${toEmail}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`[Email] Failed to send email: ${err.message}`, err);
    return { sent: false, error: err.message };
  }
};

module.exports = {
  sendBookingConfirmationEmail,
};
