"use client"

import Header from "@/components/header"
import ProfessorInterface from "@/components/professor-interface"

export default function ProfPage() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex flex-col">
        <Header variant="professor" />
        <ProfessorInterface />
      </div>
    </div>
  )
}
