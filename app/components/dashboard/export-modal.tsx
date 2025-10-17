import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Download, FileText, Database, FileSpreadsheet, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { PerformanceMetrics, AdvancedROIMetrics, JobValueMetrics } from "~/lib/mockPerformanceData";
import type { ConversionData } from "~/lib/googleAdsSync";
import { exportData, type ExportOptions, type ExportData } from "~/lib/exportUtils";

interface ExportModalProps {
  performanceData: PerformanceMetrics[];
  roiMetrics: AdvancedROIMetrics;
  jobMetrics: JobValueMetrics;
  conversionData: ConversionData[];
  dateRange: string;
}

export function ExportModal({
  performanceData,
  roiMetrics,
  jobMetrics,
  conversionData,
  dateRange
}: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [includeROI, setIncludeROI] = useState(true);
  const [includeConversions, setIncludeConversions] = useState(true);
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const exportOptions: ExportOptions = {
        format,
        dateRange,
        includeROI,
        includeConversions,
        includeAttribution
      };

      const exportDataPayload: ExportData = {
        performanceMetrics: performanceData,
        roiMetrics: includeROI ? roiMetrics : undefined,
        jobMetrics: includeROI ? jobMetrics : undefined,
        conversionData: includeConversions ? conversionData : undefined,
        metadata: {
          exportDate: new Date(),
          dateRange,
          businessName: "TradeBoost AI Demo",
          accountId: "123-456-7890"
        }
      };

      // Simulate export processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      exportData(exportDataPayload, exportOptions);

      toast.success(`Export completed! File downloaded as ${format.toUpperCase()}`);
      setIsOpen(false);
    } catch (error) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'csv': return <FileSpreadsheet className="w-4 h-4" />;
      case 'json': return <Database className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (formatType: string) => {
    switch (formatType) {
      case 'csv': return 'Spreadsheet format compatible with Excel, Google Sheets';
      case 'json': return 'Structured data format for API integration and analysis';
      case 'pdf': return 'Professional report format for presentations and sharing';
      default: return '';
    }
  };

  const estimateFileSize = () => {
    let baseSize = performanceData.length * 0.1; // KB
    if (includeROI) baseSize += 5;
    if (includeConversions) baseSize += conversionData.length * 0.2;
    if (includeAttribution) baseSize += 2;

    if (format === 'pdf') baseSize *= 3;
    if (format === 'json') baseSize *= 1.5;

    return baseSize < 1 ? '<1KB' : `~${Math.round(baseSize)}KB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-white border-gray-700 hover:bg-gray-800">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Performance Data
          </DialogTitle>
          <DialogDescription>
            Export your Google Ads performance data and analytics in your preferred format.
            Data includes {performanceData.length} days of metrics from {dateRange}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-white mb-3 block">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as any)}>
              <div className="space-y-3">
                {[
                  { value: 'csv', label: 'CSV (Spreadsheet)', icon: 'csv' },
                  { value: 'json', label: 'JSON (Data)', icon: 'json' },
                  { value: 'pdf', label: 'PDF (Report)', icon: 'pdf' }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg hover:bg-gray-800/50">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="flex items-center gap-2 flex-1">
                      {getFormatIcon(option.icon)}
                      <div>
                        <Label htmlFor={option.value} className="font-medium text-white cursor-pointer">
                          {option.label}
                        </Label>
                        <p className="text-xs text-gray-400 mt-1">
                          {getFormatDescription(option.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Data Inclusion Options */}
          <div>
            <Label className="text-sm font-medium text-white mb-3 block">Include in Export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <div className="flex-1">
                  <Label className="font-medium text-white">Performance Metrics</Label>
                  <p className="text-xs text-gray-400">Daily impressions, clicks, costs, and conversions</p>
                </div>
                <span className="text-xs text-gray-500">Always included</span>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="roi"
                  checked={includeROI}
                  onCheckedChange={(checked) => setIncludeROI(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="roi" className="font-medium text-white cursor-pointer">ROI Analysis</Label>
                  <p className="text-xs text-gray-400">Revenue, profit margins, customer metrics</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="conversions"
                  checked={includeConversions}
                  onCheckedChange={(checked) => setIncludeConversions(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="conversions" className="font-medium text-white cursor-pointer">Conversion Details</Label>
                  <p className="text-xs text-gray-400">Individual conversion events and tracking data</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="attribution"
                  checked={includeAttribution}
                  onCheckedChange={(checked) => setIncludeAttribution(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="attribution" className="font-medium text-white cursor-pointer">Attribution Analysis</Label>
                  <p className="text-xs text-gray-400">Customer journey and touchpoint analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <h4 className="font-medium text-white mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Format:</span>
                <span className="text-white ml-2">{format.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-400">Est. Size:</span>
                <span className="text-white ml-2">{estimateFileSize()}</span>
              </div>
              <div>
                <span className="text-gray-400">Date Range:</span>
                <span className="text-white ml-2">{dateRange}</span>
              </div>
              <div>
                <span className="text-gray-400">Records:</span>
                <span className="text-white ml-2">{performanceData.length} days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="text-white border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-primary hover:bg-primary/90"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}