import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import WalkIn from "./pages/WalkIn";
import LiveQueue from "./pages/LiveQueue";
import SOA from "./pages/SOA";

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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        
        {/* Live TV is public so you can run it on a separate screen easily */}
        <Route path="/live-queue" element={<LiveQueue />} />

        <Route path="/" element={<ProtectedRoute user={user}><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patient/:id" element={<PatientProfile />} />
          <Route path="walk-in" element={<WalkIn />} />
          <Route path="soa" element={<SOA />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}