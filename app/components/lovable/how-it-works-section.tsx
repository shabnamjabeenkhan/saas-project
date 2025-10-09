import { CategoryList, type Category } from "~/components/ui/category-list";
import { Wrench, MessageSquare, MapPin, Target, Zap, LayoutGrid } from "lucide-react";

export const LovableHowItWorksSection = () => {
  const steps: Category[] = [
    {
      id: 1,
      title: "Choose Your Trade",
      subtitle: "Select plumbing, electrical, or both. Takes 10 seconds.",
      icon: <Wrench className="w-8 h-8" />,
      featured: true
    },
    {
      id: 2,
      title: "Answer 5 Questions",
      subtitle: "Business name, phone, services offered, and your goals. That's it.",
      icon: <MessageSquare className="w-8 h-8" />
    },
    {
      id: 3,
      title: "Set Your Area",
      subtitle: "City + radius (10/25/50 miles). We'll target the right customers.",
      icon: <MapPin className="w-8 h-8" />
    },
    {
      id: 4,
      title: "AI Generates Campaigns",
      subtitle: "Industry-specific ads like 'burst pipe fixed in 60 minutes' automatically created.",
      icon: <Zap className="w-8 h-8" />
    },
    {
      id: 5,
      title: "Connect & Launch",
      subtitle: "Link your Google Ads account (we'll help), set your budget, and go live.",
      icon: <Target className="w-8 h-8" />
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <CategoryList
          title="From Zero to Leads"
          subtitle="in 5 Minutes"
          categories={steps}
          headerIcon={<LayoutGrid className="w-8 h-8" />}
        />

        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-foreground">
            Total setup time: <span className="text-primary font-bold">~5 minutes</span>
          </p>
          <p className="text-muted-foreground mt-2">
            vs weeks learning Google Ads yourself or paying £4,000/month agencies
          </p>
        </div>
      </div>
    </section>
  );
};