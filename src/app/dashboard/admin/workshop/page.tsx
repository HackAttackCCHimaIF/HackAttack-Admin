import React from "react";
import { AdminHeaderDashboard } from "../../_components/AdminHeaderDashboard";
import AdminWorkshopSuspenseWrapper from "../../_components/AdminSuspenseWrapper";
import AdminWorkshopDashboard from "../../_components/AdminWorkshopDashboard";

const AdminDashboardPage = () => {
  return (
    <div>
      <AdminHeaderDashboard
        leftText="Welcome"
        rightText="Admin!👋🏼"
        description="Your hard work keeps everything running thank you, Admin!"
      />
      <AdminWorkshopDashboard>
        <AdminWorkshopSuspenseWrapper />
      </AdminWorkshopDashboard>
    </div>
  );
};

export default AdminDashboardPage;
