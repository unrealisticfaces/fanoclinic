import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, push, onValue } from "firebase/database";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const [patientsCount, setPatientsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [infoData, setInfoData] = useState({ fname: "", mname: "", lname: "", age: "", contact: "", address: "" });

  useEffect(() => {
    onValue(ref(db, "patients"), (snapshot) => {
      const data = snapshot.val();
      setPatientsCount(data ? Object.keys(data).length : 0);
    });
  }, []);

  const generateID = () => `F-${new Date().getFullYear().toString().slice(-2)}-${(patientsCount + 1).toString().padStart(3, '0')}`;

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fullName = `${infoData.fname} ${infoData.mname} ${infoData.lname}`.trim();
    
    try {
      await push(ref(db, "patients"), { 
        ...infoData, 
        name: fullName, 
        medicalId: generateID(), 
        dateRegistered: new Date().toLocaleDateString('en-CA') 
      });
      toast.success("New Patient Registered Successfully!");
      
      setInfoData({ fname: "", mname: "", lname: "", age: "", contact: "", address: "" });
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Patient Registration</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Create a new electronic medical record for a patient.</p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '3rem', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px', color: 'var(--primary)' }}>
            <UserPlus size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem' }}>Personal Information</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please fill out all required fields carefully.</p>
          </div>
        </div>
        
        <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ROW 1: MEDICAL ID FULL WIDTH */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>MEDICAL ID (AUTO-GENERATED)</label>
            <input className="modern-input" value={generateID()} readOnly style={{ background: '#f8fafc', fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }} />
          </div>
          
          {/* ROW 2: NAMES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>FIRST NAME <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="modern-input" value={infoData.fname} onChange={e => setInfoData({...infoData, fname: e.target.value})} required placeholder="Juan" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>MIDDLE NAME</label>
              <input className="modern-input" value={infoData.mname} onChange={e => setInfoData({...infoData, mname: e.target.value})} placeholder="Optional" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>LAST NAME <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="modern-input" value={infoData.lname} onChange={e => setInfoData({...infoData, lname: e.target.value})} required placeholder="Dela Cruz" />
            </div>
          </div>

          {/* ROW 3: AGE (Small) and CONTACT NUMBER (Flexible) */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>AGE <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="modern-input" type="number" value={infoData.age} onChange={e => setInfoData({...infoData, age: e.target.value})} required placeholder="e.g. 24" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>CONTACT NUMBER <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="modern-input" value={infoData.contact} onChange={e => setInfoData({...infoData, contact: e.target.value})} required placeholder="09XX-XXX-XXXX" />
            </div>
          </div>
          
          {/* ROW 4: ADDRESS FULL WIDTH */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>COMPLETE ADDRESS <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="modern-input" value={infoData.address} onChange={e => setInfoData({...infoData, address: e.target.value})} required placeholder="House No., Street, City, Province" />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1.2rem', fontSize: '1.1rem', background: 'var(--primary)' }}>
            {loading ? 'Registering Patient...' : 'Create Patient Record'}
          </button>
        </form>
      </div>
    </div>
  );
}