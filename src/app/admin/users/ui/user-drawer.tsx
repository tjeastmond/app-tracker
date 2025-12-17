"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserCreateSchema, type UserCreate } from "@/lib/validators";
import { useCreateUser, useUpdateUser, useDeleteUser, type User } from "../../hooks/use-users";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type UserDrawerProps = {
  open: boolean;
  onClose: () => void;
  user: User | null;
};

export function UserDrawer({ open, onClose, user }: UserDrawerProps) {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const isEdit = !!user;

  const isPending =
    createUserMutation.isPending ||
    updateUserMutation.isPending ||
    deleteUserMutation.isPending;

  const form = useForm<UserCreate>({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      email: "",
      isAdmin: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          email: user.email,
          isAdmin: user.isAdmin,
        });
      } else {
        form.reset({
          email: "",
          isAdmin: false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const onSubmit = (data: UserCreate) => {
    if (isEdit) {
      updateUserMutation.mutate(
        { ...data, id: user.id, isAdmin: data.isAdmin ?? false },
        {
          onSuccess: () => {
            onClose();
            form.reset();
          },
          onError: (error) => {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to save user";
            alert(errorMessage);
          },
        }
      );
    } else {
      createUserMutation.mutate(data, {
        onSuccess: () => {
          onClose();
          form.reset();
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to create user";
          alert(errorMessage);
        },
      });
    }
  };

  const handleDelete = () => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    deleteUserMutation.mutate(user.id, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete user";
        alert(errorMessage);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit User" : "Create User"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update user information and permissions"
              : "Add a new user to the system"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Administrator
                    </FormLabel>
                    <FormDescription>
                      Grant this user admin privileges to manage users and system settings
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <div>
                {isEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
