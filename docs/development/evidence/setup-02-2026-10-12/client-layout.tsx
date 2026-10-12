import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { TamaguiProvider } from "tamagui";
import { config } from "../tamagui.config";

const queryClient = new QueryClient();
export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={config} defaultTheme="light">
        <Stack screenOptions={{ headerShown: false }} />
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
