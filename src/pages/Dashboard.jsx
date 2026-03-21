import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Users, Activity } from "lucide-react";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const patientsRef = ref(db, "patients");
    const unsub = onValue(patientsRef, (snap) => {
      setPatients(snap.val() ? Object.values(snap.val()) : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const todayDateString = new Date().toLocaleDateString('en-CA'); 
  let activeBracesCount = 0;
  let todaysProceduresCount = 0;

  patients.forEach(p => {
    if (p.extractions) { Object.values(p.extractions).forEach(e => { if (e.date === todayDateString) todaysProceduresCount++; }); }
    if (p.pasta) { Object.values(p.pasta).forEach(e => { if (e.date === todayDateString) todaysProceduresCount++; }); }
    
    if (p.braces) {
      Object.values(p.braces).forEach(contract => {
        if (contract.dateStarted === todayDateString) todaysProceduresCount++;
        let monthlyPaid = 0;
        if (contract.visits) {
          Object.values(contract.visits).forEach(v => {
            monthlyPaid += parseFloat(v.paid || 0);
            if (v.date === todayDateString) todaysProceduresCount++;
          });
        }
        if ((parseFloat(contract.amount||0) - parseFloat(contract.downpayment||0) - monthlyPaid) > 0) {
          activeBracesCount++;
        }
      });
    }
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontWeight: 800, fontSize: '1.5rem' }}>Overview</h3>
      <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome to your live clinic statistics.</p>
      
      {loading ? (
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Syncing live data from Firebase...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', margin: 0 }}>Registered Patients</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: '0.5rem 0 0 0', fontWeight: 800 }}>{patients.length}</h2>
            </div>
            <div style={{ background: 'var(--primary-light)', padding: '0.8rem', borderRadius: '12px', color: 'var(--primary)' }}><Users size={28} /></div>
          </div>
          
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', margin: 0 }}>Active Braces Patients</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--success)', margin: '0.5rem 0 0 0', fontWeight: 800 }}>{activeBracesCount}</h2>
            </div>
            <div style={{ background: '#d1fae5', padding: '0.8rem', borderRadius: '12px', color: 'var(--success)' }}><Activity size={28} /></div>
          </div>
        </div>
      )}
    </div>
  );
}