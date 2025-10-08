import { Card, CardContent } from "~/components/ui/card";
import { Wrench, MessageSquare, MapPin, Target, Zap } from "lucide-react";

export const LovableHowItWorksSection = () => {
  const steps = [
    {
      icon: Wrench,
      title: "Choose Your Trade",
      description: "Select plumbing, electrical, or both. Takes 10 seconds.",
      step: "1"
    },
    {
      icon: MessageSquare,
      title: "Answer 5 Questions",
      description: "Business name, phone, services offered, and your goals. That's it.",
      step: "2"
    },
    {
      icon: MapPin,
      title: "Set Your Area",
      description: "City + radius (10/25/50 miles). We'll target the right customers.",
      step: "3"
    },
    {
      icon: Zap,
      title: "AI Generates Campaigns",
      description: "Industry-specific ads like 'burst pipe fixed in 60 minutes' automatically created.",
      step: "4"
    },
    {
      icon: Target,
      title: "Connect & Launch",
      description: "Link your Google Ads account (we'll help), set your budget, and go live.",
      step: "5"
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            From Zero to Leads in 5 Minutes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No marketing degree required. No weeks of learning. Just simple questions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-all border-border group">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <step.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-accent to-accent/80 rounded-full flex items-center justify-center text-xs font-bold text-accent-foreground">
                      {step.step}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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