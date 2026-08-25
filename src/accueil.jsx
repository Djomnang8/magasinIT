import React, { useState, useEffect } from 'react';
import '../src/assets/bootstrap-4.0.0-dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import logoImg from '../src/assets/eneo-Cameroon.jpg';

const Accueil = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logoWidth = Math.max(70, Math.min(120, windowWidth * 0.22));
  const logoHeight = logoWidth * 0.4;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#F5F6F8',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      padding: '2vh 4vw',
      backgroundColor: '#fff',
      borderBottom: '1px solid #E0E0E0',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4vh 0',
    },
    title: {
      fontSize: 'clamp(24px, 5vw, 36px)',
      fontWeight: 'bold',
      color: '#21222A',
      marginBottom: '4vh',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridGap: '18px',
      width: '90%',
      maxWidth: '900px',
    },
    logoutContainer: {
      position: 'fixed',
      right: '2.2vw',
      bottom: '4.2vh',
      zIndex: 60,
    },
    logoutBtnInline: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '8px 14px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
      border: 'none',
      cursor: 'pointer',
    },
    logoutTextInline: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#21222A',
      marginLeft: '10px',
      lineHeight: 1,
    },
  };

  const cards = [
    { to: '/action', icon: '📦', color: '#2196F3', label: 'Stock' },
    { to: '/fournisseurs', icon: '🛒', color: '#4CAF50', label: 'Fournisseurs' },
    { to: '/employe', icon: '🧑‍💼', color: '#9C27B0', label: 'Employés' },
    { to: '/livraison', icon: '🚚', color: '#00BCD4', label: 'Livraison' },
    { to: '/inventaire', icon: '📈', color: '#FFEB3B', label: 'Inventaire' },
    { to: '/admin', icon: '👨‍💻', color: '#FF5722', label: 'Administrateur' },
  ];

  return (
    <div style={styles.container}>
      <style>{`
        :root {
          --card-hover-color: #0070B2;
          --card-radius: 12px;
          --card-bg: #ffffff;
          --iconbox-bg: #F1F2F6;
        }

        .accueil-grid-button {
          background: var(--card-bg);
          border-radius: var(--card-radius);
          padding: 20px 0; /* réduit légèrement la taille verticale */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.07);
          border: none;
          cursor: pointer;
          transition: transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms ease, background-color 220ms ease;
          transform-origin: center;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          min-height: 90px; /* garantit une hauteur cohérente */
        }

        .accueil-grid-button:focus {
          box-shadow: 0 6px 18px rgba(0,112,178,0.18);
        }

        .accueil-grid-button:hover,
        .accueil-grid-button:focus,
        .accueil-grid-button.hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          background-color: var(--card-hover-color);
          color: #ffffff;
        }

        .accueil-iconbox {
          background-color: var(--iconbox-bg);
          border-radius: 8px;
          padding: 10px; /* réduit la taille de l'icon box */
          margin-bottom: 10px;
          transition: background-color 220ms ease, color 220ms ease, transform 220ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
        }

        .accueil-grid-button:hover .accueil-iconbox,
        .accueil-grid-button:focus .accueil-iconbox {
          background-color: rgba(255,255,255,0.12);
        }

        .accueil-card-text {
          font-size: clamp(13px, 2.2vw, 16px); /* taille de texte légèrement réduite */
          color: #21222A;
          font-weight: 600;
          text-align: center;
          transition: color 220ms ease;
          padding: 0 6px;
          white-space: nowrap;
        }

        .accueil-grid-button:hover .accueil-card-text,
        .accueil-grid-button:focus .accueil-card-text {
          color: #FFFFFF;
        }

        .accueil-icon {
          font-size: 28px; /* icône légèrement plus petite */
          display: inline-block;
          transition: transform 220ms ease, filter 220ms ease;
          line-height: 1;
        }

        .accueil-grid-button:hover .accueil-icon,
        .accueil-grid-button:focus .accueil-icon {
          transform: scale(1.06);
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12));
        }

        /* logout button styling and hover animation */
        .logout-button {
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 12px;
          padding: 8px 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.07);
          border: none;
          cursor: pointer;
          transition: transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
          -webkit-tap-highlight-color: transparent;
          font-weight: 700;
        }

        .logout-button:focus {
          box-shadow: 0 6px 18px rgba(0,112,178,0.18);
        }

        .logout-button:hover,
        .logout-button:focus {
          transform: translateY(-4px);
          background-color: var(--card-hover-color);
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }

        .logout-icon {
          font-size: 22px;
          line-height: 1;
          transition: transform 220ms ease;
        }

        .logout-button:hover .logout-icon,
        .logout-button:focus .logout-icon {
          transform: translateY(-2px) scale(1.02);
        }

        .logout-text {
          margin-left: 10px;
          font-size: 14px;
          color: #21222A;
          transition: color 220ms ease;
          font-weight: 700;
          line-height: 1;
        }

        .logout-button:hover .logout-text,
        .logout-button:focus .logout-text {
          color: #FFFFFF;
        }

        /* Responsive columns */
        @media (max-width: 880px) {
          .accueil-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .accueil-grid {
            grid-template-columns: repeat(1, 1fr);
          }
          .accueil-grid-button {
            padding: 18px 0;
          }
        }
      `}</style>

      <header style={styles.header}>
        <img
          src={logoImg}
          alt="Eneo Cameroon Logo"
          style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}
        />
      </header>

      <main style={styles.main}>
        <h1 style={styles.title}>Page d'Accueil</h1>
        <div className="accueil-grid" style={styles.grid}>
          {cards.map(({ to, icon, color, label }) => (
            <button
              key={to}
              className="accueil-grid-button"
              onClick={() => navigate(to)}
              aria-label={label}
              title={label}
            >
              <div
                className="accueil-iconbox"
                style={{ color }}
                aria-hidden="true"
              >
                <span className="accueil-icon" style={{ color }}>{icon}</span>
              </div>
              <span className="accueil-card-text">{label}</span>
            </button>
          ))}
        </div>
      </main>

      <div style={styles.logoutContainer}>
        <button
          className="logout-button"
          onClick={() => navigate('/')}
          aria-label="Déconnexion"
          title="Déconnexion"
        >
          <span className="logout-icon">🚪</span>
          <span className="logout-text">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Accueil;
