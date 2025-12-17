"use client";

import { useState } from "react";
import { UsersTable } from "./ui/users-table";
import { UserDrawer } from "./ui/user-drawer";
import type { User } from "../hooks/use-users";

export default function UsersPage() {
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleAddUser = () => {
    setSelectedUser(null);
    setUserDrawerOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserDrawerOpen(true);
  };

  const handleCloseUserDrawer = () => {
    setUserDrawerOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage user accounts
        </p>
      </div>

      <UsersTable onAddUser={handleAddUser} onEditUser={handleEditUser} />

      <UserDrawer
        open={userDrawerOpen}
        onClose={handleCloseUserDrawer}
        user={selectedUser}
      />
    </div>
  );
}
