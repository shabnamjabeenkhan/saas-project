import { FaqSection } from "~/components/ui/faq-section";

const FAQ_ITEMS = [
  {
    question: "How long does it take to get a SaaS MVP live?",
    answer:
      "With Kaizen's TypeScript-first stack and pre-built auth, payments and dashboard, most people can ship a fully-functional MVP within a weekend.",
  },
  {
    question: "Is everything type-safe end-to-end?",
    answer:
      "Yes — from React components to Convex backend functions, every value is strongly typed and inferred across the network boundary.",
  },
  {
    question: "Do I need separate services for my backend?",
    answer:
      "No. Convex handles data, storage, scheduled jobs and serverless functions so you don't have to stitch together databases, queues or cron servers.",
  },
  {
    question: "Can I use AI to generate new features quickly?",
    answer:
      "Absolutely. Because business logic lives in straightforward TypeScript files, LLMs can read the codebase and scaffold new queries, mutations or UI components with high accuracy.",
  },
  {
    question: "How do I deploy to production?",
    answer:
      "Deploy to Railway with automatic deployments on every push, or self-host on your own infrastructure (Docker file included). Both paths are baked in.",
  },
];

export default function FAQ() {
  return (
    <FaqSection
      title="Frequently Asked Questions"
      items={FAQ_ITEMS}
    />
  );
} 