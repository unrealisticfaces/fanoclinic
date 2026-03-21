import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, push, onValue, remove, update } from "firebase/database";
import { Trash2, Search, Edit, PlusCircle, X, UserCircle, Eye } from "lucide-react";
import { Link } from "react-router-dom"; // <-- We are using Link now for 100% reliability

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const isAdmin = auth.currentUser?.email === 'admin@gmail.com';

  const [formData, setFormData] = useState({
    name: "", age: "", contact: "", address: "", dateAdded: new Date().toLocaleDateString('en-CA'),
    procedure: "Extraction", dentist: "", amount: "", downpayment: ""
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId && isAdmin) {
        await update(ref(db, `patients/${editingId}`), {
          name: formData.name, age: formData.age, contact: formData.contact, address: formData.address
        });
      } else {
        const newPatientRef = await push(ref(db, "patients"), {
          name: formData.name, age: formData.age, contact: formData.contact, address: formData.address, dateAdded: formData.dateAdded
        });
        const pid = newPatientRef.key;
        const date = formData.dateAdded;
        const dentist = formData.dentist;
        const amount = formData.amount;
        const downpayment = formData.downpayment;

        if (formData.procedure === "Extraction") {
          await push(ref(db, `patients/${pid}/extractions`), { date, dentist, notes: "Initial Visit", amount, downpayment });
        } else if (formData.procedure === "Pasta") {
          await push(ref(db, `patients/${pid}/pasta`), { date, dentist, notes: "Initial Visit", amount, downpayment });
        } else if (formData.procedure === "Braces") {
          await push(ref(db, `patients/${pid}/braces`), { dateStarted: date, dentist, amount, downpayment });
        }
      }
      setFormData({ name: "", age: "", contact: "", address: "", dateAdded: new Date().toLocaleDateString('en-CA'), procedure: "Extraction", dentist: "", amount: "", downpayment: "" });
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save patient. Check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", age: "", contact: "", address: "", dateAdded: new Date().toLocaleDateString('en-CA'), procedure: "Extraction", dentist: "", amount: "", downpayment: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (patient) => {
    setEditingId(patient.id);
    setFormData({ name: patient.name, age: patient.age, contact: patient.contact, address: patient.address, dateAdded: patient.dateAdded || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL WARNING: Delete this patient and ALL their medical history?")) {
      await remove(ref(db, `patients/${id}`));
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800, fontSize: '1.5rem' }}>Patient Masterlist</h3>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Search and manage your clinic's patients</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search patients..." className="modern-input" style={{ paddingLeft: '2.5rem', borderRadius: '50px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={openAddModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <PlusCircle size={18} /> New Patient
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Patient Name</th>
                <th style={{ textAlign: 'left' }}>Age</th>
                <th style={{ textAlign: 'left' }}>Contact</th>
                <th style={{ textAlign: 'left' }}>Address</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (<tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No patients found.</td></tr>) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary)' }}><UserCircle size={24} /></div>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{patient.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Added: {patient.dateAdded || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'left', verticalAlign: 'middle', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{patient.age}</td>
                    <td style={{ textAlign: 'left', verticalAlign: 'middle', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{patient.contact}</td>
                    <td style={{ textAlign: 'left', verticalAlign: 'middle', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{patient.address}</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        
                        {/* THE BULLETPROOF REACT LINK */}
                        <Link to={`/patient/${patient.id}`} style={{ background: 'var(--text-main)', color: 'white', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Eye size={14} /> Details
                        </Link>

                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(patient)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '0.5rem', borderRadius: '50px', cursor: 'pointer' }}><Edit size={16} /></button>
                            <button onClick={() => handleDelete(patient.id)} style={{ background: '#ffe4e6', color: 'var(--danger)', border: 'none', padding: '0.5rem', borderRadius: '50px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '550px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', fontWeight: 800 }}>{editingId ? "Edit Patient Details" : "Register New Patient"}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="modern-input" required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Age</label><input type="number" name="age" value={formData.age} onChange={handleChange} className="modern-input" required /></div>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Contact #</label><input type="text" name="contact" value={formData.contact} onChange={handleChange} className="modern-input" required /></div>
              </div>
              <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Complete Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="modern-input" required /></div>
              {!editingId && (
                <div style={{ marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700 }}>Initial Procedure Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Procedure</label>
                      <select name="procedure" value={formData.procedure} onChange={handleChange} className="modern-input" style={{ cursor: 'pointer' }}>
                        <option value="Extraction">Extraction</option><option value="Pasta">Restoration (Pasta)</option><option value="Braces">Orthodontics (Braces)</option>
                      </select>
                    </div>
                    <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Dentist In-charge</label><input type="text" name="dentist" placeholder="Dr. Name" value={formData.dentist} onChange={handleChange} className="modern-input" required={!editingId} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '10px' }}><label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', marginBottom: '0.5rem', display: 'block' }}>Total Amount (₱)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="modern-input" style={{ borderColor: '#fcd34d' }} required={!editingId} /></div>
                    <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '10px' }}><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: '0.5rem', display: 'block' }}>Downpayment / Paid (₱)</label><input type="number" name="downpayment" value={formData.downpayment} onChange={handleChange} className="modern-input" style={{ borderColor: '#99f6e4' }} required={!editingId} /></div>
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>{loading ? "Saving..." : editingId ? "Update Details" : "Create Patient File"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}