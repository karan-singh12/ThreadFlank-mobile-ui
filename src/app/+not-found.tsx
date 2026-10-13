import { router } from "expo-router";
import { Compass } from "lucide-react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return (
    <Screen header={<StackHeader />} contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <EmptyState
        icon={Compass}
        title="This page doesn't exist"
        description="The link may be broken or the page may have moved."
        action={
          <Button size="sm" onPress={() => router.replace("/")}>
            Go home
          </Button>
        }
      />
    </Screen>
  );
}
