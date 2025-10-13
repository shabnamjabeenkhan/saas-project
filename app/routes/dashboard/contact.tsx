import { TestEmailForm } from "~/components/dashboard/test-email-form";

export default function Contact() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#0A0A0A] text-white min-h-screen">
      <div className="max-w-4xl mx-auto w-full flex-1 flex items-center justify-center">
        <TestEmailForm />
      </div>
    </div>
  );
}