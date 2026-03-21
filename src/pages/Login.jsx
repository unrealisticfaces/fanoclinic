import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// Premium Custom Tooth SVG Logo
const ToothLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 22c0 0 0-4-2.5-4C5 18 2 16 2 12V5.5C2 3.5 3.5 2 5.5 2 7.5 2 9 3.5 9 5.5V8.5c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5V5.5C15 3.5 16.5 2 18.5 2 20.5 2 22 3.5 22 5.5V12c0 4-3 6-5.5 6C14 18 14 22 14 22"/>
    <path d="M12 22V11"/>
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("Invalid credentials. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <div style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'inline-flex', background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px', color: 'var(--primary)', marginBottom: '1rem' }}>
          <ToothLogo size={36} />
        </div>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.75rem' }}>Fano Clinic</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', fontWeight: 500 }}>Secure Portal Access</p>

        {error && <div style={{ background: '#ffe4e6', color: 'var(--danger)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Email Address</label>
            <input type="email" className="modern-input" placeholder="admin@fanoclinic.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Password</label>
            <input type="password" className="modern-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem' }} disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}