"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import {
  MdStore,
  MdHistory,
  MdAccountBalance,
} from "react-icons/md";

export default function BranchReceipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  const branchId = user?.data?.branchId;
  const branchName = user?.data?.branchName;

  useEffect(() => {
    if (!branchId) return;

    const q = query(
      collection(db, "branchAllocations"),
      where("branchId", "==", branchId),
   
    );

    const unsub = onSnapshot(q, (snap) => {
      setReceipts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [branchId]);

  const handleMarkReceived = async (allocation) => {
  if (!confirm("Confirm that you have physically received this money?")) return;

  try {
    // 1. Update allocation status
    await updateDoc(doc(db, "branchAllocations", allocation.id), {
      status: "received",
      receivedAt: serverTimestamp(),
      receivedBy: user?.data?.cashierName || "Cashier"
    });

    // 2. Log receipt for audit trail
    await addDoc(collection(db, "vaultLogs"), {
      type: "BRANCH_RECEIPT",
      amount: allocation.amountAllocated,
      branch: allocation.branchName,
      reference: allocation.loanId,
      confirmedBy: user?.data?.cashierName,
      timestamp: serverTimestamp()
    });

    alert("Funds successfully marked as received");
  } catch (err) {
    console.error(err);
    alert("Failed to confirm receipt");
  }
};


  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-indigo-100 text-indigo-700">
              <MdStore size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Branch Receipts
              </h1>
              <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                {branchName} ({branchId})
              </p>
            </div>
          </div>
        </div>

        {/* RECEIPTS TABLE */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b flex items-center gap-2 font-black text-slate-700 uppercase text-sm">
            <MdHistory className="text-indigo-600" /> Incoming Funds
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 font-bold">
              Loading receipts...
            </div>
          ) : receipts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold">
              No funds sent to your branch yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="p-6">Date</th>
                    <th className="p-6">Source Loan</th>
                    <th className="p-6 text-right">Amount</th>
                    <th className="p-6 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="p-6 text-slate-500 font-medium">
                        {r.allocationDate}
                      </td>

                      <td className="p-6">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <MdAccountBalance className="text-slate-300" />
                          {r.loanId}
                        </div>
                      </td>

                      <td className="p-6 text-right font-black text-slate-900">
                        SLE {r.amountAllocated.toLocaleString()}
                      </td>

                      <td className="p-6 text-center space-y-2">
  {r.status === "sent" ? (
    <>
      <span className="block px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 animate-pulse">
        In Transit
      </span>

      <button
        onClick={() => handleMarkReceived(r)}
        className="mt-1 px-4 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 transition"
      >
        Mark as Received
      </button>
    </>
  ) : (
    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
      Received
    </span>
  )}
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
