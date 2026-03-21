import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Search, Printer, FileText, X, UserCircle } from "lucide-react";

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

  const generateSOA = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Calculate SOA Totals
  const getSOALineItems = (p) => {
    const items = [];
    let grandTotal = 0;
    
    if (p.extractions) Object.values(p.extractions).forEach(e => {
        const bal = parseFloat(e.amount||0) - parseFloat(e.downpayment||0);
        items.push({ date: e.date, service: "Extraction", total: e.amount, paid: e.downpayment, balance: bal });
        grandTotal += bal;
    });

    if (p.pasta) Object.values(p.pasta).forEach(e => {
        const bal = parseFloat(e.amount||0) - parseFloat(e.downpayment||0);
        items.push({ date: e.date, service: "Restoration (Pasta)", total: e.amount, paid: e.downpayment, balance: bal });
        grandTotal += bal;
    });

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

  const soaData = selectedPatient ? getSOALineItems(selectedPatient) : { items: [], grandTotal: 0 };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="no-print">
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem' }}>Statement of Account</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Generate and print patient financial statements.</p>

        <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '2rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search patient name..." className="modern-input" style={{ paddingLeft: '2.5rem', borderRadius: '50px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{textAlign: 'left'}}>Patient Name</th>
                <th style={{textAlign: 'left'}}>Contact</th>
                <th style={{textAlign: 'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(p => (
                <tr key={p.id}>
                  <td><div style={{fontWeight:700}}>{p.name}</div></td>
                  <td style={{color: 'var(--text-muted)'}}>{p.contact}</td>
                  <td style={{textAlign:'center'}}>
                    <button onClick={() => generateSOA(p)} className="btn-primary" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem' }}>
                      <FileText size={14} /> Generate SOA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SOA MODAL / PRINT VIEW --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '2rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '800px', padding: '3rem', borderRadius: '8px', position: 'relative', height: 'fit-content' }}>
            
            {/* Modal Controls */}
            <div className="no-print" style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '1rem' }}>
                <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Printer size={16}/> Print Now</button>
                <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            {/* THE ACTUAL STATEMENT CONTENT */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '26px' }}>FANO DENTAL CLINIC</h1>
                <p style={{ margin: '5px 0' }}>Official Statement of Account</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>BILL TO:</p>
                    <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: 800 }}>{selectedPatient.name}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#444' }}>{selectedPatient.address}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0 }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p style={{ margin: 0 }}><strong>Invoice #:</strong> SOA-{selectedPatient.id.substring(1, 6).toUpperCase()}</p>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                <thead>
                    <tr style={{ background: '#f1f1f1' }}>
                        <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Date</th>
                        <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Description</th>
                        <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Total</th>
                        <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Paid</th>
                        <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {soaData.items.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ border: '1px solid #000', padding: '10px' }}>{item.date}</td>
                            <td style={{ border: '1px solid #000', padding: '10px' }}><strong>{item.service}</strong></td>
                            <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>₱{parseFloat(item.total).toLocaleString()}</td>
                            <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>₱{parseFloat(item.paid).toLocaleString()}</td>
                            <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 700 }}>₱{parseFloat(item.balance).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <h2 style={{ margin: 0 }}>GRAND TOTAL: ₱{soaData.grandTotal.toLocaleString()}</h2>
            </div>

            <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '200px', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>Patient Signature</div>
                <div style={{ width: '200px', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>Authorized Representative</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}