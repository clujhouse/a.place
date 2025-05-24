"use client";

import { Crown, Sparkles, User } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { useSubscription } from "~/hooks/use-subscription";

const planConfig = {
  standard: {
    name: "Standard",
    icon: User,
    color: "bg-gray-100 text-gray-800",
    features: ["Basic features", "5 projects", "10GB storage"],
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "bg-blue-100 text-blue-800",
    features: [
      "20 projects",
      "50GB storage",
      "14-day trial",
      "Priority support",
    ],
  },
  pro_exclusive: {
    name: "Pro Exclusive",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-800",
    features: [
      "100 projects",
      "500GB storage",
      "Premium features",
      "24/7 support",
    ],
  },
};

export function SubscriptionStatus() {
  const { currentPlan, isLoading, subscription } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
            Loading subscription...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const config = planConfig[currentPlan];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Current Plan
          </div>
          <Badge className={config.color}>{config.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">Features included:</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {config.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {subscription && (
            <div className="border-t pt-3">
              <div className="text-sm text-gray-600">
                <p>
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {subscription.status}
                  </span>
                </p>
                {subscription.current_period_end && (
                  <p>
                    Next billing:{" "}
                    {new Date(
                      subscription.current_period_end * 1000,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
