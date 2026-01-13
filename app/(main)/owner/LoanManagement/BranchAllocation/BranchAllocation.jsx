"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { MdSend, MdStore, MdAccountBalanceWallet, MdHistory, MdCheckCircle, MdArrowForward } from "react-icons/md";

export default function BranchAllocation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);

  const [formData, setFormData] = useState({
    loanId: "",
    branchId: "BR-001",
    branchName: "Kissy Branch",
    amountAllocated: "",
    currency: "SLE",
    allocationDate: new Date().toISOString().split("T")[0],
    status: "sent",
  });

  // Fetch Loans and Allocations
  useEffect(() => {
    const qLoans = query(collection(db, "bankLoans"), orderBy("createdAt", "desc"));
    const qAlloc = query(collection(db, "branchAllocations"), orderBy("createdAt", "desc"));

    const unsubLoans = onSnapshot(qLoans, (snap) => {
      setActiveLoans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAlloc = onSnapshot(qAlloc, (snap) => {
      setAllocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubLoans(); unsubAlloc(); };
  }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "branchAllocations"), {
        ...formData,
        amountAllocated: Number(formData.amountAllocated),
        allocatedBy: user?.data?.ownerName || "Owner",
        createdAt: serverTimestamp(),
      });

      // Log the movement out of the central vault
      await addDoc(collection(db, "vaultLogs"), {
        type: "BRANCH_DISPATCH",
        amount: Number(formData.amountAllocated),
        target: formData.branchName,
        reference: formData.loanId,
        timestamp: serverTimestamp(),
      });

      setFormData({ ...formData, amountAllocated: "" });
      alert("Funds dispatched to " + formData.branchName);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      
      {/* ALLOCATION FORM */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black">Distribute Funds</h2>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Move money from Bank Loan to Branch</p>
          </div>
          <MdSend size={32} />
        </div>

        <form onSubmit={handleAllocate} className="p-8 grid md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Select Source Loan</label>
            <select 
              required className="w-full bg-slate-50 border-2 p-4 rounded-2xl font-bold outline-none"
              value={formData.loanId}
              onChange={(e) => setFormData({...formData, loanId: e.target.value})}
            >
              <option value="">Select Loan...</option>
              {activeLoans.map(loan => (
                <option key={loan.id} value={loan.loanId}>
                  {loan.loanId} ({loan.bankName})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Target Branch</label>
            <select 
              className="w-full bg-slate-50 border-2 p-4 rounded-2xl font-bold outline-none"
              onChange={(e) => {
                const [id, name] = e.target.value.split('|');
                setFormData({...formData, branchId: id, branchName: name});
              }}
            >
              <option value="BR-001|Kissy Branch">Kissy Branch</option>
              <option value="BR-002|Makeni Branch">Makeni Branch</option>
              <option value="BR-003|Bo Branch">Bo Branch</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Amount (SLE)</label>
            <input 
              type="number" required placeholder="0.00"
              className="w-full bg-slate-50 border-2 p-4 rounded-2xl font-black text-indigo-600"
              value={formData.amountAllocated}
              onChange={(e) => setFormData({...formData, amountAllocated: e.target.value})}
            />
          </div>

          <button disabled={loading} className="bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            {loading ? "Sending..." : "Dispatch Cash"}
          </button>
        </form>
      </div>

      {/* TRACKING TABLE */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b flex items-center gap-2 font-black text-slate-700 uppercase text-sm">
          <MdHistory className="text-indigo-600" /> Dispatch History
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="p-6">Allocation Date</th>
                <th className="p-6">Source Loan</th>
                <th className="p-6">Destination</th>
                <th className="p-6 text-right">Amount</th>
                <th className="p-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-6 text-slate-500 font-medium">{alloc.allocationDate}</td>
                  <td className="p-6 font-bold text-slate-700">{alloc.loanId}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <MdStore className="text-slate-300" /> {alloc.branchName}
                    </div>
                  </td>
                  <td className="p-6 text-right font-black text-slate-900">
                    SLE {alloc.amountAllocated.toLocaleString()}
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      alloc.status === 'received' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-blue-100 text-blue-700 animate-pulse'
                    }`}>
                      {alloc.status === 'sent' ? '🚚 In Transit' : '✅ Received'}
                    </span>
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