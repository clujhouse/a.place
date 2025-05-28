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
      name: "we give you something",
      price: "$20",
      period: "/month",
      description:
        "Perfect for individuals who want to get more out of their searches",
      icon: <Crown className="h-5 w-5" />,
      features: [
        "Unlimited searches",
        "More visibility",
        "Advanced analytics",
        "Priority support",
      ],
      popular: true,
      disabled:
        currentMembership === "pro" || currentMembership === "pro_exclusive",
    },
    {
      id: "pro_exclusive" as const,
      name: "69 plan (if you really trust the vision)",
      price: "$69",
      period: "/month",
      description: "69 plan",
      icon: <Sparkles className="h-5 w-5" />,
      features: ["you are power", "you can note other people"],
      popular: false,
      disabled: currentMembership === "pro_exclusive",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto sm:w-auto sm:max-w-4xl">
        <DialogHeader className="space-y-2 pb-4 text-center sm:text-left">
          <DialogTitle className="text-lg font-semibold sm:text-xl">
            help us
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            keep this magic, no bullshit
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-4 transition-colors ${
                plan.popular
                  ? "border-2 border-primary"
                  : "border border-border hover:border-muted-foreground/50"
              } ${plan.disabled ? "opacity-60" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-4">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">{plan.icon}</div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.disabled || isLoading !== null}
                variant={
                  plan.disabled
                    ? "outline"
                    : plan.popular
                      ? "primary"
                      : "outline"
                }
                className="mb-4 w-full"
                size="sm"
              >
                {isLoading === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </div>
                ) : plan.disabled ? (
                  currentMembership === plan.id ? (
                    "Current Plan"
                  ) : (
                    "Not Available"
                  )
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
