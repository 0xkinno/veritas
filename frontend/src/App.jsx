import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { modal } from "./lib/reown.js";
import Navbar     from "./components/Navbar.jsx";
import Ticker     from "./components/Ticker.jsx";
import Toast      from "./components/Toast.jsx";
import Home       from "./pages/Home.jsx";
import Universe   from "./pages/Universe.jsx";
import Feed       from "./pages/Feed.jsx";
import DNA        from "./pages/DNA.jsx";
import Ledger     from "./pages/Ledger.jsx";
import Reputation from "./pages/Reputation.jsx";

export const ToastContext  = React.createContext(null);
export const WalletContext = React.createContext(null);

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const location = useLocation();

  const showToast = (type, title, msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, title, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  };

  // Listen to Reown wallet state changes
  useEffect(() => {
    // Subscribe to account changes
    const unsubscribe = modal.subscribeAccount(account => {
      if (account?.address) {
        setWallet(account.address);
        modal.getWalletProvider().then(p => setProvider(p)).catch(() => {});
      } else {
        setWallet(null);
        setProvider(null);
      }
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <ToastContext.Provider value={showToast}>
      <WalletContext.Provider value={{ wallet, setWallet, provider }}>
        <div className="grid-overlay" />
        <div className="scanlines" />
        <Navbar />
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/universe"   element={<Universe />} />
          <Route path="/feed"       element={<Feed />} />
          <Route path="/dna"        element={<DNA />} />
          <Route path="/ledger"     element={<Ledger />} />
          <Route path="/reputation" element={<Reputation />} />
        </Routes>
        <Ticker />
        <Toast toasts={toasts} />
      </WalletContext.Provider>
    </ToastContext.Provider>
  );
}