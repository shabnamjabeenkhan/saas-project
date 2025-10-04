"use client";
import { useEffect } from "react";
import { useAuth } from "@clerk/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function UserSync() {
  const { isSignedIn } = useAuth();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isSignedIn) {
      upsertUser().catch(() => {});
    }
  }, [isSignedIn, upsertUser]);

  return null;
}


