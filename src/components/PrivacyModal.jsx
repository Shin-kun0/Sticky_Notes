import React from 'react';

export default function PrivacyModal({ onAccept }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '450px', textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Your Privacy Matters</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          Welcome to Sticky Notes! We believe your data belongs to you. 
          <br /><br />
          <strong>All your notes and settings are stored securely and locally on your device.</strong> We do not collect, transmit, or sell any of your personal data.
        </p>
        <button 
          className="save-btn" 
          onClick={onAccept}
          style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
        >
          I Understand & Agree
        </button>
      </div>
    </div>
  );
}
