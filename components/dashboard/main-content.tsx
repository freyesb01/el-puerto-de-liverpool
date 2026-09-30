"use client";

export type Section = "overview" | "jefes" | "promotores" | "periodos" | "colaboradores";

import { VistaGeneral } from "./vista-general";
import { JefesContent } from "./content/jefes-content";
import { PromotoresContent } from "./content/promotores-content";
import { PeriodosContent } from "./content/periodos-content";
import { ColaboradoresContent } from "./content/colaboradores-content";

interface MainContentProps {
  activeSection: Section;
}

export function MainContent({ activeSection }: MainContentProps) {
  const renderContent = () => {
    switch (activeSection) {
      case "overview": return <VistaGeneral />;
      case "jefes": return <JefesContent />;
      case "promotores": return <PromotoresContent />;
      case "periodos": return <PeriodosContent />;
      case "colaboradores": return <ColaboradoresContent />;
      default: return <VistaGeneral />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div key={activeSection} className="">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
