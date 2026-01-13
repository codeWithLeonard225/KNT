"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function BranchManagement() {
  const [branchId, setBranchId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [location, setLocation] = useState("");
  const [branchList, setBranchList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      const snap = await getDocs(collection(db, "branches"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBranchList(list);
    };
    fetchBranches();
  }, [refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!branchId || !branchName || !location) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        // Update branch
        await updateDoc(doc(db, "branches", editingId), {
          branchId: branchId.trim(),
          branchName: branchName.trim(),
          location: location.trim(),
          updatedAt: serverTimestamp()
        });
        setSuccess("Branch updated successfully");
        setEditingId(null);
      } else {
        // Add new branch
        await addDoc(collection(db, "branches"), {
          branchId: branchId.trim(),
          branchName: branchName.trim(),
          location: location.trim(),
          createdAt: serverTimestamp()
        });
        setSuccess("Branch added successfully");
      }

      setBranchId("");
      setBranchName("");
      setLocation("");
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
      setError("Failed to save branch");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setBranchId(branch.branchId);
    setBranchName(branch.branchName);
    setLocation(branch.location);
    setEditingId(branch.id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await deleteDoc(doc(db, "branches", id));
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
      setError("Failed to delete branch");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border">
        <h1 className="text-2xl font-bold text-indigo-700 mb-2">Branch Management</h1>
        <p className="text-gray-500 mb-6">Add, edit or remove branches</p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Branch ID</label>
            <input
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter branch ID"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Branch Name</label>
            <input
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter branch name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter location"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update Branch" : "Add Branch"}
          </button>
        </form>

        {/* BRANCH TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-indigo-100">
              <tr>
                <th className="py-2 px-4 text-left">Branch ID</th>
                <th className="py-2 px-4 text-left">Branch Name</th>
                <th className="py-2 px-4 text-left">Location</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branchList.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No branches added
                  </td>
                </tr>
              )}
              {branchList.map((branch) => (
                <tr key={branch.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{branch.branchId}</td>
                  <td className="py-2 px-4">{branch.branchName}</td>
                  <td className="py-2 px-4">{branch.location}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="px-3 py-1 text-sm bg-yellow-400 text-white rounded hover:bg-yellow-500"
                      onClick={() => handleEdit(branch)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={() => handleDelete(branch.id)}
                    >
                      Delete
                    </button>
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
