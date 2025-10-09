import { Button } from "~/components/ui/button";
import { Link } from "react-router";

export const LovableHero = () => {
  return (
    <main className="overflow-hidden">
      <section>
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-32 lg:pt-48">
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-medium md:text-6xl">
              Stop Wasting £4,000/Month — Let{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                AI Get You More Customers
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              AI builds and manages your Google Ads automatically — more leads, less spend, zero marketing experience needed.
            </p>

            <div className="mt-12">
              <Button
                asChild
                size="lg"
                className="mx-auto">
                <Link to="/sign-up">
                  Get Started
                </Link>
              </Button>

              <p className="mt-4 text-sm text-muted-foreground">
                From £69/month · No contracts · Cancel anytime
              </p>
            </div>

            <div className="relative mx-auto mt-32 max-w-2xl">
              <div className="bg-radial from-primary/50 dark:from-primary/25 to-transparent to-55% text-left">
                <div className="bg-background border-border/50 absolute inset-0 mx-auto w-80 -translate-x-3 -translate-y-12 rounded-[2rem] border p-2 [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:-translate-x-6">
                  <div className="relative h-96 overflow-hidden rounded-[1.5rem] border p-2 pb-12 before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_6px)] before:opacity-50"></div>
                </div>
                <div className="bg-muted dark:bg-background/50 border-border/50 mx-auto w-80 translate-x-4 rounded-[2rem] border p-2 backdrop-blur-3xl [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:translate-x-8">
                  <div className="bg-background space-y-2 overflow-hidden rounded-[1.5rem] border p-2 shadow-xl dark:bg-white/5 dark:shadow-black dark:backdrop-blur-3xl">
                    <div className="relative space-y-3 rounded-[1rem] bg-white/5 p-4">
                      <div className="flex items-center gap-1.5 text-orange-400">
                        <svg
                          className="size-5"
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          viewBox="0 0 32 32">
                          <g fill="none">
                            <path
                              fill="#ff6723"
                              d="M26 19.34c0 6.1-5.05 11.005-11.15 10.641c-6.269-.374-10.56-6.403-9.752-12.705c.489-3.833 2.286-7.12 4.242-9.67c.34-.445.689 3.136 1.038 2.742c.35-.405 3.594-6.019 4.722-7.991a.694.694 0 0 1 1.028-.213C18.394 3.854 26 10.277 26 19.34"></path>
                            <path
                              fill="#ffb02e"
                              d="M23 21.851c0 4.042-3.519 7.291-7.799 7.144c-4.62-.156-7.788-4.384-7.11-8.739C9.07 14.012 15.48 10 15.48 10S23 14.707 23 21.851"></path>
                          </g>
                        </svg>
                        <div className="text-sm font-medium">TradeBoost AI</div>
                      </div>
                      <div className="space-y-3">
                        <div className="text-foreground border-b border-white/10 pb-3 text-sm font-medium">Generate 3x more leads this month than last month.</div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="space-x-1">
                              <span className="text-foreground align-baseline text-xl font-medium">24</span>
                              <span className="text-muted-foreground text-xs">Leads this month</span>
                            </div>
                            <div className="flex h-5 items-center rounded bg-gradient-to-l from-emerald-400 to-blue-600 px-2 text-xs text-white">2024</div>
                          </div>
                          <div className="space-y-1">
                            <div className="space-x-1">
                              <span className="text-foreground align-baseline text-xl font-medium">8</span>
                              <span className="text-muted-foreground text-xs">Leads last month</span>
                            </div>
                            <div className="text-foreground bg-muted flex h-5 w-1/3 items-center rounded px-2 text-xs dark:bg-white/20">2023</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted rounded-[1rem] p-4 pb-16 dark:bg-white/5"></div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mix-blend-overlay [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:opacity-5"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};