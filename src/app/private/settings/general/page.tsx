'use client';

import { GeneralSettingsForm } from '@/features/settings/GeneralSettingsForm';

export default function GeneralSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        <GeneralSettingsForm />
      </div>
    </div>
  );
}
