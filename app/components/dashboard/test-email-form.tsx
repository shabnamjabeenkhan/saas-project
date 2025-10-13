import { useState } from "react";
import { useAction } from "convex/react";
import { Mail, Send, Loader2 } from "lucide-react";
import { Link } from "react-router";
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
      <h2 className="mt-4 mb-5 bg-gradient-to-br from-gray-300 via-blue-300 to-gray-700 bg-clip-text text-center text-4xl font-bold text-transparent md:text-6xl">
        Test Email Functionality
      </h2>
      <p className="text-muted-foreground mb-6 text-center">
        Send a test email to verify your email configuration is working correctly.
      </p>
      <div
        className="bg-opacity-10 mx-auto mb-6 grid w-full items-start gap-12 rounded-lg border bg-white px-4 pt-10 pb-6 shadow shadow-slate-800 md:grid-cols-2 lg:px-12"
        style={{
          backgroundImage:
            'radial-gradient(164.75% 100% at 50% 0,#272f3c 0,#0b1224 48.73%)',
        }}
      >
        <form className="space-y-8 text-slate-300" onSubmit={handleSubmit}>
          <div className="space-y-4 text-lg">
            <label htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="bg-background flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm shadow-inner shadow-slate-800 outline-none hover:border-slate-600 hover:transition-all hover:outline-none focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4 text-lg">
            <label htmlFor="toEmail">
              To Email Address *
            </label>
            <input
              id="toEmail"
              placeholder="Enter your email"
              type="email"
              className="hover:transition-al bg-background placeholder:text-muted-foreground flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm shadow-inner shadow-slate-800 outline-none file:text-sm file:font-medium hover:border-slate-400 hover:outline-none focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              name="toEmail"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-4 text-lg">
            <label htmlFor="message" className="text-lg">
              Message (Optional)
            </label>
            <textarea
              className="bg-background ring-offset-background placeholder:text-muted-foreground mb-5 flex min-h-[100px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white shadow-inner shadow-slate-800 outline-none hover:border-slate-400 hover:transition-all hover:outline-none focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              id="message"
              placeholder=""
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-slate-800 to-slate-700 py-2 text-center font-medium text-white shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] transition-all duration-300 ease-in-out hover:from-slate-700 hover:to-slate-800 hover:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mx-2 inline h-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                Send Test Email
                <Send className="mx-2 inline h-4" />
              </>
            )}
          </button>
        </form>
        <div>
          <h3 className="mb-10 text-2xl font-semibold text-slate-300">
            Connect with Us
          </h3>
          <div className="mb-12 flex gap-8">
            <Link
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 shadow-inner shadow-gray-800 hover:shadow-md hover:shadow-slate-500 hover:transition hover:duration-300 hover:ease-in-out"
              to="#"
            >
              <Mail className="h-5 w-5 text-white" />
            </Link>
            <div className="text-md text-slate-300">
              <p>Email to us at </p>
              <p>support@tradeboost-ai.com</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 