import { AlertCircle, TrendingDown, HelpCircle } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export const LovableProblemSection = () => {
  const problems = [
    {
      icon: TrendingDown,
      title: "Unreliable Income",
      description: "Busy winters, slow summers. Relying on word-of-mouth means unpredictable cashflow and stress during quiet months.",
      stat: "70% of trades report seasonal income gaps"
    },
    {
      icon: AlertCircle,
      title: "Marketing Waste",
      description: "£800 spent on Facebook ads for just 2 leads? Traditional advertising drains your budget with minimal returns.",
      stat: "£4,000/month for agencies you can't afford"
    },
    {
      icon: HelpCircle,
      title: "No Marketing Skills",
      description: "You're a skilled tradesperson, not a Google Ads expert. Learning takes weeks you don't have.",
      stat: "Weeks of learning vs 5 minutes with AI"
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Sound Familiar?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You're great at your trade, but marketing shouldn't be this hard
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow border-border">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <problem.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
                <p className="text-sm font-medium text-primary">{problem.stat}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};