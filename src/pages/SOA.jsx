import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Search, Printer, FileText, X } from "lucide-react";

export default function SOA() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const generateSOAData = (p) => {
    const items = [];
    let grandTotal = 0;
    
    // Process Extractions
    if (p.extractions) Object.values(p.extractions).forEach(e => {
        const bal = parseFloat(e.amount||0) - parseFloat(e.downpayment||0);
        items.push({ date: e.date, service: "Extraction", total: e.amount, paid: e.downpayment, balance: bal });
        grandTotal += bal;
    });

    // Process Pasta
    if (p.pasta) Object.values(p.pasta).forEach(e => {
        const bal = parseFloat(e.amount||0) - parseFloat(e.downpayment||0);
        items.push({ date: e.date, service: "Restoration (Pasta)", total: e.amount, paid: e.downpayment, balance: bal });
        grandTotal += bal;
    });

    // Process Braces (Consolidated contract view)
    if (p.braces) Object.values(p.braces).forEach(b => {
        let monthlyPaid = 0;
        if (b.visits) Object.values(b.visits).forEach(v => monthlyPaid += parseFloat(v.paid||0));
        const totalPaid = parseFloat(b.downpayment||0) + monthlyPaid;
        const bal = parseFloat(b.amount||0) - totalPaid;
        items.push({ date: b.dateStarted, service: "Orthodontics (Braces)", total: b.amount, paid: totalPaid, balance: bal });
        grandTotal += bal;
    });

    return { items, grandTotal };
  };

  const soa = selectedPatient ? generateSOAData(selectedPatient) : { items: [], grandTotal: 0 };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="no-print">
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem' }}>Statement of Account</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Generate financial statements for patients.</p>

        <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '2rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search patient name..." 
            className="modern-input" 
            style={{ paddingLeft: '2.5rem', borderRadius: '50px' }} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{textAlign: 'left'}}>Patient Name</th>
                <th style={{textAlign: 'left'}}>Contact #</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? <tr><td colSpan="3" style={{padding: '2rem', textAlign:'center', color: 'var(--text-muted)'}}>No patients found.</td></tr> :
                filteredPatients.map(p => (
                  <tr key={p.id}>
                    <td><div style={{fontWeight:700}}>{p.name}</div></td>
                    <td>{p.contact}</td>
                    <td style={{textAlign:'center'}}>
                      <button 
                        onClick={() => { setSelectedPatient(p); setIsModalOpen(true); }} 
                        className="btn-primary" 
                        style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <FileText size={14} /> Generate SOA
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* SOA PREVIEW MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '800px', padding: '3rem', borderRadius: '8px', position: 'relative', height: 'fit-content' }}>
            <div className="no-print" style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => window.print()} className="btn-primary" style={{ display: 'flex', alignItems:'center', gap: '0.5rem'}}><Printer size={16}/> Print SOA</button>
                <button onClick={() => setIsModalOpen(false)} style={{ background: '#eee', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '28px' }}>FANO DENTAL CLINIC</h1>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>Statement of Account</p>
                <p style={{ margin: 0, fontSize: '12px' }}>Date Issued: {new Date().toLocaleDateString()}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>PATIENT:</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{selectedPatient.name}</p>
                    <p style={{ margin: 0, fontSize: '14px' }}>{selectedPatient.address}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}><strong>Contact:</strong> {selectedPatient.contact}</p>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                <thead>
                    <tr style={{ background: '#f1f1f1' }}>
                        <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left' }}>Date</th>
                        <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left' }}>Service Description</th>
                        <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'right' }}>Total Bill</th>
                        <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'right' }}>Total Paid</th>
                        <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'right' }}>Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    {soa.items.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ border: '1px solid #000', padding: '12px' }}>{item.date}</td>
                            <td style={{ border: '1px solid #000', padding: '12px' }}><strong>{item.service}</strong></td>
                            <td style={{ border: '1px solid #000', padding: '12px', textAlign: 'right' }}>₱{parseFloat(item.total||0).toLocaleString()}</td>
                            <td style={{ border: '1px solid #000', padding: '12px', textAlign: 'right' }}>₱{parseFloat(item.paid||0).toLocaleString()}</td>
                            <td style={{ border: '1px solid #000', padding: '12px', textAlign: 'right', fontWeight: 700 }}>₱{parseFloat(item.balance||0).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>GRAND TOTAL DUE: ₱{soa.grandTotal.toLocaleString()}</h2>
            </div>

            <div style={{ marginTop: '6rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '220px', textAlign: 'center', borderTop: '1.5px solid #000', paddingTop: '8px', fontSize: '12px' }}>Patient / Representative Signature</div>
                <div style={{ width: '220px', textAlign: 'center', borderTop: '1.5px solid #000', paddingTop: '8px', fontSize: '12px' }}>Clinic Authorized Signatory</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}