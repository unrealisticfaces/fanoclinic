import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { ref, push, onValue, remove } from "firebase/database";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({ 
    name: "", contact: "", date: "", time: "", procedure: "Check-up" 
  });
  
  const isAdmin = auth.currentUser?.email === "admin@gmail.com";

  useEffect(() => {
    onValue(ref(db, `appointments`), (snap) => {
      const data = snap.val();
      setAppointments(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a,b) => new Date(a.date) - new Date(b.date)) : []);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await push(ref(db, `appointments`), { ...formData, status: "Scheduled" });
      setFormData({ name: "", contact: "", date: "", time: "", procedure: "Check-up" });
      toast.success(`Appointment booked for ${formData.name}`);
    } catch (error) {
      console.error("Firebase Error:", error);
      toast.error(`Database Error: ${error.message}`); 
    }
  };

  const deleteRecord = async (id) => {
    if (window.confirm("Cancel and delete this appointment?")) {
      try {
        await remove(ref(db, `appointments/${id}`));
        toast.success("Appointment removed.");
      } catch (error) {
        toast.error(`Delete Error: ${error.message}`);
      }
    }
  };

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontWeight: 900, fontSize: '1.8rem', margin: 0 }}>Appointments</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Schedule and manage future patient visits.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
        
        {/* FORM SIDE */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}>New Booking</h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>PATIENT FULL NAME</label>
              <input placeholder="e.g. Juan Dela Cruz" className="modern-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>CONTACT NUMBER</label>
              <input placeholder="09XX-XXX-XXXX" className="modern-input" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} required />
            </div>

            {/* STACKED DATE AND TIME TO FIX OVERFLOW BUG */}
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>DATE</label>
                <input type="date" className="modern-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>TIME</label>
                <input type="time" className="modern-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>PROCEDURE</label>
              <select className="modern-input" value={formData.procedure} onChange={e => setFormData({...formData, procedure: e.target.value})}>
                <option value="Check-up">Check-up</option>
                <option value="Extraction">Extraction</option>
                <option value="Pasta">Pasta</option>
                <option value="Dental Implant">Dental Implant</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Braces">Braces</option>
              </select>
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Book Schedule</button>
          </form>
        </div>

        {/* TABLE SIDE */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1.2rem', width: '15%' }}>Date</th>
                <th style={{ padding: '1.2rem', width: '12%' }}>Time</th>
                <th style={{ padding: '1.2rem', width: '25%' }}>Patient Name</th>
                <th style={{ padding: '1.2rem', width: '18%' }}>Contact #</th>
                <th style={{ padding: '1.2rem', width: '20%' }}>Procedure</th>
                <th style={{ padding: '1.2rem', textAlign: 'center', width: '10%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No upcoming appointments scheduled.</td>
                </tr>
              ) : (
                appointments.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{app.date}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{formatTime(app.time)}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{app.name}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{app.contact}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{app.procedure}</td>
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {isAdmin && (
                        <button onClick={() => deleteRecord(app.id)} title="Cancel Appointment" style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}>
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}