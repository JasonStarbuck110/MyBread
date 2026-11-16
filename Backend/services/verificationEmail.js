const crypto = require('node:crypto');
const { Resend } = require('resend');

const EXPIRY_MS = 30 * 60 * 1000;

function createVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    const expiresAt = new Date(
        Date.now() + 30 * 60 * 1000
    );

    return {
        token,
        tokenHash,
        expiresAt
    };
}

async function sendVerificationEmail(email, token) {
    const { RESEND_API_KEY, MAIL_FROM, APP_ORIGIN } = process.env;
    if(!RESEND_API_KEY || !MAIL_FROM || !APP_ORIGIN) {
        throw new Error('Email verification is not configured.');
    }

    const origin = new URL(APP_ORIGIN);
    if (origin.protocol !== 'https:' && origin.hostname !== 'localhost') {
        throw new Error('Invalid application origin.');
    }

    const verificationUrl = new URL('/verify-email', origin);
    verificationUrl.hash = `token=${encodeURIComponent(token)}`;
    const resend = new Resend(RESEND_API_KEY);

    const { error } = await resend.emails.send({
        from: MAIL_FROM,
        to: [email],
        subject: 'Verify your MyBread account',
        text: [
            'Welcome to MyBread!',
            '',
            'Verify your email address using this link:',
            verificationUrl.toString(),
            '',
            'This link expires in 30 minutes.',
            'If you did not register, ignore this email.'
        ].join('\n')
    });

    if (error) {
        throw new Error('Failed to send verification email');
    }
}

module.exports = {
    createVerificationToken,
    sendVerificationEmail,
};