"use client";

import React from "react";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Check, Phone } from "lucide-react";

export const TradeBoostPricingCard = () => {
  const features = [
    { label: "AI-Generated Google Ads Campaigns", info: "Complete campaigns with 4 targeted ad groups and 30+ keywords." },
    { label: "4 Targeted Ads Per Campaign", info: "Emergency, installation, maintenance, and specialized service ads." },
    { label: "UK Trade Compliance Built-in", info: "Gas Safe, Part P, and all UK trade regulations automatically included." },
    { label: "Seasonal Intelligence", info: "Auto-boost winter heating ads, summer AC campaigns automatically." },
    { label: "Local Keyword Targeting", info: "Captures 'near me' searches and emergency keywords for your area." },
    { label: "Real-time Campaign Analytics", info: "Track leads, ROI, and performance with detailed reporting." },
    { label: "Campaign Regeneration", info: "Refresh your campaigns with new variations to avoid ad fatigue." },
    { label: "Google Ads Integration Ready", info: "One-click export to your Google Ads account." },
  ];

  return (
    <TooltipProvider>
      <Card className="w-[464px] rounded-[38px] border border-border bg-card text-card-foreground p-[23px] flex flex-col gap-6 shadow-sm">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold leading-[24px]">
            TradeBoost AI Pro
          </h2>
          <p className="text-base text-muted-foreground leading-[19px]">
            AI-powered Google Ads for trades
          </p>
        </div>

        {/* Features */}
        <CardContent className="rounded-[33px] border border-border bg-background px-[27px] py-[30px] flex flex-col gap-[25px]">
          {features.map((f, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                  <Check className="text-primary w-5 h-5 flex-shrink-0" />
                  <span className="text-base leading-[19px]">{f.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[260px] text-sm bg-popover text-popover-foreground border border-border rounded-xl px-3 py-2 shadow-md"
              >
                {f.info}
              </TooltipContent>
            </Tooltip>
          ))}
        </CardContent>

        {/* Footer */}
        <div className="flex items-center justify-between px-[6px]">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Starting from</span>
            <span className="text-[34px] font-medium leading-[41px]">£29/mo</span>
          </div>

          {/* Simple gradient button */}
          <Button
            className={cn(
              "flex items-center justify-center gap-3 w-[220px] h-[64px] rounded-[39px] text-[20px] font-medium text-white",
              "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500",
              "border-[3px] border-blue-600",
              "shadow-sm hover:opacity-90 transition-all duration-150"
            )}
          >
            <Phone className="w-[20px] h-[20px]" />
            <span>Get Started</span>
          </Button>
        </div>
      </Card>
    </TooltipProvider>
  );
};