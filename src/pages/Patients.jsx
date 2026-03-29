import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { Search, X, Eye, Edit3, User, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const [infoData, setInfoData] = useState({ fname: "", mname: "", lname: "", age: "", contact: "", address: "" });

  const isAdmin = auth.currentUser?.email === "admin@gmail.com";

  useEffect(() => {
    onValue(ref(db, "patients"), (snapshot) => {
      const data = snapshot.val();
      setPatients(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse() : []);
    });
  }, []);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;

    setLoading(true);
    const fullName = `${infoData.fname} ${infoData.mname} ${infoData.lname}`.trim();
    try {
      await update(ref(db, `patients/${editingPatient.id}`), { ...infoData, name: fullName });
      toast.success("Patient Profile Updated!");
      closeModal();
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeletePatient = (id, name) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <span style={{ fontWeight: 600 }}>Permanently delete all records for <strong>{name}</strong>?</span>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#334155', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={async () => {
              toast.dismiss(t.id);
              await remove(ref(db, `patients/${id}`));
              toast.success("Patient deleted.");
            }} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity });
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
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.8rem' }}>Patient Masterlist</h2>
      </div>

      <div style={{ position: 'relative', maxWidth: '450px', marginBottom: '2rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Search ID or Name..." className="modern-input" style={{ paddingLeft: '3rem', borderRadius: '50px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '1.2rem 1.5rem', width: '12%' }}>ID</th>
              <th style={{ padding: '1.2rem 0', width: '23%' }}>Full Name</th>
              <th style={{ padding: '1.2rem 0', width: '15%' }}>Contact #</th>
              <th style={{ padding: '1.2rem 0', width: '35%' }}>Complete Address</th>
              <th style={{ padding: '1.2rem', textAlign: 'center', width: '15%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                {/* ID Font size & weight reduced here! */}
                <td style={{ padding: '1rem 1.5rem' }}><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{p.medicalId}</span></td>
                <td style={{ padding: '1rem 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>{p.name}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>{p.contact}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.address}>{p.address}</td>
                <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem 1.2rem' }}>
                  <Link title="View Medical Chart" to={`/patient/${p.id}`} className="btn-primary" style={{ padding: '0.5rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569' }}><Eye size={18}/></Link>
                  <button title="Update Profile" onClick={() => handleEdit(p)} className="btn-primary" style={{ padding: '0.5rem', borderRadius: '8px' }}><Edit3 size={18}/></button>
                  {isAdmin && (
                    <button title="Delete Patient" onClick={() => handleDeletePatient(p.id, p.name)} className="btn-primary" style={{ padding: '0.5rem', borderRadius: '8px', background: '#fee2e2', color: '#ef4444' }}><Trash2 size={18}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingPatient && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '2.5rem', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer', zIndex: 10 }}><X /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <User size={24} color="var(--primary)" />
              <h3 style={{ margin: 0, fontWeight: 800 }}>Update Profile</h3>
            </div>
            
            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>MEDICAL ID</label>
                  <input className="modern-input" value={editingPatient.medicalId} readOnly style={{ background: '#f8fafc', fontWeight: 800, color: 'var(--primary)' }} />
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