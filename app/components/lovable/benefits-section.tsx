import { Card, CardContent } from "~/components/ui/card";
import { TrendingUp, Clock, BarChart3, Snowflake, Users, Phone } from "lucide-react";

export const LovableBenefitsSection = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Predictable Lead Flow",
      description: "Replace unreliable word-of-mouth with steady, qualified leads every month"
    },
    {
      icon: Clock,
      title: "Save Massive Time",
      description: "5-minute setup vs weeks learning Google Ads. Focus on actual jobs, not marketing"
    },
    {
      icon: Phone,
      title: "Track Real Results",
      description: "See exactly how many calls, jobs, and revenue your ads generate. Full ROI visibility"
    },
    {
      icon: Snowflake,
      title: "Seasonal Automation",
      description: "AI automatically ramps up boiler campaigns in winter, AC in summer. No manual work"
    },
    {
      icon: BarChart3,
      title: "Local Search Dominance",
      description: "Appear in Google when people search 'emergency plumber near me' in your area"
    },
    {
      icon: Users,
      title: "Cross-Sell Services",
      description: "Multi-trade businesses can promote both plumbing AND electrical to the same customers"
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            What You Get
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional marketing power without the professional price tag
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-all border-border group">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent/80 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <benefit.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};