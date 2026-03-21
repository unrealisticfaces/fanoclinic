import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue, push } from "firebase/database";
import { Search, PlusCircle, X, Receipt, Info } from "lucide-react";

export default function Payments() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transType, setTransType] = useState("Extraction");

  // Dynamic form state
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-CA'), dentist: "", notes: "", amount: "", paid: ""
  });

  useEffect(() => {
    const patientsRef = ref(db, "patients");
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setPatients(dataArray.reverse()); 
      } else {
        setPatients([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- HELPER: GET BRACES SPECIFICS ---
  const getBracesInfo = (p) => {
    if (!p || !p.braces) return null;
    const contractId = Object.keys(p.braces)[0]; // Get first contract
    const contract = p.braces[contractId];
    
    let monthlyPaid = 0;
    if (contract.visits) {
      Object.values(contract.visits).forEach(v => monthlyPaid += parseFloat(v.paid || 0));
    }
    
    const total = parseFloat(contract.amount || 0);
    const dp = parseFloat(contract.downpayment || 0);
    const balance = total - dp - monthlyPaid;
    
    return { contractId, balance, total };
  };

  // Helper to calculate a patient's ENTIRE total balance (used for the table)
  const getTotalBalance = (p) => {
    let bal = 0;
    if (p.extractions) Object.values(p.extractions).forEach(e => bal += (parseFloat(e.amount||0) - parseFloat(e.downpayment||0)));
    if (p.pasta) Object.values(p.pasta).forEach(e => bal += (parseFloat(e.amount||0) - parseFloat(e.downpayment||0)));
    const bInfo = getBracesInfo(p);
    if (bInfo) bal += bInfo.balance;
    return bal;
  };

  const openPaymentModal = (patient) => {
    setSelectedPatient(patient);
    setTransType("Extraction");
    setFormData({ date: new Date().toLocaleDateString('en-CA'), dentist: "", notes: "", amount: "", paid: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (transType === "Extraction") {
        await push(ref(db, `patients/${selectedPatient.id}/extractions`), {
          date: formData.date, dentist: formData.dentist, notes: formData.notes, amount: formData.amount, downpayment: formData.paid
        });
      } else if (transType === "Pasta") {
        await push(ref(db, `patients/${selectedPatient.id}/pasta`), {
          date: formData.date, dentist: formData.dentist, notes: formData.notes, amount: formData.amount, downpayment: formData.paid
        });
      } else if (transType === "BracesVisit") {
        const bInfo = getBracesInfo(selectedPatient);
        if (!bInfo) {
          alert("This patient has no active braces contract.");
          setLoading(false);
          return;
        }
        await push(ref(db, `patients/${selectedPatient.id}/braces/${bInfo.contractId}/visits`), {
          date: formData.date, adjustment: formData.notes, remarks: formData.dentist, paid: formData.paid
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Get braces balance for the current patient in the modal
  const currentBracesBalance = selectedPatient ? getBracesInfo(selectedPatient)?.balance : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800, fontSize: '1.5rem' }}>Payments & Visits</h3>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Log procedures and collect payments</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Find patient to bill..." className="modern-input" style={{ paddingLeft: '2.5rem', borderRadius: '50px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Patient Name</th>
                <th style={{ textAlign: 'left' }}>Contact</th>
                <th style={{ textAlign: 'right' }}>Total Unpaid Balance</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (<tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No patients found.</td></tr>) : (
                filteredPatients.map((patient) => {
                  const bal = getTotalBalance(patient);
                  return (
                    <tr key={patient.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{patient.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{patient.contact}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ background: bal <= 0 ? '#d1fae5' : '#fee2e2', color: bal <= 0 ? 'var(--success)' : 'var(--danger)', padding: '0.4rem 0.8rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem' }}>
                          ₱{bal.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => openPaymentModal(patient)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <PlusCircle size={14} /> Add Transaction
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary)' }}><Receipt size={24} /></div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Record Payment</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>for {selectedPatient?.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Type of Transaction</label>
                <select value={transType} onChange={(e) => setTransType(e.target.value)} className="modern-input" style={{ cursor: 'pointer', fontWeight: 600 }}>
                  <option value="Extraction">New Extraction / Balance Payment</option>
                  <option value="Pasta">New Pasta / Balance Payment</option>
                  <option value="BracesVisit">Orthodontics Monthly Visit</option>
                </select>
              </div>

              {/* --- NEW: REMAINING BALANCE DISPLAY FOR BRACES --- */}
              {transType === "BracesVisit" && (
                <div style={{ background: currentBracesBalance <= 0 ? '#d1fae5' : '#fff7ed', padding: '1rem', borderRadius: '12px', border: '1px solid', borderColor: currentBracesBalance <= 0 ? '#10b981' : '#fed7aa', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Info size={20} color={currentBracesBalance <= 0 ? '#059669' : '#ea580c'} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Current Orthodontics Balance</p>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: currentBracesBalance <= 0 ? '#059669' : '#ea580c' }}>₱{currentBracesBalance.toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Date</label><input type="date" className="modern-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>{transType === "BracesVisit" ? "Remarks / Dr. Name" : "Dentist In-charge"}</label><input type="text" className="modern-input" value={formData.dentist} onChange={e => setFormData({...formData, dentist: e.target.value})} required /></div>
              </div>

              <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>{transType === "BracesVisit" ? "Adjustment Details" : "Procedure Notes"}</label><input type="text" placeholder={transType === "BracesVisit" ? "e.g. Changed wires" : "e.g. Upper left molar"} className="modern-input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} required /></div>

              <div style={{ display: 'grid', gridTemplateColumns: transType === "BracesVisit" ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                {transType !== "BracesVisit" && (
                  <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '10px' }}><label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', marginBottom: '0.5rem', display: 'block' }}>Total Bill (₱)</label><input type="number" className="modern-input" style={{ borderColor: '#fcd34d' }} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
                )}
                <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '10px' }}><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: '0.5rem', display: 'block' }}>{transType === "BracesVisit" ? "Amount to Pay (₱)" : "Initial Payment (₱)"}</label><input type="number" className="modern-input" style={{ borderColor: '#99f6e4' }} value={formData.paid} onChange={e => setFormData({...formData, paid: e.target.value})} required /></div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>{loading ? "Saving..." : "Save Transaction"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}