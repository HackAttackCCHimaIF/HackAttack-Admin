import React from "react";
import { AdminHeaderDashboard } from "../../_components/_team/AdminHeaderDashboard";
import AdminSubmissionTableWrapper from "../../_components/_submission/AdminSubmissionTableWrapper";
import AdminSubmissionDashboard from "../../_components/_submission/AdminSubmissionDashboard";

const AdminDashboardPage = () => {
  return (
    <div>
      <AdminHeaderDashboard
        leftText="Submission Data"
        description="Comprehensive Submission Data from Participants"
      />
      <AdminSubmissionDashboard>
        <AdminSubmissionTableWrapper />
      </AdminSubmissionDashboard>
    </div>
  );
};

export default AdminDashboardPage;
