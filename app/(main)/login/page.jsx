"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [showId, setShowId] = useState(false);
  const [loading, setLoading] = useState(false);


  const collectionsToCheck = [
    { name: "owners", idField: "ownerId", nameField: "ownerName", role: "owner", route: "/owner" },
    { name: "cashiers", idField: "cashierId", nameField: "cashierName", role: "cashier", route: "/cashier" },
    { name: "approvers", idField: "approverId", nameField: "approverName", role: "approver", route: "/approver" },
    { name: "auditors", idField: "auditorId", nameField: "auditorName", role: "auditor", route: "/auditor" },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
  

    
  if (loading) return; // ⛔ prevent double click

  setError("");
  setLoading(true); // 🔄 start loading

    const id = userId.trim();
    const name = userName.trim().toLowerCase();

    if (!id || !name) {
      setError("Please enter your ID and full name");
      return;
    }

    try {
      let foundUser = null;
      let redirectRoute = null;

      // 1. Loop through collections to find the user
      for (const col of collectionsToCheck) {
        const q = query(collection(db, col.name), where(col.idField, "==", id));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const match = snap.docs.find(
            (doc) => doc.data()[col.nameField]?.toLowerCase() === name
          );

          if (match) {
            const userData = match.data();
            foundUser = { role: col.role, data: userData };
            redirectRoute = col.route;

            // ✅ 2. LOG ACTIVITY (Branch & Staff tracking for Owner)
            await addDoc(collection(db, "loginLogs"), {
              userId: id,
              userName: userData[col.nameField],
              role: col.role,
              branchId: userData.branchId || "Head Office", 
              loginTime: serverTimestamp(),
              device: navigator.userAgent.toLowerCase().includes("mobile") ? "Mobile" : "Desktop",
              status: "success"
            });

            break; // Stop searching once user is found
          }
        }
      }

      if (!foundUser) {
        setError("Invalid ID or Name");
         setLoading(false);
        return;
      }

      // 3. Save session & Cookie
      setUser(foundUser);
      document.cookie = `branchUser=${JSON.stringify(foundUser)}; path=/; max-age=86400`;

      // 4. Redirect
      router.push(redirectRoute);
    } catch (err) {
      console.error("Login error:", err);
      setError("System error. Please try again.");
         setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
             <span className="text-white font-black text-2xl">KNT</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Login</h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Biro Management v2</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Staff / Owner ID</label>
            <input
              type={showId ? "text" : "password"}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none pr-14 font-bold text-slate-700"
              placeholder="Enter ID"
            />
            <button
              type="button"
              className="absolute right-5 top-[34px] text-slate-300 hover:text-indigo-600"
              onClick={() => setShowId(!showId)}
            >
              {showId ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
              placeholder="Enter Name"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 text-center animate-pulse">
              {error}
            </div>
          )}

        <button
  type="submit"
  disabled={loading}
  className={`w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest
    transition-all shadow-xl
    ${loading
      ? "bg-indigo-400 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-100"
    }`}
>
  {loading ? (
    <span className="flex items-center justify-center gap-3">
      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      Authenticating...
    </span>
  ) : (
    "Access Dashboard"
  )}
</button>

        </form>

        <p className="mt-10 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          Secured by KNT Limited Security Engine
        </p>
      </div>
    </div>
  );
}