import { useState } from "react";
import { useAction } from "convex/react";
import { Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

export function TestEmailForm() {
  const [name, setName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendTestEmail = useAction(api.sendEmails.sendTestEmailToAddress);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!toEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendTestEmail({
        toEmail,
        subject: name ? `Test Email from ${name}` : undefined,
        message: message || undefined,
      });

      if (result.success) {
        toast.success(`${result.message} Check your inbox (and spam folder).`);
        // Reset form
        setName("");
        setToEmail("");
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send test email:", error);

      // Handle specific Resend validation errors
      if (error instanceof Error && error.message.includes("You can only send testing emails")) {
        toast.error("When using sandbox domain, you can only send to your Resend account email address. Please enter the email you used to sign up for Resend, or verify a custom domain.");
      } else if (error instanceof Error && error.message.includes("domain not verified")) {
        toast.error("Domain not verified. Either use 'onboarding@resend.dev' as sender email, or verify your custom domain in Resend dashboard.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to send test email");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-screen-md px-2">
      <h2 className="mt-4 mb-5 text-center text-4xl font-bold text-white md:text-6xl">
        Contact Us
      </h2>
      <p className="text-gray-400 mb-6 text-center">
        Have a question or feedback? We'd love to hear from you.
      </p>
      <div className="bg-[#1a1a1a] border-gray-800 mx-auto mb-6 grid w-full items-start gap-12 rounded-lg border px-4 pt-10 pb-6 shadow-lg md:grid-cols-2 lg:px-12">
        <form className="space-y-8 text-white" onSubmit={handleSubmit}>
          <div className="space-y-4 text-lg">
            <label htmlFor="name" className="text-gray-300 font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="flex h-10 w-full rounded-md border border-gray-700 bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none hover:border-gray-600 focus:border-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4 text-lg">
            <label htmlFor="toEmail" className="text-gray-300 font-medium">
              To Email Address *
            </label>
            <input
              id="toEmail"
              placeholder="Enter your email"
              type="email"
              className="flex h-10 w-full rounded-md border border-gray-700 bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none hover:border-gray-600 focus:border-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              name="toEmail"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-4 text-lg">
            <label htmlFor="message" className="text-gray-300 font-medium">
              Message (Optional)
            </label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-gray-700 bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none hover:border-gray-600 focus:border-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              id="message"
              placeholder="Your message here..."
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button
            className="flex h-12 w-full items-center justify-center rounded-md bg-white py-2 text-center font-medium text-black transition-all duration-200 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                Send Test Email
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
        <div>
          <h3 className="mb-10 text-2xl font-semibold text-white">
            Connect with Us
          </h3>
          <div className="mb-12 flex gap-6 items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-[#0A0A0A] hover:border-gray-600 hover:bg-gray-900 transition-all duration-200">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-gray-300">
              <p className="text-sm text-gray-400">Email to us at</p>
              <p className="font-medium text-white">admin@tech-horizonai.io</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 