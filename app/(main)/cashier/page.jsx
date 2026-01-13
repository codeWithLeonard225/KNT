"use client";

import React, { useState, useEffect } from "react";
import {
  MdDashboard,
  MdAttachMoney,
  MdHistory,
} from "react-icons/md";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import CashierPage from "./Cashier/CashierPage"; // create this next if not yet
import Cincout from "./Cincout/Cincout"; // create this next if not yet
import MobileMoneyPage from "./MobileMoneyPage/MobileMoneyPage"; // create this next if not yet
import BranchReceipts from "./BranchReceipts/BranchReceipts"; // create this next if not yet

// --- Sidebar navigation items ---
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: <MdDashboard /> },
  { key: "records", label: "New Record", icon: <MdAttachMoney /> },
  { key: "Cincout", label: "Cashin CashOut", icon: <MdAttachMoney /> },
  { key: "MobileMoneyPage", label: "Mobile Money Page", icon: <MdAttachMoney /> },
  { key: "BranchReceipts", label: "BranchReceipts", icon: <MdHistory /> },
  { key: "history", label: "Today Records", icon: <MdHistory /> },
];

// --- Button component ---
const Button = ({ variant = "default", onClick, className = "", children }) => {
  let baseStyles =
    "inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-950 disabled:pointer-events-none disabled:opacity-50";
  let variantStyles =
    variant === "default"
      ? "bg-indigo-600 text-white shadow hover:bg-indigo-700"
      : "hover:bg-indigo-100 hover:text-indigo-700 text-gray-700";

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className} h-9 px-4 py-2`}
    >
      {children}
    </button>
  );
};

// --- Main Cashier Dashboard ---
export default function CashierDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Auth check ---
  useEffect(() => {
    if (!loading && (!user || user.role !== "cashier")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl font-semibold text-indigo-700">
          {loading ? "Verifying Session..." : "Unauthorized Access"}
        </p>
      </div>
    );
  }

  const cashierName = user.data.cashierName;
  const cashierId = user.data.cashierId;
  const branchName = user.data.branchName;
  const branchId = user.data.branchId;

  const initials = cashierName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // --- Render main content ---
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-700">
              Welcome, {cashierName}
            </h2>
            <p className="mt-2 text-gray-600">
              Cashier ID: {cashierId}
            </p>
            <p className="text-gray-600">
              Branch: {branchName} ({branchId})
            </p>
            <p className="mt-4 text-gray-500">
              Use the menu to record daily transactions.
            </p>
          </div>
        );

      case "records":
        return <CashierPage/>;
      case "Cincout":
        return <Cincout/>;
      case "MobileMoneyPage":
        return <MobileMoneyPage/>;
      case "BranchReceipts":
        return <BranchReceipts/>;

      // case "history":
      //   return <CashierRecords mode="view" />;

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white p-4 border-r shadow-lg transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        {/* Cashier info */}
        <div className="flex items-center gap-3 mb-6 p-2 bg-indigo-100 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-indigo-800">
              {cashierName}
            </p>
            <p className="text-sm text-gray-600">
              {branchName}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.key}
              variant={activeTab === item.key ? "default" : "ghost"}
              onClick={() => setActiveTab(item.key)}
              className="w-full flex items-center gap-2"
            >
              {item.icon} {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
        <div className="flex items-center justify-between mb-6 md:hidden">
          <Button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Close Menu" : "Open Menu"}
          </Button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
