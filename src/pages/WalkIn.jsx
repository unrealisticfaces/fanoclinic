import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, push, onValue, remove, update } from "firebase/database";
import { UserPlus, Trash2, Megaphone, UserCheck } from "lucide-react";

export default function WalkIn() {
  const [queue, setQueue] = useState([]);
  const [formData, setFormData] = useState({ name: "", age: "", procedure: "Check-up" });
  const today = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    const queueRef = ref(db, `queues/${today}`);
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setQueue(list.sort((a, b) => a.queueNumber - b.queueNumber));
      } else {
        setQueue([]);
      }
    });
    return () => unsubscribe();
  }, [today]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextNumber = queue.length > 0 ? Math.max(...queue.map(q => q.queueNumber)) + 1 : 1;
    
    await push(ref(db, `queues/${today}`), {
      ...formData,
      queueNumber: nextNumber,
      status: "waiting",
      timestamp: Date.now()
    });
    setFormData({ name: "", age: "", procedure: "Check-up" });
  };

  const callNext = async () => {
    const nextInLine = queue.find(q => q.status === "waiting");
    if (!nextInLine) return alert("No more patients waiting!");

    if (window.confirm(`Call ${nextInLine.name} to the clinic?`)) {
      // Remove the previous person who was being served
      const currentlyServing = queue.find(q => q.status === "serving");
      if (currentlyServing) {
        await remove(ref(db, `queues/${today}/${currentlyServing.id}`));
      }
      
      // Update the next person to "serving" status
      await update(ref(db, `queues/${today}/${nextInLine.id}`), { status: "serving" });
    }
  };

  const removePatient = async (id) => {
    if (window.confirm("Remove from log?")) {
      await remove(ref(db, `queues/${today}/${id}`));
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>Walk-in Logbook</h3>
        <button onClick={callNext} className="btn-primary" style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.8rem 1.5rem' }}>
          <Megaphone size={18} /> Call Next Patient
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserPlus size={20} color="var(--primary)"/> New Entry</h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" placeholder="Name" className="modern-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="number" placeholder="Age" className="modern-input" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
            <select className="modern-input" value={formData.procedure} onChange={e => setFormData({...formData, procedure: e.target.value})}>
                <option value="Check-up">Check-up</option>
                <option value="Extraction">Extraction</option>
                <option value="Pasta">Pasta</option>
                <option value="Braces">Braces</option>
            </select>
            <button type="submit" className="btn-primary">Add to Log</button>
          </form>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)' }}>
                <th style={{ padding: '1rem' }}>#</th>
                <th>Patient Name</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q) => (
                <tr key={q.id} style={{ background: q.status === 'serving' ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ padding: '1rem' }}><span style={{ background: q.status === 'serving' ? 'var(--success)' : 'var(--primary)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '8px', fontWeight: 800 }}>{q.queueNumber}</span></td>
                  <td style={{ fontWeight: 700 }}>{q.name} {q.status === 'serving' && <UserCheck size={14} style={{marginLeft: '5px'}} color="var(--success)"/>}</td>
                  <td><span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: q.status === 'serving' ? 'var(--success)' : 'var(--text-muted)' }}>{q.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => removePatient(q.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}