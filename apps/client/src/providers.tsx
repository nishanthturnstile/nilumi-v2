import { tamaguiConfig } from "@nilumi/ui";
import { useFonts } from "expo-font";
import type { PropsWithChildren } from "react";
import { Text, useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";
import Tamil500 from "../assets/fonts/noto-sans-tamil-500.ttf";
import Tamil600 from "../assets/fonts/noto-sans-tamil-600.ttf";
import Tamil750 from "../assets/fonts/noto-sans-tamil-750.ttf";
import Tamil800 from "../assets/fonts/noto-sans-tamil-800.ttf";
import Nunito500 from "../assets/fonts/nunito-500.ttf";
import Nunito600 from "../assets/fonts/nunito-600.ttf";
import Nunito750 from "../assets/fonts/nunito-750.ttf";
import Nunito800 from "../assets/fonts/nunito-800.ttf";

export function Providers({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const [loaded, error] = useFonts({
    Nunito500,
    Nunito750,
    Nunito600,
    Nunito800,
    Tamil500,
    Tamil750,
    Tamil600,
    Tamil800,
  });
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme === "dark" ? "dark" : "light"}>
        {loaded ? (
          children
        ) : (
          <View style={{ padding: 32 }}>
            <Text accessibilityRole={error ? "alert" : "text"}>
              {error
                ? "Bundled fonts could not load. Restart the development app."
                : "Loading bundled fonts…"}
            </Text>
          </View>
        )}
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
