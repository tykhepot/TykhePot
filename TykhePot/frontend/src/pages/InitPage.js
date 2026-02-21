import React from 'react';

export default function InitPage() {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      background: '#fff',
      color: '#000',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#000', fontSize: '32px' }}>🚀 Initialize Contract</h1>
      <p style={{ color: '#333', marginTop: '20px' }}>
        This is the initialization page.
      </p>
      <button style={{
        marginTop: '30px',
        padding: '15px 40px',
        fontSize: '18px',
        background: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
      }}>
        Click to Initialize
      </button>
    </div>
  );
}
