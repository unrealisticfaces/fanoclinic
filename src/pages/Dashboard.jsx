import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Users, TrendingUp, Clock, Calendar, Activity } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPatients: 0, todayWalkins: 0, todayIncome: 0 });
  const [activeQueue, setActiveQueue] = useState([]);
  const [recentTrans, setRecentTrans] = useState([]);
  const todayDate = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    // 1. Fetch Patients & Calculate Today's Income
    const patientsRef = ref(db, "patients");
    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setStats(s => ({ ...s, totalPatients: 0, todayIncome: 0 }));
        setRecentTrans([]);
        return;
      }

      let income = 0;
      let transactions = [];
      const keys = Object.keys(data);

      keys.forEach(id => {
        const p = data[id];
        
        ['extractions', 'pasta', 'cleanings', 'implants'].forEach(type => {
          if (p[type]) {
            Object.values(p[type]).forEach(record => {
              if (record.date === todayDate) {
                const amount = parseFloat(record.downpayment || 0);
                income += amount;
                transactions.push({ id: Math.random(), patient: p.name, procedure: type.toUpperCase(), amount });
              }
            });
          }
        });

        if (p.braces) {
          Object.values(p.braces).forEach(contract => {
            if (contract.dateStarted === todayDate) {
              const amount = parseFloat(contract.downpayment || 0);
              income += amount;
              transactions.push({ id: Math.random(), patient: p.name, procedure: 'BRACES (INSTALL)', amount });
            }
            if (contract.visits) {
              Object.values(contract.visits).forEach(visit => {
                if (visit.date === todayDate) {
                  const amount = parseFloat(visit.paid || 0);
                  income += amount;
                  transactions.push({ id: Math.random(), patient: p.name, procedure: 'BRACES (ADJUSTMENT)', amount });
                }
              });
            }
          });
        }
      });

      setStats(s => ({ ...s, totalPatients: keys.length, todayIncome: income }));
      setRecentTrans(transactions.sort((a,b) => b.amount - a.amount)); 
    });

    // 2. Fetch Today's Active Walk-in Queue
    const queueRef = ref(db, `queues/${todayDate}`);
    onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        setStats(s => ({ ...s, todayWalkins: list.length }));
        setActiveQueue(list.filter(q => q.status === 'waiting' || q.status === 'serving').sort((a,b) => a.queueNumber - b.queueNumber));
      } else {
        setStats(s => ({ ...s, todayWalkins: 0 }));
        setActiveQueue([]);
      }
    });

  }, [todayDate]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontWeight: 900, fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Clinic Overview</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16}/> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* COLORED STATS HIGHLIGHT ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* INCOME (TEAL / SLATE) */}
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0f172a 100%)', color: 'white', padding: '2rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.4)' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.2rem', borderRadius: '50%' }}><TrendingUp size={36} /></div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, letterSpacing: '1px', opacity: 0.9 }}>TODAY'S INCOME</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900 }}>₱{stats.todayIncome.toLocaleString()}</h2>
          </div>
        </div>

        {/* WALK-INS (BLUE GRADIENT) */}
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', color: 'white', padding: '2rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.2rem', borderRadius: '50%' }}><Clock size={36} /></div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, letterSpacing: '1px', opacity: 0.9 }}>TOTAL WALK-INS TODAY</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900 }}>{stats.todayWalkins}</h2>
          </div>
        </div>

        {/* REGISTERED PATIENTS (INDIGO/PURPLE GRADIENT) */}
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)', color: 'white', padding: '2rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.2rem', borderRadius: '50%' }}><Users size={36} /></div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, letterSpacing: '1px', opacity: 0.9 }}>REGISTERED PATIENTS</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900 }}>{stats.totalPatients}</h2>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* ACTIVE QUEUE SNAPSHOT */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
          <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Activity size={20} color="var(--primary)"/> Active Queue</h3>
            <Link to="/walk-in" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>Manage Walk-ins</Link>
          </div>
          <div style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1 }}>
            {activeQueue.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2rem' }}>No patients currently waiting.</p>
            ) : (
              activeQueue.map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: q.status === 'serving' ? '#f0fdf4' : 'var(--bg-color)', borderRadius: '16px', marginBottom: '0.75rem', border: q.status === 'serving' ? '1px solid #bbf7d0' : '1px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ background: q.status === 'serving' ? 'var(--success)' : 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '10px', fontWeight: 900 }}>{q.queueNumber}</span>
                    <span style={{ fontWeight: 800 }}>{q.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: q.status === 'serving' ? 'var(--success)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{q.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TODAY'S TRANSACTION LOGS */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
          <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><TrendingUp size={20} color="var(--success)"/> Today's Logs</h3>
          </div>
          <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'white', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Patient</th>
                  <th>Procedure</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Income</th>
                </tr>
              </thead>
              <tbody>
                {recentTrans.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No procedures logged today.</td>
                  </tr>
                ) : (
                  recentTrans.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{t.patient}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.procedure}</td>
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>₱{t.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}