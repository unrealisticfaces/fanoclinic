import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, remove, push } from "firebase/database";
import { ArrowLeft, User, Activity, Trash2, Calendar, Phone, MapPin, Plus, X, AlertCircle } from "lucide-react";

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  
  const [isProcModalOpen, setIsProcModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [procData, setProcData] = useState({ 
    type: "extractions", date: new Date().toLocaleDateString('en-CA'), dentist: "", notes: "", amount: "", paid: "" 
  });

  useEffect(() => {
    onValue(ref(db, `patients/${id}`), (snapshot) => { 
      setPatient(snapshot.val()); 
    });
  }, [id]);

  if (!patient) return <div style={{ textAlign: 'center', padding: '4rem', fontWeight: 600, color: 'var(--text-muted)' }}>Loading EMR File...</div>;

  const hasActiveBraces = patient.braces && Object.keys(patient.braces).length > 0;

  // Calculate Active Braces Balance ONLY for the Modal Display
  let activeBracesBalance = 0;
  if (hasActiveBraces) {
    const contractIds = Object.keys(patient.braces);
    const activeContract = patient.braces[contractIds[contractIds.length - 1]];
    let totalPaid = parseFloat(activeContract.downpayment || 0);
    if (activeContract.visits) {
      Object.values(activeContract.visits).forEach(v => totalPaid += parseFloat(v.paid || 0));
    }
    activeBracesBalance = parseFloat(activeContract.amount || 0) - totalPaid;
  }

  const deleteRecord = async (path) => {
    if (window.confirm("Delete this medical record? This cannot be undone.")) {
      await remove(ref(db, path));
    }
  };

  const handleAddProcedure = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (procData.type === "braces_install") {
        await push(ref(db, `patients/${id}/braces`), {
          dateStarted: procData.date, dentist: procData.dentist, amount: procData.amount, downpayment: procData.paid, notes: procData.notes
        });
      } else if (procData.type === "braces_visit") {
        const contractIds = Object.keys(patient.braces);
        const activeContractId = contractIds[contractIds.length - 1]; 
        await push(ref(db, `patients/${id}/braces/${activeContractId}/visits`), {
          date: procData.date, remarks: procData.dentist, adjustment: procData.notes, paid: procData.paid
        });
      } else {
        await push(ref(db, `patients/${id}/${procData.type}`), {
          date: procData.date, dentist: procData.dentist, notes: procData.notes, amount: procData.amount, downpayment: procData.paid
        });
      }
      
      setIsProcModalOpen(false);
      setProcData({ type: "extractions", date: new Date().toLocaleDateString('en-CA'), dentist: "", notes: "", amount: "", paid: "" });
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const renderTable = (dataObj, pathKey, title) => {
    if (!dataObj) return null;
    return (
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '1.2rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={18} color="var(--primary)" />
          <h4 style={{ margin: 0, fontWeight: 800 }}>{title} History</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {/* Table Layout Fixed forces the widths to be respected exactly */}
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '800px' }}>
            <thead>
              <tr style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'white', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', width: '12%' }}>Date</th>
                <th style={{ padding: '1rem', width: '16%' }}>Dentist</th>
                <th style={{ padding: '1rem', width: '32%' }}>Notes</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '12%' }}>Bill</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '12%' }}>Paid</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '12%' }}>Balance</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dataObj).map(([key, item]) => {
                const bal = parseFloat(item.amount || 0) - parseFloat(item.downpayment || 0);
                return (
                  <tr key={key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, verticalAlign: 'middle' }}>{item.date}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, verticalAlign: 'middle' }}>Dr. {item.dentist}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', verticalAlign: 'middle', wordWrap: 'break-word' }}>{item.notes}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, verticalAlign: 'middle' }}>₱{parseFloat(item.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right', color: 'var(--success)', fontWeight: 600, verticalAlign: 'middle' }}>₱{parseFloat(item.downpayment || 0).toLocaleString()}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 800, color: bal <= 0 ? 'var(--success)' : 'var(--danger)', verticalAlign: 'middle' }}>₱{bal.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <button onClick={() => deleteRecord(`patients/${id}/${pathKey}/${key}`)} style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <button onClick={() => navigate('/patients')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, marginBottom: '2rem' }}>
        <ArrowLeft size={18} /> Back to Masterlist
      </button>

      {/* Premium ID Card */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '2.5rem', borderRadius: '24px', color: 'white', marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 15px 30px -10px rgba(15,23,42,0.3)' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '20px' }}>
          <User size={64} color="var(--primary)" />
        </div>
        <div style={{ flexGrow: 1 }}>
          <span style={{ background: 'var(--primary)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>{patient.medicalId || 'F-26-000'}</span>
          <h1 style={{ margin: '0.5rem 0', fontWeight: 900, fontSize: '2.5rem' }}>{patient.name}</h1>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', opacity: 0.8, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16} /> Age {patient.age}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={16} /> {patient.contact}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} /> {patient.address}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 800, margin: 0 }}>Medical History</h3>
        <button onClick={() => setIsProcModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--success)' }}>
          <Plus size={18} /> Log New Procedure
        </button>
      </div>

      {renderTable(patient.extractions, "extractions", "Tooth Extraction")}
      {renderTable(patient.pasta, "pasta", "Restoration (Pasta)")}
      {renderTable(patient.implants, "implants", "Dental Implant")}
      {renderTable(patient.cleanings, "cleanings", "Cleaning & Prophylaxis")}

      {/* BRACES SPECIAL SECTION ALIGNED */}
      {hasActiveBraces && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '1.2rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={18} color="var(--primary)" />
            <h4 style={{ margin: 0, fontWeight: 800 }}>Orthodontics (Braces) History</h4>
          </div>
          
          {Object.entries(patient.braces).map(([contractId, contract]) => {
            return (
              <div key={contractId} style={{ padding: '1.5rem', borderBottom: '2px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 800, display: 'block', fontSize: '1.1rem' }}>Contract Started: {contract.dateStarted}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Attending: Dr. {contract.dentist}</span>
                  </div>
                </div>

                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem', width: '56%' }}>Date & Notes</th>
                      <th style={{ padding: '1rem', textAlign: 'right', width: '30%' }}>Amount Paid</th>
                      <th style={{ padding: '1rem', textAlign: 'center', width: '14%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                     <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                       <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, verticalAlign: 'middle' }}>Initial Installation Downpayment</td>
                       <td style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right', color: 'var(--success)', fontWeight: 800, verticalAlign: 'middle' }}>₱{parseFloat(contract.downpayment).toLocaleString()}</td>
                       <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button onClick={() => deleteRecord(`patients/${id}/braces/${contractId}`)} style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer', display: 'flex', margin: '0 auto' }}><Trash2 size={16}/></button>
                       </td>
                     </tr>
                     {contract.visits && Object.entries(contract.visits).map(([vId, v]) => (
                       <tr key={vId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                         <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', verticalAlign: 'middle', lineHeight: '1.5', wordWrap: 'break-word' }}>
                           <strong style={{ color: 'var(--text-main)', fontWeight: 800, marginRight: '0.5rem' }}>{v.date}</strong> 
                           {v.adjustment}
                         </td>
                         <td style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right', color: 'var(--success)', fontWeight: 700, verticalAlign: 'middle' }}>₱{parseFloat(v.paid).toLocaleString()}</td>
                         <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <button onClick={() => deleteRecord(`patients/${id}/braces/${contractId}/visits/${vId}`)} style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer', display: 'flex', margin: '0 auto' }}><Trash2 size={16}/></button>
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD PROCEDURE DIRECTLY TO PROFILE */}
      {isProcModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '2.5rem', position: 'relative' }}>
            <button onClick={() => setIsProcModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            
            <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, color: 'var(--text-main)' }}>Log New Procedure</h3>
            
            <form onSubmit={handleAddProcedure} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PROCEDURE TYPE</label>
                <select className="modern-input" value={procData.type} onChange={e => setProcData({...procData, type: e.target.value})} style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  <option value="extractions">Tooth Extraction</option>
                  <option value="pasta">Restoration (Pasta)</option>
                  <option value="cleanings">Cleaning / Prophylaxis</option>
                  <option value="implants">Dental Implant</option>
                  {!hasActiveBraces && <option value="braces_install">Braces (New Installation)</option>}
                  {hasActiveBraces && <option value="braces_visit">Braces (Monthly Adjustment)</option>}
                </select>
              </div>

              {/* DYNAMIC BALANCE DISPLAY IN MODAL FOR MONTHLY ADJUSTMENT */}
              {procData.type === 'braces_visit' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>CURRENT BALANCE:</span>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: activeBracesBalance <= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    ₱{activeBracesBalance.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DATE</label>
                  <input type="date" className="modern-input" value={procData.date} onChange={e => setProcData({...procData, date: e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DENTIST NAME</label>
                  <input placeholder="Dr. Name" className="modern-input" value={procData.dentist} onChange={e => setProcData({...procData, dentist: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{procData.type === 'braces_visit' ? "ADJUSTMENT NOTES" : "PROCEDURE NOTES"}</label>
                <input placeholder="e.g., Upper right molar extracted..." className="modern-input" value={procData.notes} onChange={e => setProcData({...procData, notes: e.target.value})} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: procData.type === 'braces_visit' ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                {procData.type !== 'braces_visit' && (
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL BILL (₱)</label>
                    <input type="number" className="modern-input" value={procData.amount} onChange={e => setProcData({...procData, amount: e.target.value})} required />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)' }}>{procData.type === 'braces_visit' ? "PAYMENT / INSTALLMENT (₱)" : "AMOUNT PAID DOWN (₱)"}</label>
                  <input type="number" className="modern-input" value={procData.paid} onChange={e => setProcData({...procData, paid: e.target.value})} required style={{ borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 800 }} />
                </div>
              </div>
              
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', background: 'var(--success)' }}>
                {loading ? 'Processing...' : 'Add to Medical Chart'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}