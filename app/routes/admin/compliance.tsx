import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  AlertTriangle,
  Shield,
  Users,
  FileText,
  TrendingUp,
  Download,
  Search,
  Filter
} from "lucide-react";
import { ComplianceProvider } from "~/lib/complianceContext";

// Mock data for demonstration - in real implementation, this would come from Convex
const mockViolations = [
  {
    id: '1',
    userId: 'user_123',
    userEmail: 'john@tradeco.uk',
    type: 'false_gas_safe_claim',
    severity: 'critical',
    content: 'Gas Safe certified engineer available 24/7',
    detectedAt: new Date('2024-11-01'),
    resolved: false,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  },
  {
    id: '2',
    userId: 'user_456',
    userEmail: 'mike@electrical.co.uk',
    type: 'unqualified_electrical_work',
    severity: 'high',
    content: 'All electrical work including Part P installations',
    detectedAt: new Date('2024-11-02'),
    resolved: true,
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0...'
  }
];

const mockCertifications = [
  {
    userId: 'user_123',
    userEmail: 'john@tradeco.uk',
    gasafe: { status: 'missing', required: true },
    partP: { status: 'verified', expiresIn: 365 },
    insurance: { status: 'expired', expiresIn: -30 },
    business: { status: 'verified', expiresIn: 1095 }
  },
  {
    userId: 'user_456',
    userEmail: 'mike@electrical.co.uk',
    gasafe: { status: 'not_required', required: false },
    partP: { status: 'pending', required: true },
    insurance: { status: 'verified', expiresIn: 180 },
    business: { status: 'verified', expiresIn: 365 }
  }
];

function AdminComplianceDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={variants[severity as keyof typeof variants]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      missing: 'bg-gray-100 text-gray-800',
      not_required: 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const exportViolations = () => {
    const csv = [
      ['Date', 'User Email', 'Type', 'Severity', 'Content', 'IP Address', 'Resolved'].join(','),
      ...mockViolations.map(v => [
        v.detectedAt.toISOString(),
        v.userEmail,
        v.type,
        v.severity,
        `"${v.content}"`,
        v.ipAddress,
        v.resolved
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-violations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor user compliance and violations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportViolations} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockViolations.filter(v => v.severity === 'critical' && !v.resolved).length}
            </div>
            <p className="text-xs text-gray-500">Requiring immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockViolations.length}</div>
            <p className="text-xs text-gray-500">
              {mockViolations.filter(v => !v.resolved).length} unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Monitored</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCertifications.length}</div>
            <p className="text-xs text-gray-500">Active compliance monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((mockViolations.filter(v => v.resolved).length / mockViolations.length) * 100)}%
            </div>
            <p className="text-xs text-gray-500">Resolution rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="legal">Legal Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Critical Issues</CardTitle>
              <CardDescription>Issues requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockViolations
                  .filter(v => v.severity === 'critical' && !v.resolved)
                  .map((violation) => (
                    <div key={violation.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{violation.userEmail}</span>
                          {getSeverityBadge(violation.severity)}
                        </div>
                        <p className="text-sm text-gray-600">{violation.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500 mt-1">"{violation.content}"</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Investigate
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by user email or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Violations List */}
          <Card>
            <CardHeader>
              <CardTitle>All Violations</CardTitle>
              <CardDescription>Complete list of detected compliance violations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockViolations.map((violation) => (
                  <div key={violation.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{violation.userEmail}</span>
                          {getSeverityBadge(violation.severity)}
                          {violation.resolved && (
                            <Badge className="bg-green-100 text-green-800">RESOLVED</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {violation.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">"{violation.content}"</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {violation.detectedAt.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {violation.detectedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <div>
                        <strong>IP Address:</strong> {violation.ipAddress}
                      </div>
                      <div>
                        <strong>User ID:</strong> {violation.userId}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        View Full Details
                      </Button>
                      {!violation.resolved && (
                        <Button size="sm">
                          Mark Resolved
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Contact User
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Certification Status</CardTitle>
              <CardDescription>Monitor certification compliance across all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCertifications.map((cert) => (
                  <div key={cert.userId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{cert.userEmail}</h3>
                        <p className="text-sm text-gray-500">User ID: {cert.userId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Gas Safe</p>
                        {getStatusBadge(cert.gasafe.status)}
                        {cert.gasafe.required && cert.gasafe.status === 'missing' && (
                          <p className="text-xs text-red-600 mt-1">Required</p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Part P</p>
                        {getStatusBadge(cert.partP.status)}
                        {cert.partP.expiresIn && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires in {cert.partP.expiresIn} days
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Insurance</p>
                        {getStatusBadge(cert.insurance.status)}
                        <p className={`text-xs mt-1 ${cert.insurance.expiresIn < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {cert.insurance.expiresIn < 0 ? 'Expired' : `Expires in ${cert.insurance.expiresIn} days`}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Business</p>
                        {getStatusBadge(cert.business.status)}
                        <p className="text-xs text-gray-500 mt-1">
                          Expires in {cert.business.expiresIn} days
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Legal Evidence Repository</CardTitle>
              <CardDescription>
                Compliance audit trail and evidence for legal protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Evidence Collection Status</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ User IP addresses and timestamps logged</li>
                    <li>✓ Terms acceptance with legal versioning tracked</li>
                    <li>✓ Compliance warnings shown and acknowledged</li>
                    <li>✓ Violation detection with automated logging</li>
                    <li>✓ User certification upload attempts recorded</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Legal Protection Measures</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Comprehensive disclaimers in place</li>
                    <li>• User responsibility clearly documented</li>
                    <li>• Audit trail for regulatory compliance</li>
                    <li>• Evidence exportable for legal proceedings</li>
                    <li>• Data retention compliant with UK regulations</li>
                  </ul>
                </div>

                <Button onClick={exportViolations} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Complete Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminCompliancePage() {
  return (
    <ComplianceProvider>
      <AdminComplianceDashboard />
    </ComplianceProvider>
  );
}