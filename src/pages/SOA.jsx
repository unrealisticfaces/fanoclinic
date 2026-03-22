import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Search, Printer, FileText, X, ChevronRight } from "lucide-react";

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

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.medicalId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSOAData = (p) => {
    const items = [];
    let grandTotal = 0;
    
    // Helper function to process standard procedures
    const processStandard = (dataObj, label) => {
      if (dataObj) {
        Object.values(dataObj).forEach(e => {
          const bal = parseFloat(e.amount || 0) - parseFloat(e.downpayment || 0);
          items.push({ date: e.date, service: label, total: e.amount, paid: e.downpayment, balance: bal });
          grandTotal += bal;
        });
      }
    };

    // Process all procedure types
    processStandard(p.extractions, "Tooth Extraction");
    processStandard(p.pasta, "Restoration (Pasta)");
    processStandard(p.cleanings, "Cleaning / Prophylaxis");
    processStandard(p.implants, "Dental Implant");

    // Process Braces (Consolidated contract view)
    if (p.braces) {
      Object.values(p.braces).forEach(b => {
        let monthlyPaid = 0;
        if (b.visits) Object.values(b.visits).forEach(v => monthlyPaid += parseFloat(v.paid || 0));
        
        const totalPaid = parseFloat(b.downpayment || 0) + monthlyPaid;
        const bal = parseFloat(b.amount || 0) - totalPaid;
        
        items.push({ date: b.dateStarted, service: "Orthodontics (Braces)", total: b.amount, paid: totalPaid, balance: bal });
        grandTotal += bal;
      });
    }

    // Sort items by date (oldest to newest)
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    return { items, grandTotal };
  };

  const soa = selectedPatient ? generateSOAData(selectedPatient) : { items: [], grandTotal: 0 };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* MAGIC PRINT CSS:
        This tells the browser to hide the UI and only print the document.
      */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-soa, #printable-soa * {
              visibility: visible;
            }
            #printable-soa {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* MAIN SCREEN (Hidden during print) */}
      <div className="no-print">
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem' }}>Statement of Account</h3>
          <p style={{ color: 'var(--text-muted)' }}>Generate official financial statements for patients.</p>
        </div>

        <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '2rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search ID or Patient Name..." 
            className="modern-input" 
            style={{ paddingLeft: '3rem', borderRadius: '50px' }} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1.2rem 2rem' }}>Medical ID</th>
                <th>Patient Name</th>
                <th>Contact Number</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No patients found.</td></tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1.2rem 2rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{p.medicalId || 'F-26-000'}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.contact}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => { setSelectedPatient(p); setIsModalOpen(true); }} 
                        className="btn-primary" 
                        style={{ padding: '0.6rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                      >
                        <FileText size={16} /> View SOA <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SOA PREVIEW MODAL */}
      {isModalOpen && selectedPatient && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', overflowY: 'auto' }}>
          
          {/* SEPARATED ACTION BAR (Hidden during print) */}
          <div className="no-print" style={{ width: '100%', maxWidth: '850px', background: 'white', padding: '1rem 2rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
              <FileText size={20} color="var(--primary)" /> Document Preview
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => window.print()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)' }}>
                <Printer size={18}/> Print SOA
              </button>
              <button onClick={() => setIsModalOpen(false)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444' }}>
                <X size={18}/> Close
              </button>
            </div>
          </div>

          {/* THE PRINTABLE A4 PAPER (Everything inside here gets printed) */}
          <div id="printable-soa" style={{ background: 'white', width: '100%', maxWidth: '850px', padding: '4rem', borderRadius: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', minHeight: '1056px', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '3px solid #0f172a', paddingBottom: '2rem', marginBottom: '3rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '32px', fontWeight: 900, letterSpacing: '2px', color: '#0f172a' }}>FANO DENTAL CLINIC</h1>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '16px', fontWeight: 600, letterSpacing: '4px', color: '#64748b', textTransform: 'uppercase' }}>Statement of Account</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>Date Issued: <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
            </div>

            {/* Patient Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '11px', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>BILLED TO:</p>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{selectedPatient.name}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{selectedPatient.address}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '11px', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>PATIENT DETAILS:</p>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '14px', color: '#0f172a' }}><strong>ID:</strong> {selectedPatient.medicalId || 'F-26-000'}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}><strong>Contact:</strong> {selectedPatient.contact}</p>
                </div>
            </div>

            {/* Billing Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #0f172a' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#475569', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#475569', textTransform: 'uppercase' }}>Procedure Description</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#475569', textTransform: 'uppercase' }}>Total Bill</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#475569', textTransform: 'uppercase' }}>Amount Paid</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#475569', textTransform: 'uppercase' }}>Remaining Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {soa.items.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No billing history found.</td></tr>
                    ) : (
                      soa.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '16px 8px', fontSize: '14px', color: '#334155' }}>{item.date}</td>
                              <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.service}</td>
                              <td style={{ padding: '16px 8px', textAlign: 'right', fontSize: '14px', color: '#334155' }}>₱{parseFloat(item.total || 0).toLocaleString()}</td>
                              <td style={{ padding: '16px 8px', textAlign: 'right', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>₱{parseFloat(item.paid || 0).toLocaleString()}</td>
                              <td style={{ padding: '16px 8px', textAlign: 'right', fontSize: '14px', fontWeight: 800, color: item.balance <= 0 ? '#10b981' : '#ef4444' }}>₱{parseFloat(item.balance || 0).toLocaleString()}</td>
                          </tr>
                      ))
                    )}
                </tbody>
            </table>

            {/* Grand Total */}
            <div style={{ textAlign: 'right', padding: '2rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block', float: 'right', minWidth: '350px' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '12px', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>TOTAL OUTSTANDING BALANCE</p>
                <h2 style={{ margin: 0, fontSize: '32px', color: soa.grandTotal <= 0 ? '#10b981' : '#ef4444', fontWeight: 900 }}>₱{soa.grandTotal.toLocaleString()}</h2>
            </div>
            <div style={{ clear: 'both' }}></div>

            {/* Signatures */}
            <div style={{ marginTop: '8rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '250px', textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #0f172a', height: '30px', marginBottom: '10px' }}></div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Patient / Representative</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Signature over printed name</p>
                </div>
                <div style={{ width: '250px', textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #0f172a', height: '30px', marginBottom: '10px' }}></div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Clinic Authorized Signatory</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Fano Dental Clinic</p>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}