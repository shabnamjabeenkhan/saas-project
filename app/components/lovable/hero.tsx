import { GetStartedButton } from "~/components/ui/get-started-button";
import { Link } from "react-router";

interface LovableHeroProps {
  isSignedIn?: boolean;
}

export const LovableHero = ({ isSignedIn = false }: LovableHeroProps) => {
  return (
    <main className="overflow-hidden">
      <section>
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-24 lg:pb-28 lg:pt-28 xl:pb-36 xl:pt-44">
          {/* Hero Image - Tradesman Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-3/4 opacity-35 sm:w-2/3 sm:opacity-40 lg:w-1/2 lg:opacity-45">
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"
                alt="Professional tradesman with tools"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/25 to-background sm:via-background/15"></div>
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-3xl font-medium leading-tight sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight">
              You've got the skills,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                we'll bring the leads
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:mt-6 sm:text-lg lg:text-xl">
              Stop wasting £4,000/month. Get high-converting Google Ads for plumbers and electricians — no marketing experience needed, leads delivered year-round.
            </p>

            <div className="mt-8 sm:mt-10 lg:mt-12">
              <Link to={isSignedIn ? "/dashboard" : "/sign-up"}>
                <GetStartedButton />
              </Link>

              <p className="mt-3 text-xs text-muted-foreground sm:mt-4 sm:text-sm">
                From £69/month · No contracts · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};