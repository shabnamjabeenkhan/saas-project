import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Eye,
  Copy,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

interface AdGroup {
  name: string;
  keywords: string[];
  adCopy: {
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
  };
}

interface AdGroupCardProps {
  adGroup: AdGroup;
  callExtensions: string[];
  index: number;
}

export const AdGroupCard = memo(function AdGroupCard({
  adGroup,
  callExtensions,
  index
}: AdGroupCardProps) {
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">{adGroup.name}</CardTitle>
        <CardDescription>
          {adGroup.keywords.length} keywords targeting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Keywords */}
        <div>
          <h4 className="font-medium text-white mb-2">Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {adGroup.keywords.map((keyword, idx) => (
              <Badge key={idx} variant="secondary" className="bg-gray-800 text-gray-300">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 my-4"></div>

        {/* Ad Preview */}
        <div>
          <h4 className="font-medium text-white mb-2 flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            Ad Preview
          </h4>
          <div className="bg-[#0A0A0A] border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="space-y-2">
              {/* Headlines */}
              {adGroup.adCopy.headlines.map((headline, idx) => (
                <div key={idx} className="text-blue-400 text-sm font-medium">
                  {headline}
                </div>
              ))}

              {/* Descriptions */}
              {(() => {
                // 🔧 FIX: Deduplicate descriptions client-side to prevent repeated display
                const seenDescriptions = new Set<string>();
                const uniqueDescriptions = adGroup.adCopy.descriptions.filter((description: string) => {
                  const normalized = description.toLowerCase().trim();
                  if (seenDescriptions.has(normalized)) {
                    return false; // Skip duplicate
                  }
                  seenDescriptions.add(normalized);
                  return true;
                });
                
                return uniqueDescriptions.map((description, idx) => (
                  <div key={idx} className="text-gray-300 text-sm">
                    {description}
                  </div>
                ));
              })()}

              {/* URL */}
              <div className="text-green-400 text-sm">
                {adGroup.adCopy.finalUrl}
              </div>

              {/* Call Extension */}
              {callExtensions.length > 0 && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                  <Phone className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">
                    {callExtensions[0]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyToClipboard(
                  `${adGroup.adCopy.headlines.join(' | ')}\n${adGroup.adCopy.descriptions.join(' ')}\n${adGroup.adCopy.finalUrl}`
                )}
                className="text-gray-400 hover:text-white"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});