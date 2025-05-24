"use client";

import { useState } from "react";
import { CheckIcon } from "lucide-react";
import Confetti from "react-dom-confetti";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Switch } from "@acme/ui/switch";

export default function PricingPage() {
  const [discount, setDiscount] = useState(false);
  const config = {
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 70,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: "10px",
    height: "10px",
    perspective: "500px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"],
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">
          Straightforward,
          <br />
          affordable pricing
        </h1>
        <p className="mb-2 text-gray-600">Find a plan that fits your needs.</p>
        <p className="mb-6 text-gray-600">
          Start for free, no credit card required.
        </p>

        <div className="flex items-center justify-center gap-2">
          <Confetti config={config} active={discount} />
          <Switch
            id="discount"
            checked={discount}
            onCheckedChange={() => setDiscount(!discount)}
          />
          <label htmlFor="discount" className="flex items-center text-sm">
            Annual discount{" "}
            <span className="ml-1 text-blue-500">(Save 20%)</span>
          </label>
        </div>
      </div>

      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 font-medium">Free</h2>
          <div className="mb-6">
            <div className="flex items-end">
              <span className="text-3xl font-bold">$0</span>
              <span className="ml-1 text-sm text-gray-500">
                free
                <br />
                forever
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              For hobbyists and individuals looking to manage their links
            </p>
          </div>

          <Button variant="outline" className="mb-6 w-full">
            Start for free
          </Button>

          <div className="space-y-4">
            <p className="text-sm font-medium">Everything in Free, plus:</p>
            <FeatureItem text="1K tracked clicks/mo" />
            <FeatureItem text="25 new links/mo" />
            <FeatureItem text="30-day analytics retention" />
            <FeatureItem text="3 domains" />
            <FeatureItem text="1 user" />
            <FeatureItem text="Advanced analytics" />
            <FeatureItem text="10 AI credits/mo" />
            <FeatureItem text="Basic support" />
            <FeatureItem text="API Access" />
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 font-medium">Pro</h2>
          <div className="mb-6">
            <div className="flex items-end">
              <span className="text-3xl font-bold">
                {discount ? "15" : "19"}
              </span>
              <span className="ml-1 text-sm text-gray-500">
                per
                <br />
                month
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              For content creators or small teams needing advanced features
            </p>
          </div>

          <Button className="mb-6 w-full bg-black text-white hover:bg-gray-800">
            Get Pro
          </Button>

          <div className="space-y-4">
            <p className="text-sm font-medium">Everything in Free, plus:</p>
            <FeatureItem text="50K tracked clicks/mo" />
            <FeatureItem text="1,000 new links/mo" />
            <FeatureItem text="1-year analytics retention" />
            <FeatureItem text="10 domains" />
            <FeatureItem text="5 users" />
            <FeatureItem text="Advanced link features" />
            <FeatureItem text="Unlimited AI credits" />
            <FeatureItem text="Priority support" />
            <FeatureItem text="Premium sub.link domain" />
            <FeatureItem text="Free custom domain" />
          </div>
        </div>

        <div className="relative rounded-lg border p-6">
          <Badge
            className="absolute -top-2 right-6 bg-blue-600"
            id="best-value"
          >
            BEST VALUE
          </Badge>
          <h2 className="mb-4 font-medium">Business</h2>
          <div className="mb-6">
            <div className="flex items-end">
              <span className="text-3xl font-bold">
                {discount ? "39" : "49"}
              </span>
              <span className="ml-1 text-sm text-gray-500">
                per
                <br />
                month
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              For fast-growing startups and businesses looking to scale
            </p>
          </div>

          <Button className="mb-6 w-full bg-blue-600 hover:bg-blue-700">
            Get Business
          </Button>

          <div className="space-y-4">
            <p className="text-sm font-medium">Everything in Pro, plus:</p>
            <FeatureItem text="150K tracked clicks/mo" />
            <FeatureItem text="5,000 new links/mo" />
            <FeatureItem text="$5,000 tracked sales/mo" />
            <div className="relative pl-6">
              <div className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center">
                <div className="flex h-4 w-4 items-center justify-center rounded-md bg-gray-100">
                  <span className="text-xs">📊</span>
                </div>
              </div>
              <div className="rounded-md bg-gray-50 p-2">
                <p className="text-xs font-medium">Conversion Tracking</p>
                <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full w-1/3 rounded-full bg-blue-500"></div>
                </div>
              </div>
            </div>
            <FeatureItem text="3-year analytics retention" />
            <FeatureItem text="40 domains" />
            <FeatureItem text="15 users" />
            <FeatureItem text="Real-time events stream" />
            <FeatureItem text="Real-time webhooks" />
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 font-medium">Custom</h2>
          <div className="mb-6">
            <p className="mt-4 text-sm text-gray-600">
              For large organizations and governments with custom needs
            </p>
          </div>

          <Button variant="outline" className="mb-6 w-full">
            Contact us
          </Button>

          <div className="space-y-4">
            <p className="text-sm font-medium">Everything in Business, plus:</p>
            <FeatureItem text="SSO/SAML" />
            <FeatureItem text="Role-based controls" />
            <FeatureItem text="Volume discounts" />
            <FeatureItem text="Custom SLA" />
            <FeatureItem text="Audit logs" />
            <FeatureItem text="Dedicated success manager" />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-6 flex items-center text-sm font-medium">
          <LinkIcon className="mr-2" />
          Short links
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="space-y-4">
            <ComparisonItem text="Unlimited clicks" />
            <ComparisonItem text="25 new links/mo" />
            <ComparisonItem text="Unlimited redirects" />
            <ComparisonItem text="QR Codes" />
            <ComparisonItem text="UTM Builder" />
          </div>

          <div className="space-y-4">
            <ComparisonItem text="Unlimited clicks" />
            <ComparisonItem text="1K new links/mo" />
            <ComparisonItem text="Unlimited redirects" />
            <ComparisonItem text="QR Codes" />
            <ComparisonItem text="UTM Builder" />
          </div>

          <div className="space-y-4">
            <ComparisonItem text="Unlimited clicks" />
            <ComparisonItem text="5K new links/mo" />
            <ComparisonItem text="Unlimited redirects" />
            <ComparisonItem text="QR Codes" />
            <ComparisonItem text="UTM Builder" />
          </div>

          <div className="space-y-4">
            <ComparisonItem text="Unlimited clicks" />
            <ComparisonItem text="250K new links/mo" />
            <ComparisonItem text="Unlimited redirects" />
            <ComparisonItem text="QR Codes" />
            <ComparisonItem text="UTM Builder" />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-6 flex items-center text-sm font-medium">
          Frequently asked questions
        </h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Andrei Ovidiu Dorobantu?</AccordionTrigger>
            <AccordionContent>
              Este cel mai mare femboy din Romania.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Andrei Ovidiu Dorobantu?</AccordionTrigger>
            <AccordionContent>
              Este cel mai mare femboy din Romania.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Andrei Ovidiu Dorobantu?</AccordionTrigger>
            <AccordionContent>
              Este cel mai mare femboy din Romania.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Andrei Ovidiu Dorobantu?</AccordionTrigger>
            <AccordionContent>
              Este cel mai mare femboy din Romania.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start">
      <div className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100">
          <span className="text-xs">•</span>
        </div>
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

function ComparisonItem({ text }: { text: string }) {
  return (
    <div className="flex items-center">
      <CheckIcon className="mr-2 h-4 w-4 text-gray-400" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  );
}
