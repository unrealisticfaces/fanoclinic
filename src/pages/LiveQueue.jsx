import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Volume2, Monitor } from "lucide-react";

export default function LiveQueue() {
  const [queue, setQueue] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');
  
  const audioRef = useRef(null); // For the Ding sound
  const lastServedId = useRef(null);

  // --- PLAYLIST ---
  const playlist = ["/videos/2.mp4"];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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

  const currentlyServing = queue.find(q => q.status === "serving");
  const waitingList = queue.filter(q => q.status === "waiting");

  // --- DING LOGIC ---
  useEffect(() => {
    if (currentlyServing && currentlyServing.id !== lastServedId.current) {
      if (audioRef.current && isAudioEnabled) {
        audioRef.current.play().catch(e => console.log("Ding blocked"));
      }
      lastServedId.current = currentlyServing.id;
    }
  }, [currentlyServing, isAudioEnabled]);

  const handleVideoEnd = () => {
    const nextIndex = (currentVideoIndex + 1) % playlist.length;
    setCurrentVideoIndex(nextIndex);
  };

  // This "unlocks" both the movie audio and the Ding sound
  const enableAudio = () => {
    setIsAudioEnabled(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      });
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#0f172a', padding: '0.75rem', gap: '0.75rem', overflow: 'hidden', position: 'relative' }}>
      
      {/* INITIAL CLICK OVERLAY (Required by Chrome for Movie Audio) */}
      {!isAudioEnabled && (
        <div 
          onClick={enableAudio}
          style={{ 
            position: 'absolute', inset: 0, zIndex: 999, 
            background: 'rgba(15, 23, 42, 0.95)', display: 'flex', 
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white'
          }}
        >
          <div style={{ background: 'var(--primary)', padding: '2.5rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 50px rgba(20, 184, 166, 0.5)' }}>
            <Volume2 size={64} />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '2.5rem', margin: 0 }}>START CLINIC TV</h1>
          <p style={{ opacity: 0.8, fontSize: '1.2rem', marginTop: '1rem' }}>Click anywhere to enable Movie Audio & Patient Alerts</p>
        </div>
      )}

      {/* DING SOUND ASSET */}
      <audio ref={audioRef} src="/sounds/ding.mp3" preload="auto" />

      {/* LEFT: WAITING LIST */}
      <div style={{ width: '320px', background: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '2rem 1.5rem', background: 'var(--text-main)', color: 'white', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>Waiting List</h2>
        </div>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.2rem' }}>
          {waitingList.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>
              <Monitor size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <p>No patients in line</p>
            </div>
          ) : (
            waitingList.map((q) => (
              <div key={q.id} style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', 
                background: 'var(--bg-color)', borderRadius: '18px', marginBottom: '1rem', border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', minWidth: '45px' }}>{q.queueNumber}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{q.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.procedure}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: VIDEO & SERVING */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* TOP: MP4 PLAYER (Audio Unmuted) */}
        <div style={{ flexGrow: 1, background: 'black', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
          <video 
            key={playlist[currentVideoIndex]}
            autoPlay 
            // REMOVED 'muted' attribute here so Thor has sound
            loop={playlist.length === 1}
            controls 
            onEnded={handleVideoEnd}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          >
            <source src={playlist[currentVideoIndex]} type="video/mp4" />
          </video>
        </div>

        {/* BOTTOM: NOW SERVING */}
        <div style={{ 
          height: '160px', background: 'var(--success)', color: 'white', borderRadius: '24px', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9, letterSpacing: '1px' }}>Now Serving</p>
            <h1 style={{ margin: 0, fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-1.5px' }}>
              {currentlyServing ? currentlyServing.name : "..."}
            </h1>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>QUEUE NO.</p>
                <div style={{ fontSize: '5.5rem', fontWeight: 950, lineHeight: 1 }}>
                  {currentlyServing ? currentlyServing.queueNumber : "--"}
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}