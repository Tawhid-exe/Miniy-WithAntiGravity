import { useState } from 'react';
import './FloatingChat.css';

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        {
            name: 'WhatsApp',
            color: '#25D366',
            appUrl: 'whatsapp://send?phone=8801234567890&text=Hello!%20I%20have%20a%20query.',
            webUrl: 'https://wa.me/8801234567890',
            icon: '💬'
        },
        {
            name: 'Facebook',
            color: '#1877F2',
            appUrl: 'fb://page/100083295819385',
            webUrl: 'https://facebook.com/miniy.store',
            icon: '👥'
        },
        {
            name: 'Instagram',
            color: '#E1306C',
            appUrl: 'instagram://user?username=miniy.store',
            webUrl: 'https://instagram.com/miniy.store',
            icon: '📸'
        }
    ];

    const handleContact = (item) => {
        // Attempt deep link protocol, fallback to web URL on fail
        const start = Date.now();
        window.location.href = item.appUrl;

        setTimeout(() => {
            if (Date.now() - start < 1500) {
                window.open(item.webUrl, '_blank', 'noopener,noreferrer');
            }
        }, 1000);
    };

    return (
        <div className="floating-chat-container">
            <div className={`chat-options ${isOpen ? 'show' : ''}`}>
                {links.map((item, idx) => (
                    <button 
                        key={idx}
                        className="chat-option-btn" 
                        style={{ '--btn-color': item.color }}
                        onClick={() => handleContact(item)}
                    >
                        <span className="btn-icon">{item.icon}</span>
                        <span className="btn-name">{item.name}</span>
                    </button>
                ))}
            </div>
            <button 
                className={`chat-trigger-fab ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Contact us"
            >
                <span className="fab-icon">✦</span>
            </button>
        </div>
    );
}
