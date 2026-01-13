"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { MdStore, MdSend, MdHistory, MdEdit, MdDelete, MdAccountBalance } from "react-icons/md";

export default function BranchManagement() {
  const { user } = useAuth();
  
  // Branch Form States
  const [branchId, setBranchId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [location, setLocation] = useState("");
  const [branchList, setBranchList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  // UI States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Allocation States
  const [activeLoans, setActiveLoans] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [allocating, setAllocating] = useState(false);
  const [allocData, setAllocData] = useState({
    loanId: "",
    branchInfo: "", // Combined ID and Name for the select value
    amount: "",
  });

  // 1. Fetch Branches, Loans, and Allocation History
  useEffect(() => {
    // Real-time branches
    const unsubBranches = onSnapshot(collection(db, "branches"), (snap) => {
      setBranchList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time bank loans
    const qLoans = query(collection(db, "bankLoans"), orderBy("createdAt", "desc"));
    const unsubLoans = onSnapshot(qLoans, (snap) => {
      setActiveLoans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time allocation history
    const qAlloc = query(collection(db, "branchAllocations"), orderBy("createdAt", "desc"));
    const unsubAlloc = onSnapshot(qAlloc, (snap) => {
      setAllocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubBranches(); unsubLoans(); unsubAlloc(); };
  }, []);

  // --- BRANCH CRUD LOGIC ---
  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "branches", editingId), {
          branchId: branchId.trim(),
          branchName: branchName.trim(),
          location: location.trim(),
          updatedAt: serverTimestamp()
        });
        setSuccess("Branch updated successfully");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "branches"), {
          branchId: branchId.trim(),
          branchName: branchName.trim(),
          location: location.trim(),
          createdAt: serverTimestamp()
        });
        setSuccess("Branch added successfully");
      }
      setBranchId(""); setBranchName(""); setLocation("");
    } catch (err) {
      setError("Failed to save branch");
    } finally {
      setLoading(false);
    }
  };

  // --- ALLOCATION LOGIC ---
  const handleAllocateFunds = async (e) => {
    e.preventDefault();
    if (!allocData.loanId || !allocData.branchInfo || !allocData.amount) return alert("Please fill all fields");
    
    setAllocating(true);
    const [bId, bName] = allocData.branchInfo.split('|');

    try {
      // 1. Save to branchAllocations
      await addDoc(collection(db, "branchAllocations"), {
        loanId: allocData.loanId,
        branchId: bId,
        branchName: bName,
        amountAllocated: Number(allocData.amount),
        currency: "SLE",
        allocationDate: new Date().toISOString().split("T")[0],
        allocatedBy: user?.data?.ownerName || "Owner",
        status: "sent",
        createdAt: serverTimestamp()
      });

      // 2. Log Vault Exit
      await addDoc(collection(db, "vaultLogs"), {
        type: "BRANCH_DISPATCH",
        amount: Number(allocData.amount),
        target: bName,
        reference: allocData.loanId,
        timestamp: serverTimestamp(),
      });

      setAllocData({ ...allocData, amount: "" });
      alert(`SLE ${allocData.amount} dispatched to ${bName}`);
    } catch (err) {
      alert("Error during dispatch");
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Operations Hub</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Branch & Fund Distribution Management</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: BRANCH SETUP */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <MdStore className="text-indigo-600" /> {editingId ? "Edit Branch" : "New Branch"}
              </h2>
              <form onSubmit={handleBranchSubmit} className="space-y-4">
                <input value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="Branch ID (e.g. BR-01)" className="w-full border-2 p-3 rounded-xl outline-none focus:border-indigo-500" />
                <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch Name" className="w-full border-2 p-3 rounded-xl outline-none focus:border-indigo-500" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full border-2 p-3 rounded-xl outline-none focus:border-indigo-500" />
                <button disabled={loading} className="w-full py-4 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                  {loading ? "Processing..." : editingId ? "Update Branch" : "Add Branch"}
                </button>
              </form>
            </div>

            {/* BRANCH MINI LIST */}
            <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b font-bold text-xs uppercase text-slate-500">Active Branches</div>
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {branchList.map(b => (
                  <div key={b.id} className="p-4 flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-800">{b.branchName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{b.location}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingId(b.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><MdEdit /></button>
                      <button onClick={() => deleteDoc(doc(db, "branches", b.id))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><MdDelete /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2 & 3: ALLOCATION & HISTORY */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ALLOCATION FORM */}
            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter">Dispatch Funds</h2>
                  <p className="text-indigo-100 text-xs font-bold uppercase">Move Bank Capital to Branches</p>
                </div>
                <MdSend size={32} className="opacity-50" />
              </div>
              
              <form onSubmit={handleAllocateFunds} className="grid md:grid-cols-2 gap-4">
                <select 
                  className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white font-bold outline-none"
                  value={allocData.loanId}
                  onChange={(e) => setAllocData({...allocData, loanId: e.target.value})}
                >
                  <option value="" className="text-slate-900">Source Loan...</option>
                  {activeLoans.map(l => <option key={l.id} value={l.loanId} className="text-slate-900">{l.loanId} - {l.bankName}</option>)}
                </select>

                <select 
                  className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white font-bold outline-none"
                  value={allocData.branchInfo}
                  onChange={(e) => setAllocData({...allocData, branchInfo: e.target.value})}
                >
                  <option value="" className="text-slate-900">Target Branch...</option>
                  {branchList.map(b => <option key={b.id} value={`${b.branchId}|${b.branchName}`} className="text-slate-900">{b.branchName}</option>)}
                </select>

                <input 
                  type="number" 
                  placeholder="Amount SLE"
                  className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white font-black text-xl placeholder:text-white/40 outline-none"
                  value={allocData.amount}
                  onChange={(e) => setAllocData({...allocData, amount: e.target.value})}
                />

                <button disabled={allocating} className="bg-white text-indigo-600 p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">
                  {allocating ? "Dispatching..." : "Release Funds"}
                </button>
              </form>
            </div>

            {/* ALLOCATION HISTORY TABLE */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm flex items-center gap-2">
                  <MdHistory className="text-indigo-600" /> Dispatch History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <th className="p-6">Destination</th>
                      <th className="p-6">Source Loan</th>
                      <th className="p-6 text-right">Amount</th>
                      <th className="p-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allocations.slice(0, 5).map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-6 font-bold text-slate-800">{alloc.branchName}</td>
                        <td className="p-6 text-xs font-bold text-slate-400">{alloc.loanId}</td>
                        <td className="p-6 text-right font-black text-slate-900">SLE {alloc.amountAllocated.toLocaleString()}</td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${alloc.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700 animate-pulse'}`}>
                            {alloc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}