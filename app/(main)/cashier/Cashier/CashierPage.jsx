"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { MdPerson, MdPublic, MdBadge, MdCloudUpload, MdCheckCircle, MdHistory } from "react-icons/md";

export default function CashierPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Cloudinary Config
  const CLOUD_NAME = "dxcrlpike"; 
  const UPLOAD_PRESET = "LeoTechSl Projects"; 

  const [currency, setCurrency] = useState("SLL");


  // Form State
  const [type, setType] = useState("buyfx");
  const [amount, setAmount] = useState("");
  const [sender, setSender] = useState({ name: "", address: "", tel: "" });
  const [receiver, setReceiver] = useState({ name: "", address: "", country: "", tel: "" });
  
  // UI State
  const [records, setRecords] = useState([]);
  const [tempFile, setTempFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // 1. Auth Protection
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "cashier")) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // 2. Fetch Today's Records
  const fetchRecords = async () => {
    if (!user?.data?.cashierId) return;
    try {
      const q = query(
        collection(db, "cashierRecords"),
        where("cashierId", "==", user.data.cashierId),
        where("date", "==", today)
      );
      const snap = await getDocs(q);
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  // 3. Cloudinary Upload Logic
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json();
    return data.secure_url;
  };

  // 4. Submit Transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || !sender.name || !receiver.name) {
      setError("Amount, Sender Name, and Receiver Name are required.");
      return;
    }

    setUploading(true);

    try {
      let idPhotoUrl = "";
      if (tempFile) {
        idPhotoUrl = await uploadToCloudinary(tempFile);
      }

      const recordData = {
        cashierId: user.data.cashierId,
        cashierName: user.data.cashierName,
        branchId: user.data.branchId,
        type,
        amount: Number(amount),
         currency,
        sender: { ...sender, idPhoto: idPhotoUrl },
        receiver,
        date: today,
        status: "pending", // For Approver/Auditor to review
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "cashierRecords"), recordData);

      setSuccess("Transaction posted successfully!");
      setAmount("");
      setTempFile(null);
      setSender({ name: "", address: "", tel: "" });
      setReceiver({ name: "", address: "", country: "", tel: "" });
      fetchRecords(); // Refresh list
    } catch (err) {
      console.error(err);
      setError("Failed to save transaction. Check connection.");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) return <div className="p-10 text-center">Loading Session...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="bg-indigo-800 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">KNT BUREAU SYSTEM</h1>
            <p className="text-indigo-200 text-sm">
              Branch: <span className="font-bold text-white">{user?.data?.branchId}</span> | 
              Cashier: <span className="font-bold text-white">{user?.data?.cashierName}</span>
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs uppercase opacity-60">Session Date</p>
            <p className="font-mono font-bold">{today}</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* SENDER SECTION */}
            <fieldset className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <legend className="px-4 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full text-xs flex items-center gap-2">
                <MdPerson size={16} /> SENDER (KYC)
              </legend>
              <input
                type="text" placeholder="Full Name"
                className="w-full border-b p-2 outline-none focus:border-indigo-600 transition"
                value={sender.name} onChange={(e) => setSender({...sender, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel" placeholder="Phone Number"
                  className="w-full border-b p-2 outline-none focus:border-indigo-600 transition"
                  value={sender.tel} onChange={(e) => setSender({...sender, tel: e.target.value})}
                />
                <input
                  type="text" placeholder="Physical Address"
                  className="w-full border-b p-2 outline-none focus:border-indigo-600 transition"
                  value={sender.address} onChange={(e) => setSender({...sender, address: e.target.value})}
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-400 transition">
                  <MdCloudUpload className="text-indigo-600" size={24} />
                  <div className="text-left">
                    <p className="text-xs font-bold">Upload ID Card Photo</p>
                    <p className="text-[10px] text-gray-500">{tempFile ? tempFile.name : "Passport, Voter ID, or License"}</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setTempFile(e.target.files[0])} />
                </label>
              </div>
            </fieldset>

            {/* RECEIVER SECTION */}
            <fieldset className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <legend className="px-4 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs flex items-center gap-2">
                <MdPublic size={16} /> RECEIVER DETAILS
              </legend>
              <input
                type="text" placeholder="Full Name"
                className="w-full border-b p-2 outline-none focus:border-emerald-600 transition"
                value={receiver.name} onChange={(e) => setReceiver({...receiver, name: e.target.value})}
              />
              <input
                type="text" placeholder="Destination Country"
                className="w-full border-b p-2 outline-none focus:border-emerald-600 transition"
                value={receiver.country} onChange={(e) => setReceiver({...receiver, country: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel" placeholder="Phone Number"
                  className="w-full border-b p-2 outline-none focus:border-emerald-600 transition"
                  value={receiver.tel} onChange={(e) => setReceiver({...receiver, tel: e.target.value})}
                />
                <input
                  type="text" placeholder="Physical Address"
                  className="w-full border-b p-2 outline-none focus:border-emerald-600 transition"
                  value={receiver.address} onChange={(e) => setReceiver({...receiver, address: e.target.value})}
                />
              </div>
            </fieldset>
          </div>

          {/* ACTION BAR */}
          <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-indigo-600 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Transaction Type</label>
              <select 
                className="w-full p-2 text-lg font-semibold bg-transparent border-b-2 border-gray-100 outline-none focus:border-indigo-600"
                value={type} onChange={(e) => setType(e.target.value)}
              >
                <option value="buyfx">Buy FX (Bureau gets Foreign)</option>
                <option value="sellfx">Sell FX (Bureau gives Foreign)</option>
                <option value="sendmoney">Send Money</option>
                <option value="receivemoney">Receive Money</option>
              </select>
            </div>

          <div className="w-full md:w-1/3 text-center">
  <label className="text-[10px] font-bold text-gray-400 uppercase">
    Amount
  </label>

  <div className="flex items-center gap-2">
    {/* Currency Selector */}
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="h-12 px-3 rounded-lg border bg-gray-50 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="SLL">SLL</option>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>

    {/* Amount Input */}
    <input
      type="number"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      className="flex-1 p-2 text-3xl font-black text-center text-indigo-700 outline-none placeholder:text-gray-200"
      placeholder="0.00"
    />
  </div>
</div>


            <div className="w-full md:w-1/3">
              <button 
                disabled={uploading}
                className="w-full bg-indigo-600 text-white h-16 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:bg-gray-300"
              >
                {uploading ? "Processing..." : <><MdCheckCircle size={24}/> Post Transaction</>}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-center font-bold">{error}</p>}
          {success && <p className="text-emerald-600 text-center font-bold">{success}</p>}
        </form>

        {/* TODAY'S ACTIVITY TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <MdHistory className="text-gray-400" />
            <h2 className="font-bold text-sm text-gray-600 uppercase tracking-widest">Today's Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase text-gray-400 bg-gray-50">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Sender</th>
                  <th className="p-4">Receiver</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">ID Card</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y">
                {records.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-gray-400 italic">No transactions recorded yet today.</td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-indigo-50 transition">
                      <td className="p-4 font-bold text-indigo-600 uppercase">{r.type}</td>
                      <td className="p-4">
                        <p className="font-semibold">{r.sender?.name}</p>
                        <p className="text-[10px] text-gray-500">{r.sender?.tel}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{r.receiver?.name}</p>
                        <p className="text-[10px] text-gray-500">{r.receiver?.country}</p>
                      </td>
                     <td className="p-4 text-right font-mono font-bold text-lg">
  {r.currency} {r.amount.toLocaleString()}
</td>
                      <td className="p-4 text-center">
                        {r.sender?.idPhoto ? (
                          <a href={r.sender.idPhoto} target="_blank" className="text-indigo-600 text-xs hover:underline font-bold">View ID</a>
                        ) : "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-black uppercase italic">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}