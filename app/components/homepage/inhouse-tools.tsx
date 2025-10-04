import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { OptimizedImage } from "~/components/ui/optimized-image";
import { Badge } from "~/components/ui/badge";

type Tool = {
  title: string;
  href: string;
  description: string;
  comingSoon?: boolean;
  image?: string; // path under /public
};

const tools: Array<Tool> = [
  {
    title: "Founder OS",
    href: "https://founder.codeandcreed.tech",
    description:
      "All the tools you need to run an entire tech company — not just the product.",
    image: "/inhouse-tools/founder.png",
  },
  {
    title: "AI Dev Tools Recommender",
    href: "https://tools.codeandcreed.tech",
    description:
      "Personalized AI dev tool picks for your budget and style. Skip hype, ship faster.",
    image: "/inhouse-tools/tools.png",
  },
  {
    title: "Marketing Plan Generator",
    href: "https://marketing.codeandcreed.tech",
    description:
      "Conventional and unconventional marketing ideasa tailored to your specific idea.",
    image: "/inhouse-tools/marketing.png",
  },
  {
    title: "UI Components Library",
    href: "https://design.codeandcreed.tech",
    description:
      "Large database of pre‑built UI components. Design beautiful pages seriously fast.",
    image: "/inhouse-tools/design.png",
  },
  {
    title: "Lead Finder",
    href: "https://leads.codeandcreed.tech",
    description:
      "Find people actively looking for what you offer by scanning thousands of daily posts.",
    comingSoon: true,
    image: "/inhouse-tools/leads.png",
  },
];

export default function InhouseToolsSection() {
  return (
    <section id="inhouse-tools" className="pt-8 pb-16 md:pt-12 md:pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="text-3xl font-semibold lg:text-4xl">In‑house tools included</h2>
          <p className="text-muted-foreground">
            Five tools to help you design, build, market, and run an entire Tech company.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card
              key={tool.href}
              className={
                tool.comingSoon
                  ? "h-full border-dashed opacity-70 grayscale"
                  : "h-full"
              }
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{tool.title}</CardTitle>
                  {tool.comingSoon && (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {tool.image ? (
                  <OptimizedImage
                    src={tool.image}
                    alt={`${tool.title} preview`}
                    className="aspect-[16/9] w-full rounded-lg border bg-muted/50"
                  />
                ) : (
                  <div className="aspect-[16/9] w-full rounded-lg border bg-muted/50" />
                )}
              </CardContent>
              <CardFooter className="justify-end">
                {!tool.comingSoon && (
                  <Button asChild size="sm">
                    <a href={tool.href} target="_blank" rel="noreferrer noopener">
                      Visit
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


