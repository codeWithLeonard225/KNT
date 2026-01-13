"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { MdHistory, MdLocationOn, MdDevices, MdPerson, MdFiberManualRecord } from "react-icons/md";

export default function OwnerLoginHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user?.role !== "owner") return;

    // Use onSnapshot for REAL-TIME updates
    const q = query(
      collection(db, "loginLogs"),
      where("loginTime", ">=", new Date(today)), // Only show today's logins
      orderBy("loginTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Format the Firestore timestamp
        formattedTime: doc.data().loginTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, today]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading Access Logs...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <MdHistory className="text-indigo-600" /> Staff Attendance Logs
            </h1>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Tracking Activity for {today}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
              <MdFiberManualRecord className="animate-pulse" />
              <span className="font-bold text-sm">{logs.length} Logins Today</span>
            </div>
          </div>
        </header>

        {/* LOGS TABLE */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <tr>
                  <th className="p-6">Staff Member</th>
                  <th className="p-6">Branch</th>
                  <th className="p-6">Login Time</th>
                  <th className="p-6">Access Method</th>
                  <th className="p-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-400 italic">
                      No staff members have logged in yet today.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black">
                            {log.userName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{log.userName}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{log.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-1 font-semibold text-slate-600">
                          <MdLocationOn className="text-slate-300" />
                          {log.branchId}
                        </div>
                      </td>
                      <td className="p-6 font-mono font-bold text-indigo-600">
                        {log.formattedTime}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <MdDevices />
                          {log.device}
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                          Authorized
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER SUMMARY */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Earliest Login</p>
            <p className="text-xl font-bold text-slate-800">{logs[logs.length - 1]?.formattedTime || "--:--"}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Latest Activity</p>
            <p className="text-xl font-bold text-slate-800">{logs[0]?.formattedTime || "--:--"}</p>
          </div>
          <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 text-white">
            <p className="text-[10px] font-black text-indigo-200 uppercase mb-2">System Security</p>
            <p className="text-xl font-bold italic">All Terminals Secure</p>
          </div>
        </div>

      </div>
    </div>
  );
}