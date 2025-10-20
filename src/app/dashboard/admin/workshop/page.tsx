import React from "react";
import { AdminHeaderDashboard } from "../../_components/_team/AdminHeaderDashboard";
import AdminWorkshopSuspenseWrapper from "../../_components/_workshop/AdminSuspenseWrapper";
import AdminWorkshopDashboard from "../../_components/_workshop/AdminWorkshopDashboard";

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
