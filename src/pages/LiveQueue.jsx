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
    return parts[0]; 
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
      
      {/* INITIAL CLICK OVERLAY TO ENABLE AUDIO */}
      {!isAudioEnabled && (
        <div onClick={enableAudio} style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(9, 9, 11, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Volume2 size={48} style={{ color: '#38bdf8', marginBottom: '1.5rem' }} />
          <h1 style={{ fontWeight: 300, fontSize: '2rem', letterSpacing: '2px' }}>INITIALIZE DISPLAY</h1>
          <p style={{ opacity: 0.5 }}>Tap to enable audio alerts</p>
        </div>
      )}

      <audio ref={audioRef} src="/sounds/ding.mp3" preload="auto" />

      {/* SLEEK WAITING LIST */}
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #27272a', background: '#18181b' }}>
        <div style={{ padding: '2.5rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '4px', color: '#ffffff' }}>WAITING QUEUE</h2>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 15px #38bdf8' }} />
        </div>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {waitingList.map((q) => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 0', borderBottom: '1px solid #27272a' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: '#38bdf8', width: '90px' }}>{q.queueNumber.toString().padStart(2, '0')}</span>
              <span style={{ fontWeight: 600, fontSize: '1.8rem', letterSpacing: '1px', color: '#ffffff' }}>{formatName(q.name)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: VIDEO & SERVING (SEPARATED) */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem' }}>
        
        {/* TOP: VIDEO PLAYER */}
        <div style={{ flexGrow: 1, background: '#000', borderRadius: '24px', overflow: 'hidden', border: '1px solid #27272a', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <video autoPlay controls style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
            <source src="/video/thor.mp4" type="video/mp4" />
          </video>
        </div>

        {/* BOTTOM: NOW SERVING PANEL */}
        <div style={{ height: '180px', background: '#18181b', borderRadius: '24px', padding: '0 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #27272a', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '3px', color: '#94a3b8', marginBottom: '0.5rem' }}>NOW SERVING</p>
            <h1 style={{ margin: 0, fontSize: '4.5rem', fontWeight: 700, letterSpacing: '2px', color: '#ffffff', lineHeight: 1 }}>
              {currentlyServing ? formatName(currentlyServing.name) : "AWAITING"}
            </h1>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '3px', color: '#94a3b8' }}>QUEUE</p>
            <div style={{ fontSize: '6rem', fontWeight: 700, color: '#38bdf8', lineHeight: 1 }}>
              {currentlyServing ? currentlyServing.queueNumber.toString().padStart(2, '0') : "--"}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}