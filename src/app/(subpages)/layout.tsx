import { Masthead } from "@/components/navigation/Masthead";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";

export default function SubpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Masthead />
      <div className="page-container max-w-[1280px] mx-auto px-4 pt-[70px]">
        <Sidebar />
        <div className="lg:ml-[calc(100%/12*2)] lg:w-[calc(100%/12*10)] lg:pl-4 pb-36">
          {children}
          <Footer />
        </div>
      </div>
    </>
  );
}
