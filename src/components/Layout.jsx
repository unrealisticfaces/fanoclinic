import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  FileText, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react";

const ToothIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 22c0 0 0-4-2.5-4C5 18 2 16 2 12V5.5C2 3.5 3.5 2 5.5 2 7.5 2 9 3.5 9 5.5V8.5c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5V5.5C15 3.5 16.5 2 18.5 2 20.5 2 22 3.5 22 5.5V12c0 4-3 6-5.5 6C14 18 14 22 14 22"/><path d="M12 22V11"/>
  </svg>
);

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navLinks = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Patient Masterlist", path: "/patients", icon: <Users size={20} /> },
    { name: "Payments & Visits", path: "/payments", icon: <Wallet size={20} /> },
    { name: "SOA Generator", path: "/soa", icon: <FileText size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 40 }} />}
      
      {/* Sidebar */}
      <aside style={{ 
        width: '280px', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column',
        position: window.innerWidth < 768 ? 'fixed' : 'relative', 
        transform: window.innerWidth < 768 && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', height: '100%', zIndex: 50, borderRight: '1px solid var(--border-color)',
        boxShadow: window.innerWidth < 768 ? '10px 0 25px rgba(0,0,0,0.05)' : 'none'
      }}>
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '12px', color: 'var(--primary)' }}>
              <ToothIcon size={26} />
            </div>
            <h2 style={{ color: 'var(--text-main)', fontWeight: 800, margin: 0, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>Fano Clinic</h2>
          </div>
          {window.innerWidth < 768 && <X size={24} color="var(--text-muted)" cursor="pointer" onClick={() => setSidebarOpen(false)} />}
        </div>

        <nav style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, marginTop: '1rem' }}>
          <p style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Billing & Records</p>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path === '/patients' && location.pathname.includes('/patient/'));
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => setSidebarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '0.85rem 1rem', 
                  borderRadius: '12px', 
                  textDecoration: 'none', 
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent', 
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)', 
                  fontWeight: isActive ? 700 : 500, 
                  transition: 'all 0.2s ease' 
                }}
              >
                {link.icon} {link.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '0.85rem', background: '#fff1f2', color: 'var(--danger)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
            <LogOut size={20} /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        <header style={{ margin: '1.5rem 2rem 0 2rem', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.5)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <Menu size={24} cursor="pointer" color="var(--text-main)" onClick={() => setSidebarOpen(true)} style={{ display: window.innerWidth < 768 ? 'block' : 'none' }} />
             <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Portal Access</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
              {auth.currentUser?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div style={{ display: window.innerWidth < 768 ? 'none' : 'block', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {auth.currentUser?.email}
            </div>
          </div>
        </header>

        <div style={{ padding: '2rem', overflowY: 'auto', flexGrow: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}