import SessionManager from "@/components/session-manager";

export default function ProfilePage() {
  return (
    <SessionManager requireRole={["TEACHER", "STUDENT", "PARENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue="User Name" 
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue="user@example.com" 
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </SessionManager>
  );
} 