import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../src/assets/bootstrap-4.0.0-dist/css/bootstrap.min.css';

function Authentification() {
  const navigate = useNavigate();
  const [networkInfo, setNetworkInfo] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('http://localhost:5173');
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
  async function fetchNetworkInfo() {
    try {
      const host = window.location.hostname;
      const apiProbe = `http://${host}:3001`;
      const res = await fetch(`${apiProbe}/api/network-info`);
      const data = await res.json();

      // stocker state + localStorage pour usage ultérieur
      setNetworkInfo(data);
      setQrCodeUrl(data.viteUrl);
      localStorage.setItem('apiUrl', data.apiUrl);
    } catch (err) {
      console.error("Erreur réseau:", err);
      // fallback sûr : construire apiUrl à partir de l'IP actuelle du navigateur
      const host = window.location.hostname || 'localhost';
      const fallbackApi = `http://${host}:3001/api`;
      setNetworkInfo({ apiUrl: fallbackApi, viteUrl: `http://${host}:5173` });
      localStorage.setItem('apiUrl', fallbackApi);
      setQrCodeUrl(`http://${host}:5173`);
    }
  }
  fetchNetworkInfo();
}, []);



  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrCodeUrl)}`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Priorité : localStorage.apiUrl -> networkInfo.apiUrl -> derived localhost:3001 (last resort)
const storedApi = localStorage.getItem('apiUrl');
const apiUrlToUse = storedApi || (networkInfo && networkInfo.apiUrl) || `http://${window.location.hostname}:3001/api`;
const apiBase = apiUrlToUse.replace(/\/api\/?$/, '');
const loginUrl = `${apiBase}/api/auth/login`;
// (optionnel) console.debug('Login URL used:', loginUrl);


      const resp = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricule_admin: matricule.trim(), mot_de_passe: password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        const msg = data && data.error ? data.error : 'Erreur authentification';
        setIsLoading(false);
        console.error('Login error:', msg);
        alert(msg);
        return;
      }

      const { admin, token } = data;

      try {
        // Stocke l'objet admin et le token dans localStorage pour persistance entre pages
        localStorage.setItem('admin', JSON.stringify(admin));
        if (token) localStorage.setItem('authToken', token);
        // Optionnel : stocker également un petit flag pour savoir qu'on est connecté
        localStorage.setItem('isAuthenticated', '1');
      } catch (e) {
        console.warn('Impossible de sauvegarder en localStorage', e);
      }

      setIsLoading(false);
      navigate('/accueil');
          }      catch (err) {
      console.error('Erreur during login request:', err);
      setIsLoading(false);
      alert('Erreur réseau lors de l\'authentification.');
    }
  };

  // Slightly reduced sizing across the page
  const pageStyle = {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#6AA84F',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '16px' : '28px',
    position: 'relative',
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    padding: isMobile ? '1rem' : '1.5rem',
    borderRadius: '10px',
    width: '100%',
    maxWidth: isMobile ? '100%' : '360px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
    margin: '0 auto',
    zIndex: 2,
  };

  const buttonStyle = {
    backgroundColor: '#ffc107',
    color: '#ffffff',
    fontWeight: 700,
    width: '100%',
    padding: isMobile ? '10px' : '12px',
    fontSize: isMobile ? '0.85rem' : '0.95rem',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    transition: 'background-color 0.18s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '10px' : '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: isMobile ? '0.85rem' : '0.95rem',
    transition: 'border-color 0.16s ease',
    boxSizing: 'border-box',
  };

  const loadingSpinnerStyle = {
    width: '14px',
    height: '14px',
    border: '2px solid transparent',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const qrImageStyle = {
    position: 'absolute',
    bottom: isMobile ? '10px' : '14px',
    right: isMobile ? '10px' : '14px',
    width: '60px',
    height: '60px',
    border: '2px solid #6AA84F',
    borderRadius: '6px',
    backgroundColor: 'white',
    zIndex: 3,
  };

  return (
    <div style={pageStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Small accessibility tweak: focus outline */
          input:focus, button:focus {
            outline: 3px solid rgba(33,150,243,0.12);
            outline-offset: 2px;
          }
        `}
      </style>

      <h1
        style={{
          color: 'white',
          textAlign: 'center',
          marginBottom: isMobile ? '0.9rem' : '1.6rem',
          fontSize: isMobile ? '1.5rem' : '2.05rem',
          fontWeight: '700',
          textShadow: '1px 1px 2px rgba(0,0,0,0.25)',
          zIndex: 2,
          letterSpacing: '0.4px',
        }}
      >
        MAGASIN IT
      </h1>

      <div style={cardStyle}>
        <h5
          style={{
            color: '#1E88E5',
            textAlign: 'center',
            marginBottom: isMobile ? '1.1rem' : '1.6rem',
            fontSize: isMobile ? '1.05rem' : '1.25rem',
            fontWeight: '700',
          }}
        >
          🔐 Identification
        </h5>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: isMobile ? '0.95rem' : '1.2rem' }}>
            <label
              htmlFor="matricule"
              style={{
                color: '#555',
                display: 'block',
                marginBottom: '0.45rem',
                fontWeight: '500',
                fontSize: isMobile ? '0.82rem' : '0.95rem',
              }}
            >
              👤 Matricule
            </label>
            <input
              type="text"
              id="matricule"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              style={inputStyle}
              placeholder="Votre identifiant..."
              required
              onFocus={(e) => (e.target.style.borderColor = '#2196F3')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ marginBottom: isMobile ? '1.1rem' : '1.4rem' }}>
            <label
              htmlFor="password"
              style={{
                color: '#555',
                display: 'block',
                marginBottom: '0.45rem',
                fontWeight: '500',
                fontSize: isMobile ? '0.82rem' : '0.95rem',
              }}
            >
              🔒 Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="Votre mot de passe..."
              required
              onFocus={(e) => (e.target.style.borderColor = '#2196F3')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <button
            type="submit"
            style={{
              ...buttonStyle,
              backgroundColor: isLoading ? '#bdbdbd' : '#ffc107',
              opacity: isLoading ? 0.85 : 1,
            }}
            disabled={isLoading}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#e0a800')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#ffc107')}
          >
            {isLoading ? (
              <>
                <div style={loadingSpinnerStyle} />
                <span style={{ marginLeft: 6 }}>Connexion...</span>
              </>
            ) : (
              <> S'IDENTIFIER</>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '16px',
            padding: '10px',
            backgroundColor: '#e9f5ff',
            borderRadius: '6px',
            border: '1px solid #cfe9ff',
          }}
        >
          <p style={{ margin: 0, color: '#005fa3', fontSize: '11.5px', textAlign: 'center' }}>
            💡 <strong>Conseil :</strong> Utilisez le QR code pour vous connecter depuis votre mobile
          </p>
        </div>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <p style={{ color: 'white', fontSize: '11px', opacity: 0.82, margin: 0 }}>
          © 2025 Gestion des Stocks - Version 1.0
        </p>
      </div>

      <img
        src={qrCodeImageUrl}
        alt="QR Code pour l'application"
        style={qrImageStyle}
        onError={(e) => {
          console.error('Erreur chargement QR code');
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
}

export default Authentification;
