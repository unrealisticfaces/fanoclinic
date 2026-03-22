import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, push, onValue, remove, update } from "firebase/database";
import { UserPlus, Trash2, Megaphone } from "lucide-react";

export default function WalkIn() {
  const [queue, setQueue] = useState([]);
  const [formData, setFormData] = useState({ name: "", age: "", address: "", procedure: "Check-up" });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    onValue(ref(db, `queues/${today}`), (snap) => {
      const data = snap.val();
      setQueue(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a,b) => a.queueNumber - b.queueNumber) : []);
    });
  }, [today]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextNum = queue.length > 0 ? Math.max(...queue.map(q => q.queueNumber)) + 1 : 1;
    await push(ref(db, `queues/${today}`), { ...formData, queueNumber: nextNum, status: "waiting" });
    setFormData({ name: "", age: "", address: "", procedure: "Check-up" });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h3 style={{ fontWeight: 900, marginBottom: '2rem' }}>Walk-in Logbook</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input placeholder="Full Name" className="modern-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input placeholder="Age" type="number" className="modern-input" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
            <input placeholder="Complete Address" className="modern-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            <select className="modern-input" value={formData.procedure} onChange={e => setFormData({...formData, procedure: e.target.value})}>
              <option value="Check-up">Check-up</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Extraction">Extraction</option>
            </select>
            <button type="submit" className="btn-primary">Assign Queue #</button>
          </form>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)' }}>
                <th style={{ padding: '1rem' }}>#</th>
                <th>Name & Age</th>
                <th>Complete Address</th>
                <th>Procedure</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(q => (
                <tr key={q.id}>
                  <td style={{ padding: '1rem' }}><span style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '10px', fontWeight: 900 }}>{q.queueNumber}</span></td>
                  <td><strong>{q.name}</strong> <small>({q.age})</small></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{q.address}</td>
                  <td>{q.procedure}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => remove(ref(db, `queues/${today}/${q.id}`))} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18}/></button>
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