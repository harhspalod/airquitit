'use client';
import React from 'react';
import DashboardProvider from './provider';
import WelcomeContainer from './dashboard/_components/WelcomeContainer';
import { SpeedInsights } from '@vercel/speed-insights/next'; // Import SpeedInsights

function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <div className="p-10 w-full space-y-6">
        <WelcomeContainer />
        {children}
      </div>
      <SpeedInsights /> {/* Add SpeedInsights component */}
    </DashboardProvider>
  );
}

export default DashboardLayout;
