"use client";

import Header from "@/components/header";
import ProfessorInterface from "@/components/professor/professor-interface";
import ProtectedRoute from "@/components/protected-route";

export default function ProfPage() {
  return (
    <ProtectedRoute requiredRole="professor">
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex flex-col">
          <Header variant="professor" />
          <ProfessorInterface />
        </div>
      </div>
    </ProtectedRoute>
  );
}
