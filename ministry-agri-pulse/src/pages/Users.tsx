import DashboardLayout from "@/components/layouts/DashboardLayout";

const Users = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground max-w-2xl">
            User and role administration will be available in a future update.
            The backend endpoints are being finalised to ensure secure
            provisioning and management of ministry accounts.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Users;
