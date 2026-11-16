const crypto = require('node:crypto');
const { Resend } = require('resend');
const RESET_TTL_MS = 30 * 60 * 1000;

function createPasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');

    return {
        token,
        tokenHash: crypto
            .createHash('sha256')
            .update(token)
            .digest('hex'),
        expiresAt: new Date(Date.now() + RESET_TTL_MS)
    };
}

async function sendPasswordResetEmail(email, token) {
    const { RESEND_API_KEY, MAIL_FROM, APP_ORIGIN } = process.env;
    if (!RESEND_API_KEY || !MAIL_FROM || !APP_ORIGIN) {
        throw new Error('Password reset email is not configured');
    }

    const origin = new URL(APP_ORIGIN);
    const local = ['localhost', '127.0.0.1'].includes(origin.hostname);
    if (
        origin.protocol !== 'https:' &&
        !(local && origin.protocol === 'http:')
    ) {
        throw new Error('APP_ORIGIN must be HTTPS (or local HTTP)');
    }

    const url = new URL('/reset-password', origin);
    url.hash = `token=${encodeURIComponent(token)}`;
    const { error } = await new Resend(RESEND_API_KEY).emails.send({
        from: MAIL_FROM,
        to: [email],
        subject: 'Reset your MyBread password',
        text: [
            'We received a request to reset your MyBread password.',
            '',
            'Open this link to choose a new password:',
            url.toString(),
            '',
            'This link expires in 30 minutes and works only once.',
            'If you did not request a reset, ignore this email.'
        ].join('\n')
    });

    if (error) {
        throw new Error('Resend rejected the password reset email');
    }
}

async function sendPasswordChangedNotice(email) {
    const { RESEND_API_KEY, MAIL_FROM } = process.env;
    if (!RESEND_API_KEY || !MAIL_FROM) return;

    const { error } = await new Resend(RESEND_API_KEY).emails.send({
        from: MAIL_FROM,
        to: [email],
        subject: 'Your MyBread password was changed',
        text: [
            'The password for your MyBread account was changed.',
            'If you made this change, no action is necessary.',
            'If you did not request it, contact your MyBread administrator immediately.'
        ].join('\n')
    });

    if (error) {
        throw new Error('Resend rejected password change notification');
    }
}

module.exports = {
    createPasswordResetToken,
    sendPasswordResetEmail,
    sendPasswordChangedNotice
};