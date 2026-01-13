
// app/(main)page.jsx
"use client";

import { useRouter } from "next/navigation";

export default function MainPage() {
  const router = useRouter();

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          KNT Limited
        </h1>

        <p className="mt-2 text-gray-600 font-medium">
          Fx Bureau Management System
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Secure management of money exchange, mobile money
          transactions, and daily cash operations.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login to System
        </button>
      </div>
    </div>
  );
}
