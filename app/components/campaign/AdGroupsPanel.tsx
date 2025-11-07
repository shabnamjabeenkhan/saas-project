import { Palette } from "lucide-react";
import { AdGroupCard } from "./AdGroupCard";

interface AdGroup {
  name: string;
  keywords: string[];
  adCopy: {
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
  };
}

interface AdGroupsPanelProps {
  adGroups: AdGroup[];
  callExtensions: string[];
}

export function AdGroupsPanel({ adGroups, callExtensions }: AdGroupsPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <Palette className="w-5 h-5 text-primary" />
        Ad Creatives ({adGroups.length})
      </h2>

      {adGroups.map((adGroup, index) => (
        <AdGroupCard
          key={index}
          adGroup={adGroup}
          callExtensions={callExtensions}
          index={index}
        />
      ))}
    </div>
  );
}