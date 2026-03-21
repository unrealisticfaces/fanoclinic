import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { ref, onValue, remove } from "firebase/database";
import { ArrowLeft, UserCircle, Syringe, Activity, Smile, Trash2, Calendar, Phone, MapPin } from "lucide-react";

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const isAdmin = auth.currentUser?.email === 'admin@gmail.com';

  useEffect(() => {
    const patientRef = ref(db, `patients/${id}`);
    const unsubscribe = onValue(patientRef, (snapshot) => {
      setPatient(snapshot.val());
    });
    return () => unsubscribe();
  }, [id]);

  if (!patient) return (
    <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600 }}>Loading Patient File...</p>
      </div>
    </div>
  );

  const deleteItem = async (path) => {
    if (window.confirm("Delete this record permanently?")) await remove(ref(db, path));
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/patients')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}
        >
          <ArrowLeft size={20} /> Back to Masterlist
        </button>
      </div>

      {/* Header Info Card */}
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '20px', color: 'var(--primary)' }}>
          <UserCircle size={64} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 900, fontSize: '2.2rem' }}>{patient.name}</h2>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.95rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16} /> <strong>Age:</strong> {patient.age}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={16} /> <strong>Contact:</strong> {patient.contact}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} /> <strong>Address:</strong> {patient.address}</span>
          </div>
        </div>
      </div>

      {/* --- EXTRACTIONS --- */}
      <section style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '2.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Syringe size={20} color="var(--primary)" />
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Extractions History</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem 2rem' }}>Date</th>
                <th>Dentist</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Paid</th>
                <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Balance</th>
                {isAdmin && <th style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {!patient.extractions ? <tr><td colSpan={isAdmin ? 7 : 6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td></tr> : 
                Object.entries(patient.extractions).map(([key, ext]) => {
                  const bal = parseFloat(ext.amount || 0) - parseFloat(ext.downpayment || 0);
                  return (
                    <tr key={key} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 2rem', fontWeight: 700 }}>{ext.date}</td>
                      <td>Dr. {ext.dentist}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{ext.notes}</td>
                      <td style={{ textAlign: 'right' }}>₱{parseFloat(ext.amount || 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)' }}>₱{parseFloat(ext.downpayment || 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', paddingRight: '2rem', fontWeight: 800, color: bal <= 0 ? 'var(--success)' : 'var(--danger)' }}>₱{bal.toLocaleString()}</td>
                      {isAdmin && <td style={{ textAlign: 'center' }}><button onClick={() => deleteItem(`patients/${id}/extractions/${key}`)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button></td>}
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </section>

      {/* --- PASTA --- */}
      <section style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '2.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={20} color="var(--primary)" />
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Restoration (Pasta) History</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem 2rem' }}>Date</th>
                <th>Dentist</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Paid</th>
                <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Balance</th>
                {isAdmin && <th style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {!patient.pasta ? <tr><td colSpan={isAdmin ? 7 : 6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td></tr> : 
                Object.entries(patient.pasta).map(([key, p]) => {
                  const bal = parseFloat(p.amount || 0) - parseFloat(p.downpayment || 0);
                  return (
                    <tr key={key} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 2rem', fontWeight: 700 }}>{p.date}</td>
                      <td>Dr. {p.dentist}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.notes}</td>
                      <td style={{ textAlign: 'right' }}>₱{parseFloat(p.amount || 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)' }}>₱{parseFloat(p.downpayment || 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', paddingRight: '2rem', fontWeight: 800, color: bal <= 0 ? 'var(--success)' : 'var(--danger)' }}>₱{bal.toLocaleString()}</td>
                      {isAdmin && <td style={{ textAlign: 'center' }}><button onClick={() => deleteItem(`patients/${id}/pasta/${key}`)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button></td>}
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </section>

      {/* --- BRACES --- */}
      <section style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Smile size={20} color="var(--primary)" />
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Orthodontics (Braces) History</h4>
        </div>
        {!patient.braces ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active braces contracts.</div> : Object.entries(patient.braces).map(([contractId, contract]) => {
          let totalMonthlyPaid = 0;
          if (contract.visits) Object.values(contract.visits).forEach(v => totalMonthlyPaid += parseFloat(v.paid || 0));
          const balance = parseFloat(contract.amount || 0) - parseFloat(contract.downpayment || 0) - totalMonthlyPaid;

          return (
            <div key={contractId} style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '16px', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Contract Total</p>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>₱{parseFloat(contract.amount).toLocaleString()}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Remaining Balance</p>
                  <h3 style={{ margin: 0, color: balance <= 0 ? 'var(--success)' : 'var(--danger)' }}>₱{balance.toLocaleString()}</h3>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th>Procedure / Adjustment</th>
                      <th>Dentist</th>
                      <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Paid</th>
                      {isAdmin && <th style={{ textAlign: 'center' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: 'var(--bg-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{contract.dateStarted}</td>
                      <td style={{ fontWeight: 600 }}>Initial Installation</td>
                      <td>Dr. {contract.dentist}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)', paddingRight: '1rem' }}>₱{parseFloat(contract.downpayment).toLocaleString()}</td>
                      {isAdmin && <td style={{ textAlign: 'center' }}><button onClick={() => deleteItem(`patients/${id}/braces/${contractId}`)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button></td>}
                    </tr>
                    {contract.visits && Object.entries(contract.visits).reverse().map(([vId, v]) => (
                      <tr key={vId} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{v.date}</td>
                        <td style={{ fontWeight: 600 }}>{v.adjustment}</td>
                        <td>Dr. {v.remarks || 'N/A'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)', paddingRight: '1rem' }}>₱{parseFloat(v.paid).toLocaleString()}</td>
                        {isAdmin && <td style={{ textAlign: 'center' }}><button onClick={() => deleteItem(`patients/${id}/braces/${contractId}/visits/${vId}`)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}