import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  Calendar,
  Zap,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { alertsSystem, type Alert, type AlertAction } from "~/lib/alertsSystem";
import type { PerformanceMetrics, AdvancedROIMetrics } from "~/lib/mockPerformanceData";
import type { SyncStatus } from "~/lib/googleAdsSync";

interface AlertsPanelProps {
  currentData: PerformanceMetrics[];
  previousData: PerformanceMetrics[];
  roiMetrics: AdvancedROIMetrics;
  syncStatus: SyncStatus;
}

export function AlertsPanel({ currentData, previousData, roiMetrics, syncStatus }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Analyze performance and generate alerts
    const newAlerts = alertsSystem.analyzePerformance(currentData, previousData, roiMetrics, syncStatus);
    setAlerts(newAlerts);
  }, [currentData, previousData, roiMetrics, syncStatus]);

  const handleDismissAlert = (alertId: string) => {
    alertsSystem.dismissAlert(alertId);
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    toast.success("Alert dismissed");
  };

  const handleAlertAction = (action: AlertAction, alert: Alert) => {
    if (action.action === 'navigate') {
      toast.info(`Navigating to ${action.params?.route || 'page'}...`);
    } else if (action.action === 'external') {
      toast.info(`Opening external link...`);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getAlertBadgeColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-600 text-white';
      case 'warning': return 'bg-yellow-600 text-white';
      case 'opportunity': return 'bg-green-600 text-white';
      case 'info': return 'bg-blue-600 text-white';
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'performance': return <Target className="w-4 h-4" />;
      case 'budget': return <TrendingDown className="w-4 h-4" />;
      case 'sync': return <Zap className="w-4 h-4" />;
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      case 'seasonal': return <Calendar className="w-4 h-4" />;
    }
  };

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);
  const alertSummary = alertsSystem.getAlertSummary();

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="text-white">Performance Alerts</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-red-600 text-white">
              {alertSummary.critical} Critical
            </Badge>
            <Badge className="bg-yellow-600 text-white">
              {alertSummary.warning} Warnings
            </Badge>
            <Badge className="bg-green-600 text-white">
              {alertSummary.opportunity} Opportunities
            </Badge>
          </div>
        </div>
        <CardDescription>
          Real-time monitoring and optimization recommendations for your campaigns
        </CardDescription>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">All Systems Running Smoothly</h3>
            <p className="text-gray-400">No critical issues detected. Your campaigns are performing well.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.type === 'critical'
                    ? 'border-red-600 bg-red-900/20'
                    : alert.type === 'warning'
                    ? 'border-yellow-600 bg-yellow-900/20'
                    : alert.type === 'opportunity'
                    ? 'border-green-600 bg-green-900/20'
                    : 'border-blue-600 bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <Badge className={getAlertBadgeColor(alert.type)}>
                      {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      {getCategoryIcon(alert.category)}
                      <span>{alert.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismissAlert(alert.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-white">{alert.title}</h4>
                  <p className="text-sm text-gray-300">{alert.message}</p>
                  <p className="text-sm text-gray-400 italic">
                    💡 {alert.recommendation}
                  </p>

                  {alert.metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 p-2 bg-gray-800/50 rounded">
                      <div className="text-center">
                        <div className="text-sm font-medium text-white">
                          {typeof alert.metrics.current === 'number'
                            ? alert.metrics.current.toFixed(2)
                            : alert.metrics.current}
                          {alert.category === 'performance' && '%'}
                        </div>
                        <div className="text-xs text-gray-400">Current</div>
                      </div>
                      {alert.metrics.previous && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-300">
                            {alert.metrics.previous.toFixed(2)}
                            {alert.category === 'performance' && '%'}
                          </div>
                          <div className="text-xs text-gray-400">Previous</div>
                        </div>
                      )}
                      {alert.metrics.benchmark && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-400">
                            {alert.metrics.benchmark.toFixed(2)}
                            {alert.category === 'performance' && '%'}
                          </div>
                          <div className="text-xs text-gray-400">Target</div>
                        </div>
                      )}
                      {alert.metrics.change && (
                        <div className="text-center">
                          <div className={`text-sm font-medium flex items-center justify-center gap-1 ${
                            alert.metrics.change > 0 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {alert.metrics.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(alert.metrics.change).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-400">Change</div>
                        </div>
                      )}
                    </div>
                  )}

                  {alert.actions && alert.actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {alert.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.type === 'primary' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAlertAction(action, alert)}
                          className={
                            action.type === 'primary'
                              ? 'bg-primary hover:bg-primary/90'
                              : 'text-white border-gray-600 hover:bg-gray-800'
                          }
                        >
                          {action.label}
                          {action.action === 'external' && <ExternalLink className="w-3 h-3 ml-1" />}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {alerts.length > 5 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="text-white border-gray-700 hover:bg-gray-800"
                >
                  {showAll ? 'Show Less' : `Show ${alerts.length - 5} More Alerts`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}