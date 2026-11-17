import { QRCodeSVG } from 'qrcode.react'

export default function ClassQRCodeModal({ classItem, onClose }) {
    const enrollmentCode = classItem.enrollmentCode
    const joinUrl = new URL('/join-class', window.location.origin)
    joinUrl.searchParams.set('code', enrollmentCode)
    const copyLink = async () => {
    try {
        await navigator.clipboard.writeText(joinUrl.toString())
    } catch (error) {
        console.error('Unable to copy class link:', error)
    }
}

return (
        <div
            className="t-qr-overlay"
            onClick={onClose}
            role="presentation"
        >
        <div
            className="t-qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-qr-title"
            onClick={event => event.stopPropagation()}
        >
        <h2 id="class-qr-title">Join {classItem.name}</h2>
        <p>Scan this QR code to join the class.</p>
        <div className="t-qr-code">
            <QRCodeSVG
                value={joinUrl.toString()}
                size={220}
                level="M"
                marginSize={2}
            />
        </div>
        <p>Enrollment code: <strong>{enrollmentCode}</strong></p>
        <div className="t-qr-actions">
            <button type="button" className="t-btn t-btn-outline" onClick={copyLink}>
            Copy join link
            </button>
            <button type="button" className="t-btn" onClick={onClose}>
                Close
            </button>
            </div>
        </div>
    </div>
    )
}