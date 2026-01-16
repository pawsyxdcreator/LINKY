
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error al montar la aplicación:", error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; color: #475569; padding: 20px;">
        <div>
          <h1 style="color: #6366f1; font-weight: 900; margin-bottom: 10px;">¡Ups! LINKY no pudo cargar</h1>
          <p>La aplicación tuvo un problema al iniciarse. Revisa la consola para más detalles.</p>
        </div>
      </div>
    `;
  }
} else {
  console.error("No se encontró el elemento root para montar la app.");
}
