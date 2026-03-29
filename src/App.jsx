import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import WalkIn from "./pages/WalkIn";
import Appointments from "./pages/Appointments"; // NEW IMPORT
import LiveQueue from "./pages/LiveQueue";
import Register from "./pages/Register";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Fano Clinic System...</div>;

  return (
    <>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#1e293b',
            color: '#fff',
            fontWeight: '600',
            padding: '16px 24px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
            zIndex: 9999
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} 
      />

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          
          <Route path="/live-queue" element={<LiveQueue />} />

          <Route path="/" element={<ProtectedRoute user={user}><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="register" element={<Register />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patient/:id" element={<PatientProfile />} />
            <Route path="appointments" element={<Appointments />} /> {/* NEW ROUTE */}
            <Route path="walk-in" element={<WalkIn />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}