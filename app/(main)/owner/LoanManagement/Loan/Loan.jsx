"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { 
  MdAccountBalance, MdTrendingUp, MdAttachMoney, 
  MdCheckCircle, MdList, MdAccessTime 
} from "react-icons/md";

export default function Loan() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [loans, setLoans] = useState([]); // State for the table

  const [formData, setFormData] = useState({
    loanId: `BL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    bankName: "Rokel Commercial Bank",
    amount: "",
    currency: "SLE",
    interestRate: 10,
    durationMonths: 12,
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "active",
  });

  // 1. Fetch loans from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "bankLoans"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loanList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLoans(loanList);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      // 1. Save to bankLoans collection
      await addDoc(collection(db, "bankLoans"), {
        ...formData,
        amount: Number(formData.amount),
        interestRate: Number(formData.interestRate),
        durationMonths: Number(formData.durationMonths),
        createdBy: user?.data?.ownerName || "Owner",
        createdAt: serverTimestamp(),
      });

      // 2. Log into Capital/Vault history as an 'Injection'
      await addDoc(collection(db, "vaultLogs"), {
        type: "BANK_LOAN_INJECTION",
        amount: Number(formData.amount),
        reference: formData.loanId,
        description: `Loan received from ${formData.bankName}`,
        timestamp: serverTimestamp(),
      });

      setSuccess("Loan successfully registered and capital updated!");
      
      // Reset form (except bank selection)
      setFormData({
        ...formData,
        loanId: `BL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        amount: "",
        dueDate: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error saving loan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      {/* FORM SECTION */}
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Bank Loan Setup</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Official Capital Record</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <MdAccountBalance size={32} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Loan Reference ID</label>
              <input 
                disabled className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-mono font-bold text-slate-500"
                value={formData.loanId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lending Bank</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-500 outline-none"
                value={formData.bankName}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              >
                <option>Rokel Commercial Bank</option>
                <option>Sierra Leone Commercial Bank (SLCB)</option>
                <option>United Bank for Africa (UBA)</option>
                <option>Zenith Bank</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Principal Amount (SLE)</label>
              <div className="relative">
                <MdAttachMoney className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 size-6" />
                <input 
                  type="number" required placeholder="500,000"
                  className="w-full bg-emerald-50/30 border-2 border-emerald-100 p-4 pl-12 rounded-2xl font-black text-2xl text-emerald-700 focus:border-emerald-500 outline-none"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Interest Rate (%)</label>
              <div className="relative">
                <MdTrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold text-xl outline-none"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Duration (Months)</label>
              <input 
                type="number" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold"
                value={formData.durationMonths}
                onChange={(e) => setFormData({...formData, durationMonths: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Start Date</label>
              <input 
                type="date" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Due Date</label>
              <input 
                type="date" required className="w-full bg-orange-50 border-2 border-orange-100 p-4 rounded-2xl font-bold text-orange-700 outline-none"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
          >
            {loading ? "Authenticating Record..." : "Register Loan & Release Capital"}
          </button>

          {success && (
            <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 p-4 rounded-2xl font-bold animate-pulse">
              <MdCheckCircle size={24} /> {success}
            </div>
          )}
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-700 uppercase tracking-wider text-sm flex items-center gap-2">
            <MdList className="text-indigo-600" size={20} /> Loan Registry
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="p-6">Loan ID / Bank</th>
                <th className="p-6">Principal</th>
                <th className="p-6">Interest</th>
                <th className="p-6">Total Due</th>
                <th className="p-6">Due Date</th>
                <th className="p-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loans.map((loan) => {
                const totalDue = loan.amount + (loan.amount * (loan.interestRate / 100));
                return (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-slate-800">{loan.loanId}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{loan.bankName}</p>
                    </td>
                    <td className="p-6 font-bold text-slate-600">SLE {loan.amount?.toLocaleString()}</td>
                    <td className="p-6 text-xs font-bold text-slate-400">{loan.interestRate}%</td>
                    <td className="p-6 font-black text-indigo-600 text-lg">SLE {totalDue?.toLocaleString()}</td>
                    <td className="p-6 text-slate-500 font-medium">
                      <div className="flex items-center gap-1"><MdAccessTime /> {loan.dueDate}</div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${loan.status === 'active' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loans.length === 0 && (
            <div className="p-20 text-center text-slate-300 italic font-bold">No loans registered yet.</div>
          )}
        </div>

        {/* SUMMARY BAR */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Liabilities Across Biro</p>
          <p className="text-2xl font-black text-emerald-400">
            SLE {loans.reduce((acc, curr) => acc + (curr.amount + (curr.amount * (curr.interestRate / 100))), 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}