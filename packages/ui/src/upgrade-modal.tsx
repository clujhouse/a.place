"use client";

import { useState } from "react";
import { Check, Crown, Sparkles, X } from "lucide-react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: "pro" | "pro_exclusive") => Promise<void>;
  currentMembership?: "standard" | "pro" | "pro_exclusive";
}

export function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  currentMembership = "standard",
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: "pro" | "pro_exclusive") => {
    setIsLoading(plan);
    try {
      await onUpgrade(plan);
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      id: "pro" as const,
      name: "Pro",
      price: "$20",
      period: "/month",
      description: "Perfect for professionals and growing teams",
      icon: <Crown className="h-6 w-6 text-blue-600" />,
      features: [
        "20 projects",
        "50GB storage",
        "Advanced analytics",
        "Priority support",
        "14-day free trial",
        "API access",
        "Custom integrations",
      ],
      popular: true,
      disabled:
        currentMembership === "pro" || currentMembership === "pro_exclusive",
    },
    {
      id: "pro_exclusive" as const,
      name: "Pro Exclusive",
      price: "$69",
      period: "/month",
      description: "For power users who need everything",
      icon: <Sparkles className="h-6 w-6 text-purple-600" />,
      features: [
        "100 projects",
        "500GB storage",
        "Advanced analytics",
        "24/7 priority support",
        "White-label options",
        "Advanced API access",
        "Custom integrations",
        "Dedicated account manager",
        "Early access to features",
      ],
      popular: false,
      disabled: currentMembership === "pro_exclusive",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Upgrade Your Plan
              </DialogTitle>
              <DialogDescription className="mt-2">
                Choose the perfect plan for your needs and unlock powerful
                features
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 p-6 ${
                plan.popular
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 bg-white"
              } ${plan.disabled ? "opacity-60" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                {plan.icon}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              </div>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.disabled || isLoading !== null}
                className={`mb-6 w-full ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                {isLoading === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </div>
                ) : plan.disabled ? (
                  currentMembership === plan.id ? (
                    "Current Plan"
                  ) : (
                    "Downgrade Not Available"
                  )
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">
                  Everything included:
                </p>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
