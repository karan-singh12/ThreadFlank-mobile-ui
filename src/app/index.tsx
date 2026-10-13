import { Redirect } from "expo-router";
import { useAuth } from "@/features/auth/AuthProvider";

/** Entry point and protected-route anchor: send people to Discover or the login screen. */
export default function Index() {
  const { status } = useAuth();
  return <Redirect href={status === "authenticated" ? "/discover" : "/login"} />;
}
