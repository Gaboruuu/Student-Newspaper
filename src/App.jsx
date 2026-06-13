import { useState, useEffect } from "react";
import "./App.css";
import logo from "./assets/logo.png";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function Header({ openLogin, openRegister }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const updateAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };
    
    // Initial check
    updateAuth();

    // Listen for custom event
    window.addEventListener('authChange', updateAuth);
    return () => window.removeEventListener('authChange', updateAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event('authChange'));
  };

  const today = new Date().toLocaleDateString("ro-RO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="header">
      <div className="header-masthead animate-fade-in">
        <div className="title-row">
          <div className="title-spacer"></div>
          
          <a href="/" className="title-container" style={{ textDecoration: 'none' }}>
            <img src={logo} alt="Ziarul Școlii Logo" className="header-logo" />
            <h1 className="title">Teoria Transpirației</h1>
          </a>

          <div className="header-actions">
            {user ? (
              <div className="user-island animate-fade-in">
                <div className="user-island-info">
                  <span className="user-island-name">{user.username}</span>
                  <span className="user-island-role">{user.role}</span>
                </div>
                <button className="user-island-logout" onClick={handleLogout}>Deconectare</button>
              </div>
            ) : (
              <>
                <button className="auth-trigger-btn" onClick={openLogin}>Autentificare</button>
                <button className="auth-trigger-btn" onClick={openRegister}>Înregistrare</button>
              </>
            )}
          </div>
        </div>
        <p className="subtitle">
          Cotidianul independent al elevilor de pretutindeni
        </p>
      </div>
      <div
        className="header-meta animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        <span>Ziarul Școlii</span>
        <span>{today}</span>
        <span>Ediția de dimineață</span>
      </div>
    </header>
  );
}

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const closeModals = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };

  return (
    <div className="app-wrapper">
      <Header openLogin={openLogin} openRegister={openRegister} />
      <Home />

      {isLoginOpen && (
        <Login 
          onClose={closeModals} 
          onSwitchToRegister={openRegister} 
        />
      )}

      {isRegisterOpen && (
        <Register 
          onClose={closeModals} 
          onSwitchToLogin={openLogin} 
        />
      )}
    </div>
  );
}

export default App;
