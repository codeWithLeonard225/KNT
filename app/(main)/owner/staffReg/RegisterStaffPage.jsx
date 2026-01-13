"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";

const ROLE_CONFIG = {
  cashier: {
    collection: "cashiers",
    idField: "cashierId",
    nameField: "cashierName",
  },
  approver: {
    collection: "approvers",
    idField: "approverId",
    nameField: "approverName",
  },
  auditor: {
    collection: "auditors",
    idField: "auditorId",
    nameField: "auditorName",
  },
};

export default function RegisterStaffPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState("cashier");
  const [staffId, setStaffId] = useState("");
  const [fullName, setFullName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [refresh, setRefresh] = useState(false);

  // Owner-only access
  useEffect(() => {
    if (!loading && (!user || user.role !== "owner")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Fetch staff list whenever role changes or refresh is triggered
  useEffect(() => {
    const fetchStaff = async () => {
      const config = ROLE_CONFIG[role];
      const snap = await getDocs(collection(db, config.collection));
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStaffList(list);
    };
    fetchStaff();
  }, [role, refresh]);

  // Fetch branches for dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      const snap = await getDocs(collection(db, "branches"));
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBranches(list);
    };
    fetchBranches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!staffId || !fullName || (role === "cashier" && !branchId)) {
      setError("All fields are required");
      return;
    }

    const config = ROLE_CONFIG[role];

    try {
      setSubmitting(true);

      const data = {
        [config.idField]: staffId.trim(),
        [config.nameField]: fullName.trim(),
        role,
        createdAt: serverTimestamp(),
        createdBy: user.data.ownerId || "OWNER",
      };

      if (role === "cashier") {
        const branch = branches.find((b) => b.id === branchId);
        data.branchId = branch?.branchId || "";
        data.branchName = branch?.branchName || "";
      }

      await addDoc(collection(db, config.collection), data);

      setSuccess(`${role.toUpperCase()} registered successfully`);
      setStaffId("");
      setFullName("");
      setBranchId("");
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
      setError("Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this staff?")) return;

    const config = ROLE_CONFIG[role];
    try {
      await deleteDoc(doc(db, config.collection, id));
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
      setError("Failed to delete staff");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border">
        <h1 className="text-2xl font-bold text-indigo-700 mb-2">Register Staff</h1>
        <p className="text-gray-500 mb-6">Register Cashiers, Approvers, and Auditors</p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="cashier">Cashier</option>
              <option value="approver">Approver</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{role.toUpperCase()} ID</label>
            <input
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder={`e.g. ${role.slice(0, 3).toUpperCase()}-001`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter full name"
            />
          </div>

          {role === "cashier" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchId} - {branch.branchName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

          <button
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Registering..." : "Register"}
          </button>
        </form>

        {/* STAFF TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-indigo-100">
              <tr>
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Full Name</th>
                {role === "cashier" && (
                  <>
                    <th className="py-2 px-4 text-left">Branch ID</th>
                    <th className="py-2 px-4 text-left">Branch Name</th>
                  </>
                )}
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={role === "cashier" ? 5 : 3} className="text-center py-4 text-gray-500">
                    No staff registered
                  </td>
                </tr>
              )}
              {staffList.map((staff) => (
                <tr key={staff.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{staff[ROLE_CONFIG[role].idField]}</td>
                  <td className="py-2 px-4">{staff[ROLE_CONFIG[role].nameField]}</td>
                  {role === "cashier" && (
                    <>
                      <td className="py-2 px-4">{staff.branchId}</td>
                      <td className="py-2 px-4">{staff.branchName}</td>
                    </>
                  )}
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="px-3 py-1 text-sm bg-yellow-400 text-white rounded hover:bg-yellow-500"
                      onClick={() => alert("Edit functionality to be implemented")}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={() => handleDelete(staff.id)}
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
