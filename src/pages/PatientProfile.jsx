import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { ref, onValue, remove } from "firebase/database";
import { ArrowLeft, UserCircle, Syringe, Activity, Smile, Trash2 } from "lucide-react";

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

  if (!patient) return <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 600 }}>Loading Patient File...</div>;

  const deleteItem = async (path) => {
    if (window.confirm("Delete this record permanently?")) await remove(ref(db, path));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      <button onClick={() => navigate('/patients')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, marginBottom: '1.5rem', padding: 0 }}>
        <ArrowLeft size={18} /> Back to Masterlist
      </button>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '50%', color: 'var(--primary)' }}><UserCircle size={48} /></div>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800, fontSize: '1.8rem' }}>{patient.name}</h2>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <span><strong>Age:</strong> {patient.age}</span>
            <span><strong>Contact:</strong> {patient.contact}</span>
            <span><strong>Address:</strong> {patient.address}</span>
          </div>
        </div>
      </div>

      {/* --- EXTRACTIONS --- */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}><Syringe size={20} color="var(--primary)"/> Extractions History</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', minWidth: '600px' }}>
            <thead><tr><th>Date</th><th>Dentist</th><th>Notes</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Balance</th>{isAdmin && <th style={{ textAlign: 'center' }}>Action</th>}</tr></thead>
            <tbody>
              {!patient.extractions ? <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No extractions on file.</td></tr> : 
                Object.entries(patient.extractions).map(([key, ext]) => {
                  const bal = parseFloat(ext.amount || 0) - parseFloat(ext.downpayment || 0);
                  return (
                    <tr key={key}>
                      <td style={{ verticalAlign: 'middle', fontWeight: 600, fontSize: '0.9rem' }}>{ext.date}</td><td style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}>Dr. {ext.dentist}</td><td style={{ verticalAlign: 'middle', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ext.notes}</td><td style={{ verticalAlign: 'middle', textAlign: 'right', fontSize: '0.9rem' }}>₱{parseFloat(ext.amount || 0).toLocaleString()}</td><td style={{ verticalAlign: 'middle', textAlign: 'right', fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>₱{parseFloat(ext.downpayment || 0).toLocaleString()}</td><td style={{ verticalAlign: 'middle', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: bal <= 0 ? 'var(--success)' : 'var(--danger)' }}>₱{bal.toLocaleString()}</td>
                      {isAdmin && <td style={{ textAlign: 'center', verticalAlign: 'middle' }}><button onClick={() => deleteItem(`patients/${id}/extractions/${key}`)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button></td>}
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PASTA --- */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}><Activity size={20} color="var(--primary)"/> Restoration (Pasta) History</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', minWidth: '600px' }}>
            <thead><tr><th>Date</th><th>Dentist</th><th>Notes</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Balance</th>{isAdmin && <th style={{ textAlign: 'center' }}>Action</th>}</tr></thead>
            <tbody>
              {!patient.pasta ? <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No restorations on file.</td></tr> : 
                Object.entries(patient.pasta).map(([key, p]) => {
                  const bal = parseFloat(p.amount || 0) - parseFloat(p.downpayment || 0);
                  return (
                    <tr key={key}>
                      <td style={{ verticalAlign: 'middle', fontWeight: 600, fontSize: '0.9rem' }}>{p.date}</td><td style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}>Dr. {p.dentist}</td><td style={{ verticalAlign: 'middle', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.notes}</td><td style={{ verticalAlign: 'middle', textAlign: 'right', fontSize: '0.9rem' }}>₱{parseFloat(p.amount || 0).toLocaleString()}</td><td style={{ verticalAlign: 'middle', textAlign: 'right', fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>₱{parseFloat(p.downpayment || 0).toLocaleString()}</td><td style={{ verticalAlign: 'middle', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: bal <= 0 ? 'var(--success)' : 'var(--danger)' }}>₱{bal.toLocaleString()}</td>
                      {isAdmin && <td style={{ textAlign: 'center', verticalAlign: 'middle' }}><button onClick={() => deleteItem(`patients/${id}/pasta/${key}`)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button></td>}
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BRACES --- */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}><Smile size={20} color="var(--primary)"/> Orthodontics (Braces) History</h4>
        </div>
        {!patient.braces ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No braces contracts on file.</div> : Object.entries(patient.braces).map(([contractId, contract]) => {
          let totalMonthlyPaid = 0;
          if (contract.visits) Object.values(contract.visits).forEach(v => totalMonthlyPaid += parseFloat(v.paid || 0));
          const balance = parseFloat(contract.amount || 0) - parseFloat(contract.downpayment || 0) - totalMonthlyPaid;

          return (
            <div key={contractId} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contract Total: ₱{parseFloat(contract.amount).toLocaleString()}</p><h3 style={{ margin: '0.2rem 0 0 0', color: balance <= 0 ? 'var(--success)' : 'var(--danger)' }}>Balance: ₱{balance.toLocaleString()}</h3></div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Procedure / Adjustment</th>
                      <th>Dentist</th> {/* NEW COLUMN */}
                      <th style={{ textAlign: 'right' }}>Paid</th>
                      {isAdmin && <th style={{ textAlign: 'center' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}>{contract.dateStarted}</td>
                      <td style={{ verticalAlign: 'middle', fontWeight: 600, fontSize: '0.9rem' }}>Initial Installation <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem'}}>(Contract Start)</span></td>
                      <td style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}>Dr. {contract.dentist}</td> {/* SHOW MAIN DENTIST */}
                      <td style={{ verticalAlign: 'middle', fontWeight: 700, color: 'var(--success)', textAlign: 'right', fontSize: '0.9rem' }}>₱{parseFloat(contract.downpayment).toLocaleString()}</td>
                      {isAdmin && <td style={{ textAlign: 'center', verticalAlign: 'middle' }}><button onClick={() => deleteItem(`patients/${id}/braces/${contractId}`)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Delete Contract"><Trash2 size={16}/></button></td>}
                    </tr>
                    {contract.visits && Object.entries(contract.visits).reverse().map(([vId, v]) => (
                      <tr key={vId}>
                        <td style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}>{v.date}</td>
                        <td style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}><span style={{fontWeight: 600}}>{v.adjustment}</span></td>
                        <td style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}>Dr. {v.remarks || 'N/A'}</td> {/* SHOW VISIT DENTIST */}
                        <td style={{ verticalAlign: 'middle', fontWeight: 700, color: 'var(--success)', textAlign: 'right', fontSize: '0.9rem' }}>₱{parseFloat(v.paid).toLocaleString()}</td>
                        {isAdmin && <td style={{ textAlign: 'center', verticalAlign: 'middle' }}><button onClick={() => deleteItem(`patients/${id}/braces/${contractId}/visits/${vId}`)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}