"use client"

import * as React from "react"
import { IconTrendingUp, IconEdit, IconExternalLink } from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Progress } from "~/components/ui/progress"

export const description = "Campaign status and lead generation tracking"

// Campaign status data
const campaignData = {
  activeCampaign: {
    name: "Emergency Plumber London",
    status: "Live",
    daysActive: 5,
    dailyBudget: 45,
  },
  leadGeneration: {
    currentMonth: 24,
    lastMonth: 8,
    monthlyGoal: 30,
    growthMultiplier: 3,
  },
}

export function ChartAreaInteractive() {
  const { activeCampaign, leadGeneration } = campaignData
  const progressPercentage = (leadGeneration.currentMonth / leadGeneration.monthlyGoal) * 100

  return (
    <div className="space-y-4">
      {/* Active Campaign Status */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Active Campaign
          </CardTitle>
          <CardDescription>
            Current Google Ads campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{activeCampaign.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    ✅ {activeCampaign.status}
                  </Badge>
                  for {activeCampaign.daysActive} days
                </span>
                <span>Budget: £{activeCampaign.dailyBudget}/day</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <IconEdit className="w-4 h-4 mr-1" />
                Edit Campaign
              </Button>
              <Button variant="outline" size="sm">
                <IconExternalLink className="w-4 h-4 mr-1" />
                View in Google Ads
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Generation Progress */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Lead Generation This Month
          </CardTitle>
          <CardDescription>
            Progress towards your monthly lead generation goal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{leadGeneration.currentMonth}/{leadGeneration.monthlyGoal} leads</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold">{leadGeneration.currentMonth}</div>
              <div className="text-sm text-muted-foreground">This month</div>
            </div>
            <div className="text-center text-muted-foreground">
              <div className="text-lg">vs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{leadGeneration.lastMonth}</div>
              <div className="text-sm text-muted-foreground">Last month</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <IconTrendingUp className="w-4 h-4 mr-1" />
                {leadGeneration.growthMultiplier}x growth
              </Badge>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            🎯 On track to hit {leadGeneration.growthMultiplier}x improvement goal!
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
