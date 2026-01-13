"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { MdSend, MdCallReceived, MdHistory, MdCheckCircle, MdAccountBalanceWallet } from "react-icons/md";

export default function Cincout() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("send"); // 'send' or 'receive'
  
  // Forms State
  const [formData, setFormData] = useState({
    name: "",
    tel: "",
    momoType: "Orange Money",
    amount: "",
    receiverTel: "",
    receiverAddress: ""
  });

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  // Fetch Logic
  const fetchRecords = async () => {
    if (!user?.data?.cashierId) return;
    const q = query(collection(db, "cashierRecords"), where("date", "==", today));
    const snap = await getDocs(q);
    setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchRecords(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "cashierRecords"), {
        ...formData,
        category: activeTab === "send" ? "Send Money" : "Receive Money",
        cashierId: user.data.cashierId,
        branchId: user.data.branchId,
        date: today,
        amount: Number(formData.amount),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Transaction Recorded Successfully");
      setFormData({ name: "", tel: "", momoType: "Orange Money", amount: "", receiverTel: "", receiverAddress: "" });
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert("Error saving transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-indigo-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-xl">
          <div>
            <h1 className="text-2xl font-black">KNT MOBILE MONEY HUB</h1>
            <p className="text-indigo-300 text-sm">{user?.data?.branchId} | {user?.data?.cashierName}</p>
          </div>
          <MdAccountBalanceWallet size={40} className="text-indigo-400" />
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex bg-white p-2 rounded-xl shadow-sm border">
          <button 
            onClick={() => setActiveTab("send")}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${activeTab === 'send' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MdSend /> SEND MONEY
          </button>
          <button 
            onClick={() => setActiveTab("receive")}
            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${activeTab === 'receive' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MdCallReceived /> RECEIVE MONEY
          </button>
        </div>

        {/* DYNAMIC FORM */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            {activeTab === 'send' ? <span className="text-indigo-600">New Transfer</span> : <span className="text-emerald-600">New Cash-Out</span>}
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            {/* Common Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Customer Name</label>
                <input required type="text" className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Customer Tel</label>
                <input required type="tel" className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" placeholder="07... / 08... / 03..." value={formData.tel} onChange={(e) => setFormData({...formData, tel: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Provider</label>
                <select className="w-full border-b-2 p-2 outline-none focus:border-indigo-500 bg-transparent" value={formData.momoType} onChange={(e) => setFormData({...formData, momoType: e.target.value})}>
                  <option>Orange Money</option>
                  <option>Africell Money</option>
                  <option>QCell Money</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Amount (SLE)</label>
                <input required type="number" className="w-full border-b-2 p-2 text-2xl font-bold text-indigo-700 outline-none focus:border-indigo-500" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
            </div>

            {/* Conditional Fields for Send Money */}
            {activeTab === "send" && (
              <div className="md:col-span-2 grid md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
                <div>
                  <label className="text-xs font-bold text-indigo-400 uppercase">Receiver Tel</label>
                  <input required type="tel" className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" placeholder="Recipient's Phone" value={formData.receiverTel} onChange={(e) => setFormData({...formData, receiverTel: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-400 uppercase">Receiver Address</label>
                  <input required type="text" className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" placeholder="Recipient's Location" value={formData.receiverAddress} onChange={(e) => setFormData({...formData, receiverAddress: e.target.value})} />
                </div>
              </div>
            )}

            <button 
              disabled={loading}
              className={`md:col-span-2 h-14 rounded-xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95 ${activeTab === 'send' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {loading ? "Processing..." : "Confirm Transaction"}
            </button>
          </form>
        </div>

        {/* ACTIVITY TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2 font-bold text-gray-600 text-sm">
            <MdHistory size={20} /> RECENT TRANSACTIONS (TODAY)
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold">
              <tr>
                <th className="p-4">Type</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className={`p-4 font-bold ${r.category === 'Send Money' ? 'text-indigo-600' : 'text-emerald-600'}`}>{r.category}</td>
                  <td className="p-4">
                    <div className="font-bold">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.tel}</div>
                  </td>
                  <td className="p-4">{r.momoType}</td>
                  <td className="p-4 font-mono font-bold">SLE {r.amount.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      {r.status}
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