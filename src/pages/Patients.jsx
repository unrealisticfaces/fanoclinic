import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, push, onValue, update } from "firebase/database";
import { Search, X, Eye, Edit3, UserPlus, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const [infoData, setInfoData] = useState({ fname: "", mname: "", lname: "", age: "", contact: "", address: "" });

  useEffect(() => {
    onValue(ref(db, "patients"), (snapshot) => {
      const data = snapshot.val();
      setPatients(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse() : []);
    });
  }, []);

  const generateID = () => `F-${new Date().getFullYear().toString().slice(-2)}-${(patients.length + 1).toString().padStart(3, '0')}`;

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fullName = `${infoData.fname} ${infoData.mname} ${infoData.lname}`.trim();
    try {
      if (editingPatient) {
        await update(ref(db, `patients/${editingPatient.id}`), { ...infoData, name: fullName });
      } else {
        await push(ref(db, "patients"), { ...infoData, name: fullName, medicalId: generateID(), dateRegistered: new Date().toLocaleDateString('en-CA') });
      }
      closeModal();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
    setInfoData({ fname: "", mname: "", lname: "", age: "", contact: "", address: "" });
  };

  const handleEdit = (p) => {
    setEditingPatient(p);
    const names = p.name ? p.name.split(" ") : ["", "", ""];
    setInfoData({ fname: p.fname || names[0] || "", mname: p.mname || names[1] || "", lname: p.lname || names[names.length-1] || "", age: p.age, contact: p.contact, address: p.address });
    setIsModalOpen(true);
  };

  const filtered = patients.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.medicalId?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.8rem' }}>Patient Masterlist</h2>
        <button onClick={() => { setEditingPatient(null); setIsModalOpen(true); }} className="btn-primary" style={{ width: 'auto', padding: '0.8rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
          <UserPlus size={20} /> New Registration
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: '450px', marginBottom: '2rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Search ID or Name..." className="modern-input" style={{ paddingLeft: '3rem', borderRadius: '50px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '1.2rem' }}>ID</th>
              <th>Full Name</th>
              <th>Contact</th>
              <th>Complete Address</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.2rem' }}><span style={{ fontWeight: 800, color: 'var(--primary)' }}>{p.medicalId}</span></td>
                <td style={{ fontWeight: 700 }}>{p.name}</td>
                <td>{p.contact}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.address}</td>
                <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem' }}>
                  <Link title="View Medical Chart" to={`/patient/${p.id}`} className="btn-primary" style={{ padding: '0.5rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569' }}><Eye size={18}/></Link>
                  <button title="Update Profile" onClick={() => handleEdit(p)} className="btn-primary" style={{ padding: '0.5rem', borderRadius: '8px' }}><Edit3 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '2.5rem', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer', zIndex: 10 }}><X /></button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <User size={24} color="var(--primary)" />
              <h3 style={{ margin: 0, fontWeight: 800 }}>{editingPatient ? 'Update Profile' : 'Register Patient'}</h3>
            </div>
            
            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>MEDICAL ID</label>
                  <input className="modern-input" value={editingPatient ? editingPatient.medicalId : generateID()} readOnly style={{ background: '#f8fafc', fontWeight: 800, color: 'var(--primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AGE</label>
                  <input className="modern-input" type="number" value={infoData.age} onChange={e => setInfoData({...infoData, age: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>FIRST NAME</label>
                  <input className="modern-input" value={infoData.fname} onChange={e => setInfoData({...infoData, fname: e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>MIDDLE NAME</label>
                  <input className="modern-input" value={infoData.mname} onChange={e => setInfoData({...infoData, mname: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>LAST NAME</label>
                  <input className="modern-input" value={infoData.lname} onChange={e => setInfoData({...infoData, lname: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CONTACT NUMBER</label>
                <input className="modern-input" value={infoData.contact} onChange={e => setInfoData({...infoData, contact: e.target.value})} required />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>COMPLETE ADDRESS</label>
                <input className="modern-input" value={infoData.address} onChange={e => setInfoData({...infoData, address: e.target.value})} required />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>{loading ? 'Saving...' : 'Save Profile Changes'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}