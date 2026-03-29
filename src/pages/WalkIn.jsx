import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { ref, push, onValue, remove, update } from "firebase/database";
import { Trash2, Megaphone } from "lucide-react";
import toast from "react-hot-toast";

export default function WalkIn() {
  const [queue, setQueue] = useState([]);
  const [formData, setFormData] = useState({ 
    fname: "", mname: "", lname: "", age: "", address: "", procedure: "Check-up" 
  });
  const today = new Date().toLocaleDateString('en-CA');
  
  const isAdmin = auth.currentUser?.email === "admin@gmail.com";

  useEffect(() => {
    onValue(ref(db, `queues/${today}`), (snap) => {
      const data = snap.val();
      setQueue(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a,b) => a.queueNumber - b.queueNumber) : []);
    });
  }, [today]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextNum = queue.length > 0 ? Math.max(...queue.map(q => q.queueNumber)) + 1 : 1;
    const fullName = `${formData.fname} ${formData.mname} ${formData.lname}`.trim();
    
    try {
      await push(ref(db, `queues/${today}`), { 
        ...formData, 
        name: fullName, 
        queueNumber: nextNum, 
        status: "waiting" 
      });
      setFormData({ fname: "", mname: "", lname: "", age: "", address: "", procedure: "Check-up" });
      toast.success(`${fullName} added to the queue!`);
    } catch (error) {
      toast.error("Failed to add to queue.");
    }
  };

  const callNext = () => {
    const nextInLine = queue.find(q => q.status === "waiting");
    if (!nextInLine) return toast.error("No more patients waiting!");

    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <span style={{ fontWeight: 600 }}>Call <strong>{nextInLine.name}</strong> to the clinic?</span>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#334155', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const currentlyServing = queue.find(q => q.status === "serving");
              if (currentlyServing) await remove(ref(db, `queues/${today}/${currentlyServing.id}`));
              await update(ref(db, `queues/${today}/${nextInLine.id}`), { status: "serving" });
              toast.success(`${nextInLine.name} is now serving!`);
            }} 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
            Call Patient
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontWeight: 900, fontSize: '1.8rem', margin: 0 }}>Walk-in Line</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Assign queues for unregistered walk-ins</p>
        </div>
        <button onClick={callNext} className="btn-primary" style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', width: 'auto' }}>
          <Megaphone size={18} /> Call Next Patient
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}>New Entry</h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input placeholder="First Name" className="modern-input" value={formData.fname} onChange={e => setFormData({...formData, fname: e.target.value})} required />
            <input placeholder="Middle Name" className="modern-input" value={formData.mname} onChange={e => setFormData({...formData, mname: e.target.value})} />
            <input placeholder="Last Name" className="modern-input" value={formData.lname} onChange={e => setFormData({...formData, lname: e.target.value})} required />
            <input placeholder="Age" type="number" className="modern-input" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
            <input placeholder="Complete Address" className="modern-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            <select className="modern-input" value={formData.procedure} onChange={e => setFormData({...formData, procedure: e.target.value})}>
              <option value="Check-up">Check-up</option>
              <option value="Extraction">Extraction</option>
              <option value="Pasta">Pasta</option>
              <option value="Dental Implant">Dental Implant</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Braces">Braces</option>
            </select>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Assign Queue #</button>
          </form>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1.2rem 1.5rem', width: '8%' }}>#</th>
                <th style={{ padding: '1.2rem 0', width: '22%' }}>Full Name</th>
                <th style={{ padding: '1.2rem 0', width: '8%' }}>Age</th>
                <th style={{ padding: '1.2rem 0', width: '25%' }}>Address</th>
                <th style={{ padding: '1.2rem 0', width: '15%' }}>Procedure</th>
                <th style={{ padding: '1.2rem', textAlign: 'center', width: '12%' }}>Status</th>
                <th style={{ padding: '1.2rem', textAlign: 'center', width: '10%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>No walk-ins yet today.</td>
                </tr>
              ) : (
                queue.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)', background: q.status === 'serving' ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ background: q.status === 'serving' ? 'var(--success)' : 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '10px', fontWeight: 900 }}>{q.queueNumber}</span>
                    </td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>{q.name}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>{q.age}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.address}>
                      {q.address}
                    </td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>{q.procedure}</td>
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                        background: q.status === 'serving' ? '#dcfce7' : '#f1f5f9',
                        color: q.status === 'serving' ? '#166534' : '#64748b',
                        border: q.status === 'serving' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        display: 'inline-block'
                      }}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'center' }}>
                      {isAdmin && (
                        <button onClick={async () => {
                           await remove(ref(db, `queues/${today}/${q.id}`));
                           toast.success("Walk-in removed.");
                        }} style={{ border: 'none', background: 'none', color: '#fda4af', cursor: 'pointer', display: 'flex', margin: '0 auto' }}>
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