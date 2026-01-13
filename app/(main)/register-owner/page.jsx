"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterOwnerPage() {
  const router = useRouter();

  const [ownerId, setOwnerId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerTel, setOwnerTel] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!ownerId || !ownerName || !ownerTel || !ownerEmail || !ownerAddress) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await setDoc(doc(db, "owners", ownerId), {
        ownerId,
        ownerName,
        ownerTel,
        ownerEmail,
        ownerAddress,
        ownerRole: "owner",
        createdAt: serverTimestamp(),
      });

      alert("Owner registered successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Firebase Error:", error);
      alert("Error saving owner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h1 className="text-xl font-bold text-center">
          Owner Registration
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          KNT Limited – System Setup
        </p>

        {/* Owner ID */}
        <label className="block text-sm mb-1">Owner ID</label>
        <input
          className="w-full border p-2 rounded mb-3"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          placeholder="OWN-001"
        />

        {/* Owner Name */}
        <label className="block text-sm mb-1">Owner Name</label>
        <input
          className="w-full border p-2 rounded mb-3"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="Full name"
        />

        {/* Telephone */}
        <label className="block text-sm mb-1">Telephone</label>
        <input
          className="w-full border p-2 rounded mb-3"
          value={ownerTel}
          onChange={(e) => setOwnerTel(e.target.value)}
          placeholder="+232..."
        />

        {/* Email */}
        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          className="w-full border p-2 rounded mb-3"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="owner@knt.com"
        />

        {/* Address */}
        <label className="block text-sm mb-1">Address</label>
        <textarea
          className="w-full border p-2 rounded mb-3"
          value={ownerAddress}
          onChange={(e) => setOwnerAddress(e.target.value)}
          placeholder="Business address"
        />

        {/* Role */}
        <label className="block text-sm mb-1">Role</label>
        <input
          className="w-full border p-2 rounded bg-gray-100 mb-6"
          value="Owner"
          disabled
        />

        {/* Button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-amber-900  py-3 rounded font-semibold hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Register Owner"}
          
        </button>
      </div>
    </div>
  );
}
