import BootSequence from "@/components/BootSequence";
import MicroMotion from "@/components/MicroMotion";
import HomeHeader from "@/components/home/HomeHeader";
import HeroSection from "@/components/home/HeroSection";
import ProblemSection from "@/components/home/ProblemSection";
import MaterialsSection from "@/components/home/MaterialsSection";
import ProductSection from "@/components/home/ProductSection";
import InterfacesSection from "@/components/home/InterfacesSection";
import WorkflowSection from "@/components/home/WorkflowSection";
import FaqSection from "@/components/home/FaqSection";
import ApproachSection from "@/components/home/ApproachSection";
import HomeFooter from "@/components/home/HomeFooter";

export default function Home() {
  return (
    <>
      <BootSequence />
      <a className="skip-link" href="#idea">
        Skip to content
      </a>
      <HomeHeader />
      <main className="landing-page">
        <HeroSection />
        <ProblemSection />
        <MaterialsSection />
        <ProductSection />
        <InterfacesSection />
        <WorkflowSection />
        <FaqSection />
        <ApproachSection />
      </main>
      <HomeFooter />
      <MicroMotion />
    </>
  );
}
