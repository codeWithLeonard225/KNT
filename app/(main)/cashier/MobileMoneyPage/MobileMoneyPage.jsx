"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { MdAccountBalance, MdHistory, MdCloudUpload, MdCheckCircle, MdReceiptLong, MdBadge } from "react-icons/md";

export default function MobileMoneyPage() {
  const { user } = useAuth();
  
  const CLOUD_NAME = "dxcrlpike"; 
  const UPLOAD_PRESET = "LeoTechSl Projects"; 

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerTel: "",
    serviceProvider: "Orange Money",
    referenceNumber: "", // Still kept for quick searching
    amountSLE: "",
  });

  // Files State
  const [idFile, setIdFile] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const providers = ["Orange Money", "Africell Money", "QCell Money", "Afro International", "MoneyGram", "Western Union", "BNB Cash"];

  const fetchRecords = async () => {
    if (!user?.data?.cashierId) return;
    const q = query(collection(db, "payoutRecords"), where("date", "==", today), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchRecords(); }, [user]);

  const uploadToCloudinary = async (file) => {
    if (!file) return "";
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Parallel Uploads for speed
      const [idUrl, slipUrl] = await Promise.all([
        uploadToCloudinary(idFile),
        uploadToCloudinary(slipFile)
      ]);

      await addDoc(collection(db, "payoutRecords"), {
        ...formData,
        idPhoto: idUrl,
        slipPhoto: slipUrl, // NEW: Photo of the receipt/reference doc
        cashierId: user.data.cashierId,
        branchId: user.data.branchId,
        date: today,
        status: "completed",
        createdAt: serverTimestamp(),
      });

      alert("Payout Recorded Successfully!");
      setFormData({ customerName: "", customerTel: "", serviceProvider: "Orange Money", referenceNumber: "", amountSLE: "" });
      setIdFile(null);
      setSlipFile(null);
      fetchRecords();
    } catch (err) {
      alert("Error processing payout");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="bg-emerald-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-black italic">KNT PAYOUT CENTER</h1>
          <p className="text-sm font-bold bg-white/20 px-4 py-1 rounded-full">{today}</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* INPUT FORM */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border space-y-4">
            <h2 className="font-bold text-emerald-800 uppercase text-sm tracking-widest">Transaction Details</h2>
            
            <select className="w-full bg-slate-50 border p-3 rounded-xl font-bold text-sm" value={formData.serviceProvider} onChange={(e) => setFormData({...formData, serviceProvider: e.target.value})}>
              {providers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <input required type="text" placeholder="Type Reference # (MTCN)" className="w-full bg-slate-50 border p-3 rounded-xl font-mono text-sm" value={formData.referenceNumber} onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})} />
            
            <input required type="text" placeholder="Receiver Name" className="w-full bg-slate-50 border p-3 rounded-xl text-sm" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />

            <div className="grid grid-cols-2 gap-2">
                <input required type="tel" placeholder="Phone" className="bg-slate-50 border p-3 rounded-xl text-sm" value={formData.customerTel} onChange={(e) => setFormData({...formData, customerTel: e.target.value})} />
                <input required type="number" placeholder="Amount SLE" className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-black text-emerald-700" value={formData.amountSLE} onChange={(e) => setFormData({...formData, amountSLE: e.target.value})} />
            </div>

            {/* DUAL UPLOAD SECTION */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-slate-50 transition text-center">
                <MdBadge className="text-emerald-600 mb-1" size={24} />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Customer ID</span>
                <p className="text-[8px] text-emerald-600 truncate w-full px-1">{idFile ? idFile.name : "Tap to Photo"}</p>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setIdFile(e.target.files[0])} />
              </label>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-slate-50 transition text-center">
                <MdReceiptLong className="text-indigo-600 mb-1" size={24} />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Ref. Slip</span>
                <p className="text-[8px] text-indigo-600 truncate w-full px-1">{slipFile ? slipFile.name : "Photo of Slip"}</p>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setSlipFile(e.target.files[0])} />
              </label>
            </div>

            <button disabled={uploading} className="w-full bg-emerald-700 text-white p-4 rounded-2xl font-bold shadow-lg disabled:bg-slate-300">
              {uploading ? "Uploading Docs..." : "Confirm & Pay Cash"}
            </button>
          </div>

          {/* TABLE SECTION */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                <tr>
                  <th className="p-4">Provider / Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-bold text-emerald-700">{r.serviceProvider}</p>
                      <code className="text-[10px] text-slate-400">{r.referenceNumber}</code>
                    </td>
                    <td className="p-4 font-bold">{r.customerName}</td>
                    <td className="p-4 font-black text-sm">SLE {Number(r.amountSLE).toLocaleString()}</td>
                    <td className="p-4 flex gap-2">
                      {r.idPhoto && <a href={r.idPhoto} target="_blank" className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">ID</a>}
                      {r.slipPhoto && <a href={r.slipPhoto} target="_blank" className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">SLIP</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}