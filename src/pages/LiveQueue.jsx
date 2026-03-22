import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Volume2 } from "lucide-react";

export default function LiveQueue() {
  const [queue, setQueue] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');
  const audioRef = useRef(null);
  const lastServedId = useRef(null);

  useEffect(() => {
    onValue(ref(db, `queues/${today}`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setQueue(list.sort((a, b) => a.queueNumber - b.queueNumber));
      } else { setQueue([]); }
    });
  }, [today]);

  const currentlyServing = queue.find(q => q.status === "serving");
  const waitingList = queue.filter(q => q.status === "waiting");

  const formatName = (fullName) => {
    if (!fullName) return "...";
    const parts = fullName.split(" ");
    return parts.length === 1 ? parts[0][0] + "." : parts[0][0] + "." + parts[parts.length - 1][0] + ".";
  };

  useEffect(() => {
    if (currentlyServing && currentlyServing.id !== lastServedId.current) {
      if (audioRef.current && isAudioEnabled) audioRef.current.play().catch(()=>{});
      lastServedId.current = currentlyServing.id;
    }
  }, [currentlyServing, isAudioEnabled]);

  const enableAudio = () => {
    setIsAudioEnabled(true);
    if (audioRef.current) { audioRef.current.play().then(() => { audioRef.current.pause(); audioRef.current.currentTime = 0; }); }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', background: '#09090b', color: '#f8fafc', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {!isAudioEnabled && (
        <div onClick={enableAudio} style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(9, 9, 11, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Volume2 size={48} style={{ color: '#38bdf8', marginBottom: '1.5rem' }} />
          <h1 style={{ fontWeight: 300, fontSize: '2rem', letterSpacing: '2px' }}>INITIALIZE DISPLAY</h1>
          <p style={{ opacity: 0.5 }}>Tap to enable audio alerts</p>
        </div>
      )}

      <audio ref={audioRef} src="/sounds/ding.mp3" preload="auto" />

      {/* SLEEK WAITING LIST */}
      <div style={{ width: '380px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #27272a', background: '#18181b' }}>
        <div style={{ padding: '2.5rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, letterSpacing: '4px', color: '#a1a1aa' }}>WAITING QUEUE</h2>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }} />
        </div>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {waitingList.map((q) => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0', borderBottom: '1px solid #27272a' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 300, color: '#38bdf8', width: '60px' }}>{q.queueNumber.toString().padStart(2, '0')}</span>
              <span style={{ fontWeight: 500, fontSize: '1.2rem', letterSpacing: '1px' }}>{formatName(q.name)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODERN VIDEO & SERVING DISPLAY */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ flexGrow: 1, background: '#000' }}>
          <video autoPlay controls style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
            <source src="/videos/2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* GLASSMORPHISM SERVING BANNER */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', background: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, letterSpacing: '3px', color: '#a1a1aa', marginBottom: '0.5rem' }}>NOW SERVING</p>
            <h1 style={{ margin: 0, fontSize: '3.5rem', fontWeight: 200, letterSpacing: '2px', color: '#fff' }}>
              {currentlyServing ? formatName(currentlyServing.name) : "AWAITING"}
            </h1>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, letterSpacing: '3px', color: '#a1a1aa' }}>QUEUE</p>
            <div style={{ fontSize: '4.5rem', fontWeight: 300, color: '#38bdf8', lineHeight: 1 }}>
              {currentlyServing ? currentlyServing.queueNumber.toString().padStart(2, '0') : "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}