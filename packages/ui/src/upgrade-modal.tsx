"use client";

import { useState } from "react";
import { Check, Crown, Sparkles, X } from "lucide-react";

import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
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
      name: "this matters a lot",
      price: "$7",
      period: "/month",
      description: "a token of support, we are grateful",
      icon: <Crown className="h-5 w-5" />,
      features: ["unlimited searches", "you support the project"],
      popular: true,
      disabled:
        currentMembership === "pro" || currentMembership === "pro_exclusive",
    },
    {
      id: "pro_exclusive" as const,
      name: "thank you king",
      price: "$69",
      period: "/month",
      description: "if you really trust the vision",
      icon: <Sparkles className="h-5 w-5" />,
      features: [
        "you are power",
        "you can note other people",
        "you can add notes to other people",
      ],
      popular: false,
      disabled: currentMembership === "pro_exclusive",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto sm:w-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>this is all about trust</DialogTitle>
          <DialogDescription>keep this magic, no bullshit</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>

                <div className="flex h-full flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-3 w-3" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.disabled || isLoading !== null}
                    variant={plan.id === "pro" ? "outline" : "primary"}
                    className="mt-auto w-full"
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
                      `upgrade`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
