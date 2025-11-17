import React from 'react';

export default function AdminForbidden() {
  return (
    <main className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>403</h1>
        <p>Accès non autorisé.</p>
      </div>
    </main>
  );
}


