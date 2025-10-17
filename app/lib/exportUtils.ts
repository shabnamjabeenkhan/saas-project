// Export utilities for Google Ads performance data
import type { PerformanceMetrics, AdvancedROIMetrics, JobValueMetrics } from "./mockPerformanceData";
import type { ConversionData, ConversionTracking } from "./googleAdsSync";

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: string;
  includeROI: boolean;
  includeConversions: boolean;
  includeAttribution: boolean;
}

export interface ExportData {
  performanceMetrics: PerformanceMetrics[];
  roiMetrics?: AdvancedROIMetrics;
  jobMetrics?: JobValueMetrics;
  conversionData?: ConversionData[];
  conversionTracking?: ConversionTracking;
  metadata: {
    exportDate: Date;
    dateRange: string;
    businessName: string;
    accountId: string;
  };
}

// Convert data to CSV format
export function exportToCSV(data: ExportData, options: ExportOptions): string {
  const lines: string[] = [];

  // Add metadata header
  lines.push('# Google Ads Performance Export');
  lines.push(`# Business: ${data.metadata.businessName}`);
  lines.push(`# Account ID: ${data.metadata.accountId}`);
  lines.push(`# Export Date: ${data.metadata.exportDate.toISOString()}`);
  lines.push(`# Date Range: ${data.metadata.dateRange}`);
  lines.push('');

  // Performance metrics section
  lines.push('## Daily Performance Metrics');
  lines.push('Date,Impressions,Clicks,Cost,Conversions,CTR,CPC,Conversion Rate,Cost Per Conversion');

  data.performanceMetrics.forEach(metric => {
    lines.push([
      metric.date,
      metric.impressions,
      metric.clicks,
      metric.cost,
      metric.conversions,
      metric.ctr,
      metric.cpc,
      metric.conversionRate,
      metric.costPerConversion
    ].join(','));
  });

  lines.push('');

  // ROI metrics section
  if (options.includeROI && data.roiMetrics && data.jobMetrics) {
    lines.push('## ROI Analysis');
    lines.push('Metric,Value');
    lines.push(`Total Revenue,£${data.roiMetrics.totalRevenue}`);
    lines.push(`Gross Profit,£${data.roiMetrics.grossProfit}`);
    lines.push(`Net Profit,£${data.roiMetrics.netProfit}`);
    lines.push(`ROAS,${data.roiMetrics.roas}x`);
    lines.push(`ROI,${data.roiMetrics.roi}%`);
    lines.push(`Customer Acquisition Cost,£${data.roiMetrics.customerAcquisitionCost}`);
    lines.push(`Customer Lifetime Value,£${data.jobMetrics.customerLifetimeValue}`);
    lines.push(`LTV:CAC Ratio,${data.roiMetrics.lifetimeValueToCAC}x`);
    lines.push(`Payback Period,${data.roiMetrics.paybackPeriod} days`);
    lines.push(`Profit Margin,${data.roiMetrics.profitMargin}%`);
    lines.push(`Revenue Per Click,£${data.roiMetrics.revenuePerClick}`);
    lines.push(`Seasonal Multiplier,${data.jobMetrics.seasonalMultiplier}x`);
    lines.push('');
  }

  // Conversion data section
  if (options.includeConversions && data.conversionData) {
    lines.push('## Conversion Details');
    lines.push('Date,Type,Value,Campaign,Conversion Action,Attribution Model,Time to Conversion,Device,Click ID');

    data.conversionData.forEach(conv => {
      lines.push([
        conv.date,
        conv.conversionType,
        `£${conv.conversionValue}`,
        conv.campaignName,
        conv.conversionAction,
        conv.attributionModel,
        `${conv.timeToConversion}h`,
        conv.deviceType,
        conv.clickId || ''
      ].join(','));
    });
    lines.push('');
  }

  // Attribution analysis
  if (options.includeAttribution && data.roiMetrics) {
    lines.push('## Attribution Analysis');
    lines.push('Attribution Type,Percentage');
    lines.push(`Direct Conversions,${data.roiMetrics.attribution.direct}%`);
    lines.push(`Assisted Conversions,${data.roiMetrics.attribution.assisted}%`);
    lines.push(`Repeat Business,${data.roiMetrics.attribution.lastClick}%`);
  }

  return lines.join('\n');
}

// Convert data to JSON format
export function exportToJSON(data: ExportData, options: ExportOptions): string {
  const exportObject = {
    metadata: data.metadata,
    summary: {
      totalImpressions: data.performanceMetrics.reduce((sum, m) => sum + m.impressions, 0),
      totalClicks: data.performanceMetrics.reduce((sum, m) => sum + m.clicks, 0),
      totalCost: data.performanceMetrics.reduce((sum, m) => sum + m.cost, 0),
      totalConversions: data.performanceMetrics.reduce((sum, m) => sum + m.conversions, 0)
    },
    performanceMetrics: data.performanceMetrics,
    ...(options.includeROI && data.roiMetrics && { roiAnalysis: data.roiMetrics }),
    ...(options.includeROI && data.jobMetrics && { jobMetrics: data.jobMetrics }),
    ...(options.includeConversions && data.conversionData && { conversionData: data.conversionData }),
    ...(options.includeConversions && data.conversionTracking && { conversionTracking: data.conversionTracking })
  };

  return JSON.stringify(exportObject, null, 2);
}

// Generate PDF report (HTML template for PDF generation)
export function generatePDFTemplate(data: ExportData, options: ExportOptions): string {
  const totalMetrics = data.performanceMetrics.reduce((acc, metric) => ({
    impressions: acc.impressions + metric.impressions,
    clicks: acc.clicks + metric.clicks,
    cost: acc.cost + metric.cost,
    conversions: acc.conversions + metric.conversions
  }), { impressions: 0, clicks: 0, cost: 0, conversions: 0 });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Google Ads Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { border-bottom: 2px solid #4285f4; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { color: #4285f4; font-size: 24px; font-weight: bold; }
        .report-title { font-size: 20px; margin: 10px 0; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #4285f4; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #4285f4; }
        .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
        .positive { color: #34a853; }
        .negative { color: #ea4335; }
        .chart-placeholder { background: #f0f0f0; height: 200px; display: flex; align-items: center; justify-content: center; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${data.metadata.businessName}</div>
        <div class="report-title">Google Ads Performance Report</div>
        <div style="color: #666; font-size: 14px;">
            ${data.metadata.dateRange} • Generated ${data.metadata.exportDate.toLocaleDateString()}
        </div>
    </div>

    <div class="metadata">
        <strong>Account Details:</strong><br>
        Account ID: ${data.metadata.accountId}<br>
        Report Period: ${data.metadata.dateRange}<br>
        Export Date: ${data.metadata.exportDate.toLocaleString()}
    </div>

    <div class="section">
        <div class="section-title">Executive Summary</div>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${totalMetrics.impressions.toLocaleString()}</div>
                <div class="metric-label">Total Impressions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totalMetrics.clicks.toLocaleString()}</div>
                <div class="metric-label">Total Clicks</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">£${totalMetrics.cost.toFixed(2)}</div>
                <div class="metric-label">Total Spend</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totalMetrics.conversions}</div>
                <div class="metric-label">Total Conversions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totalMetrics.clicks > 0 ? ((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2) : 0}%</div>
                <div class="metric-label">Click-Through Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">£${totalMetrics.clicks > 0 ? (totalMetrics.cost / totalMetrics.clicks).toFixed(2) : 0}</div>
                <div class="metric-label">Cost Per Click</div>
            </div>
        </div>
    </div>

    ${options.includeROI && data.roiMetrics ? `
    <div class="section">
        <div class="section-title">ROI Analysis</div>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Industry Benchmark</th></tr>
            <tr><td>Total Revenue</td><td>£${data.roiMetrics.totalRevenue.toFixed(2)}</td><td>-</td></tr>
            <tr><td>ROAS (Return on Ad Spend)</td><td>${data.roiMetrics.roas.toFixed(2)}x</td><td>4x+</td></tr>
            <tr><td>ROI (Return on Investment)</td><td class="${data.roiMetrics.roi > 0 ? 'positive' : 'negative'}">${data.roiMetrics.roi.toFixed(1)}%</td><td>200%+</td></tr>
            <tr><td>Customer Acquisition Cost</td><td>£${data.roiMetrics.customerAcquisitionCost.toFixed(2)}</td><td>£30-50</td></tr>
            <tr><td>LTV:CAC Ratio</td><td class="${data.roiMetrics.lifetimeValueToCAC > 3 ? 'positive' : 'negative'}">${data.roiMetrics.lifetimeValueToCAC.toFixed(1)}x</td><td>3x+</td></tr>
            <tr><td>Payback Period</td><td>${data.roiMetrics.paybackPeriod.toFixed(0)} days</td><td>30-90 days</td></tr>
            <tr><td>Profit Margin</td><td class="${data.roiMetrics.profitMargin > 20 ? 'positive' : 'negative'}">${data.roiMetrics.profitMargin.toFixed(1)}%</td><td>20%+</td></tr>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Daily Performance Breakdown</div>
        <table>
            <tr>
                <th>Date</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Cost</th>
                <th>Conversions</th>
                <th>CTR</th>
                <th>CPC</th>
            </tr>
            ${data.performanceMetrics.slice(-10).map(metric => `
            <tr>
                <td>${metric.date}</td>
                <td>${metric.impressions.toLocaleString()}</td>
                <td>${metric.clicks}</td>
                <td>£${metric.cost.toFixed(2)}</td>
                <td>${metric.conversions}</td>
                <td>${metric.ctr.toFixed(2)}%</td>
                <td>£${metric.cpc.toFixed(2)}</td>
            </tr>
            `).join('')}
        </table>
    </div>

    ${options.includeConversions && data.conversionData ? `
    <div class="section">
        <div class="section-title">Conversion Analysis</div>
        <p>Total conversions tracked: ${data.conversionData.length}</p>
        <div class="chart-placeholder">
            Conversion data visualization would appear here
        </div>
    </div>
    ` : ''}

    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p>This report was generated automatically by TradeBoost AI. Data is simulated for demonstration purposes.</p>
        <p>For questions about this report, contact support@tradeboost.ai</p>
    </div>
</body>
</html>`;
}

// Trigger file download
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate export filename
export function generateFilename(format: string, dateRange: string, businessName: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedBusinessName = businessName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitizedBusinessName}_GoogleAds_${dateRange}_${date}.${format}`;
}

// Main export function
export function exportData(
  data: ExportData,
  options: ExportOptions
): void {
  const filename = generateFilename(options.format, options.dateRange, data.metadata.businessName);

  switch (options.format) {
    case 'csv':
      const csvContent = exportToCSV(data, options);
      downloadFile(csvContent, filename, 'text/csv');
      break;

    case 'json':
      const jsonContent = exportToJSON(data, options);
      downloadFile(jsonContent, filename, 'application/json');
      break;

    case 'pdf':
      const htmlContent = generatePDFTemplate(data, options);
      // In a real implementation, you'd use a library like jsPDF or Puppeteer
      // For now, we'll download the HTML which can be printed as PDF
      downloadFile(htmlContent, filename.replace('.pdf', '.html'), 'text/html');
      break;

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}