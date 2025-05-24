import { SubscriptionStatus } from "~/components/subscription-status";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Manage your account and subscription</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Subscription Status Card */}
        <div className="md:col-span-2">
          <SubscriptionStatus />
        </div>

        {/* Other dashboard cards */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Projects</h2>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-gray-600">Active projects</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Storage</h2>
          <p className="text-2xl font-bold">0 GB</p>
          <p className="text-sm text-gray-600">Used storage</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">API Usage</h2>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-gray-600">Requests this month</p>
        </div>
      </div>
    </div>
  );
}
