export const DashboardPreview = () => {
  return (
    <section className="overflow-hidden py-16 sm:py-20 lg:py-24">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-balance text-2xl font-medium sm:text-3xl lg:text-4xl">
            See what you could achieve
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground sm:text-lg">
            Your dashboard showing 3x more leads every month with TradeBoost AI
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20">
          <div className="bg-radial from-primary/50 dark:from-primary/25 to-transparent to-55% text-left">
            <div className="bg-background border-border/50 absolute inset-0 mx-auto w-64 -translate-x-2 -translate-y-8 rounded-[2rem] border p-2 [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:w-80 sm:-translate-x-3 sm:-translate-y-12 lg:-translate-x-6">
              <div className="relative h-64 overflow-hidden rounded-[1.5rem] border p-2 pb-12 before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_6px)] before:opacity-50 sm:h-80 lg:h-96"></div>
            </div>
            <div className="bg-muted dark:bg-background/50 border-border/50 mx-auto w-64 translate-x-3 rounded-[2rem] border p-2 backdrop-blur-3xl [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:w-80 sm:translate-x-4 lg:translate-x-8">
              <div className="bg-background space-y-2 overflow-hidden rounded-[1.5rem] border p-2 shadow-xl dark:bg-white/5 dark:shadow-black dark:backdrop-blur-3xl">
                <div className="relative space-y-2 rounded-[1rem] bg-white/5 p-3 sm:space-y-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <svg
                      className="size-4 sm:size-5"
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
                    <div className="text-xs font-medium sm:text-sm">TradeBoost AI</div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="text-foreground border-b border-white/10 pb-2 text-xs font-medium sm:pb-3 sm:text-sm">Generate 3x more leads this month than last month.</div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="space-y-1">
                        <div className="space-x-1">
                          <span className="text-foreground align-baseline text-lg font-medium sm:text-xl">24</span>
                          <span className="text-muted-foreground text-xs">Leads this month</span>
                        </div>
                        <div className="flex h-4 items-center rounded bg-gradient-to-l from-emerald-400 to-blue-600 px-2 text-xs text-white sm:h-5">2024</div>
                      </div>
                      <div className="space-y-1">
                        <div className="space-x-1">
                          <span className="text-foreground align-baseline text-lg font-medium sm:text-xl">8</span>
                          <span className="text-muted-foreground text-xs">Leads last month</span>
                        </div>
                        <div className="text-foreground bg-muted flex h-4 w-1/3 items-center rounded px-2 text-xs dark:bg-white/20 sm:h-5">2023</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted rounded-[1rem] p-3 pb-12 dark:bg-white/5 sm:p-4 sm:pb-16"></div>
              </div>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mix-blend-overlay [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:opacity-5"></div>
          </div>
        </div>
      </div>
    </section>
  );
};