// src/components/Action.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdLogout,
  MdInventory,
  MdAccountCircle,
  MdLocalShipping
} from 'react-icons/md';
import logoImg from '../src/assets/eneo-Cameroon.jpg';

export default function Action() {
  const navigate = useNavigate();
  const [winW, setWinW] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const logoW = Math.max(70, Math.min(120, winW * 0.22));
  const logoH = logoW * 0.4;
  const cardW = Math.min(320, winW * 0.42);

  return (
    <div style={styles.container}>
      <style>{`
        :root {
          --card-hover-color: #0070B2;
          --card-radius: 12px;
          --card-bg: #ffffff;
          --iconbox-bg: #F1F2F6;
          --back-color: #E74C3C;
          --back-color-dark: #c73b2a;
        }

        /* Cards animation and hover */
        .action-card {
          background: var(--card-bg);
          border-radius: var(--card-radius);
          padding: 20px 0;
          margin: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: none;
          cursor: pointer;
          transition: transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms ease, background-color 220ms ease;
          transform-origin: center;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .action-card:focus {
          box-shadow: 0 6px 18px rgba(0,112,178,0.18);
        }

        .action-card:hover,
        .action-card:focus {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          background-color: var(--card-hover-color);
          color: #ffffff;
        }

        .action-iconwrap {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          background-color: var(--iconbox-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          transition: background-color 220ms ease, transform 220ms ease;
        }

        .action-card:hover .action-iconwrap,
        .action-card:focus .action-iconwrap {
          background-color: rgba(255,255,255,0.12);
        }

        .action-card-text {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          text-align: center;
          transition: color 220ms ease;
        }

        .action-card:hover .action-card-text,
        .action-card:focus .action-card-text {
          color: #ffffff;
        }

        .action-icon {
          transition: transform 220ms ease, filter 220ms ease;
          color: #000 !important; /* garder les icônes en noir en toutes circonstances */
        }

        .action-card:hover .action-icon,
        .action-card:focus .action-icon {
          transform: scale(1.06);
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12));
        }

        /* Logout button animation and hover (same style as cards) */
        .action-logout-btn {
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 8px;
          padding: 10px 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border: none;
          cursor: pointer;
          transition: transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease, color 220ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .action-logout-btn:focus {
          box-shadow: 0 6px 18px rgba(0,112,178,0.18);
        }

        .action-logout-btn:hover,
        .action-logout-btn:focus {
          transform: translateY(-4px);
          background-color: var(--card-hover-color);
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }

        .action-logout-icon {
          transition: transform 220ms ease;
          color: #000 !important; /* icône Déconnexion toujours noire */
        }

        .action-logout-btn:hover .action-logout-icon,
        .action-logout-btn:focus .action-logout-icon {
          transform: translateY(-2px) scale(1.02);
        }

        .action-logout-text {
          margin-left: 6px;
          font-size: 16px;
          font-weight: 700;
          color: #333;
          transition: color 220ms ease;
        }

        .action-logout-btn:hover .action-logout-text,
        .action-logout-btn:focus .action-logout-text {
          color: #ffffff;
        }

        /* Back button style: red #E74C3C, text and icon white */
        .back-btn {
          display: flex;
          align-items: center;
          background-color: var(--back-color);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
        }

        .back-btn:hover,
        .back-btn:focus {
          background-color: var(--back-color-dark);
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .back-btn .back-icon,
        .back-btn .back-text {
          color: #ffffff !important;
        }

        /* Keep back icon white on hover/focus */
        .back-btn:focus .back-icon,
        .back-btn:hover .back-icon {
          color: #ffffff !important;
        }

        /* Ensure responsive spacing */
        @media (max-width: 680px) {
          .action-grid {
            gap: 14px !important;
          }
        }
      `}</style>

      <header style={styles.header}>
        <img
          src={logoImg}
          alt="Logo Eneo Cameroon"
          style={{ width: logoW, height: logoH }}
        />
      </header>

      <div style={styles.topBar}>
        <button
          className="back-btn"
          style={styles.backBtn}
          onClick={() => navigate('/accueil')}
          aria-label="Retour"
        >
          <MdArrowBack className="back-icon" size={22} />
          <span className="back-text" style={styles.backText}>Retour</span>
        </button>
      </div>

      <h1 style={styles.title}>Sélectionner une action</h1>

      <div className="action-grid" style={{ ...styles.grid, gap: winW * 0.04 }}>
        <button
          className="action-card"
          style={{ ...styles.card, width: cardW }}
          onClick={() => navigate('/stocks')}
        >
          <div className="action-iconwrap" style={styles.iconWrap}>
            <MdInventory className="action-icon" size={36} />
          </div>
          <span className="action-card-text" style={styles.cardText}>Gérer les stocks</span>
        </button>

        <button
          className="action-card"
          style={{ ...styles.card, width: cardW }}
          onClick={() => navigate('/attribution')}
        >
          <div className="action-iconwrap" style={styles.iconWrap}>
            <MdAccountCircle className="action-icon" size={36} />
          </div>
          <span className="action-card-text" style={styles.cardText}>Attribuer un matériel</span>
        </button>

        <button
          className="action-card"
          style={{ ...styles.card, width: cardW }}
          onClick={() => navigate('/sortie')}
        >
          <div className="action-iconwrap" style={styles.iconWrap}>
            <MdLocalShipping className="action-icon" size={36} />
          </div>
          <span className="action-card-text" style={styles.cardText}>Effectuer une sortie</span>
        </button>
      </div>

      <div style={styles.logoutArea}>
        <button
          className="action-logout-btn"
          style={styles.logoutBtn}
          onClick={() => navigate('/')}
        >
          <MdLogout className="action-logout-icon" size={20} />
          <span className="action-logout-text" style={styles.logoutText}>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#EFEFEF',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd'
  },
  topBar: {
    display: 'flex',
    padding: '12px 16px'
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#E74C3C', // couleur demandée
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    cursor: 'pointer'
  },
  backText: {
    marginLeft: '6px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#fff'
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 700,
    color: '#222',
    margin: '20px 0'
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '0 16px'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px 0',
    margin: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: 'none',
    cursor: 'pointer'
  },
  iconWrap: {
    width: '58px',
    height: '58px',
    borderRadius: '12px',
    backgroundColor: '#F1F2F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px'
  },
  cardText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    textAlign: 'center'
  },
  logoutArea: {
    marginTop: 'auto',
    padding: '16px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    cursor: 'pointer'
  },
  logoutText: {
    marginLeft: '6px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#333'
  }
};
