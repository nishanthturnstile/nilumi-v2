import { createApiClient } from "@nilumi/api-client";
import { catalogue, NilumiButton, NilumiField, NilumiText, usePalette } from "@nilumi/ui";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { getClientConfig } from "../config/env";

export default function ComponentCheck() {
  const palette = usePalette();
  const [value, setValue] = useState("வணக்கம் Nilumi — synthetic check");
  const [pressed, setPressed] = useState(false);
  const [health, setHealth] = useState("Not checked");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function checkHealth() {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const timeout = setTimeout(() => request.abort(), 3000);
    setHealth("Checking liveness…");
    try {
      const config = getClientConfig();
      const client = createApiClient({
        baseUrl: config.EXPO_PUBLIC_API_BASE_URL,
        platform: Platform.OS === "web" ? "web" : "native",
      });
      await client.getHealth(request.signal);
      if (controller.current === request && !request.signal.aborted)
        setHealth("API is alive; dependency readiness is separate");
    } catch {
      if (controller.current === request)
        setHealth("API unavailable or public configuration missing");
    } finally {
      clearTimeout(timeout);
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette["linen-floor"] }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: 720, gap: 24 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View
              accessible={false}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: palette["memory-tint"],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg
                width={20}
                height={20}
                viewBox="0 0 256 256"
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                <Path
                  fill={palette["memory-strong"]}
                  d="M208,216H48a8,8,0,0,1-6.86-12.12l30.48-50.8h0c13.23-2.48,32-1.41,56.37,10.92,32.25,16.33,54.75,12.91,67.5,7.65h0l19.34,32.23A8,8,0,0,1,208,216Z"
                />
                <Path
                  fill={palette["memory-ink"]}
                  d="M221.69,199.77,160,96.92V40h8a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16h8V96.92L34.31,199.77A16,16,0,0,0,48,224H208a16,16,0,0,0,13.72-24.23ZM110.86,103.25A7.93,7.93,0,0,0,112,99.14V40h32V99.14a7.93,7.93,0,0,0,1.14,4.11L183.36,167c-12,2.37-29.07,1.37-51.75-10.11-15.91-8.05-31.05-12.32-45.22-12.81ZM48,208l28.54-47.58c14.25-1.73,30.31,1.85,47.82,10.72,19,9.61,35,12.88,48,12.88a69.89,69.89,0,0,0,19.55-2.7L208,208Z"
                />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <NilumiText accessibilityRole="header" size={26} weight={800}>
                Nilumi · வணக்கம்
              </NilumiText>
            </View>
          </View>
          <NilumiText>Internal component check · development only</NilumiText>
          <NilumiText scale={2}>தமிழ் + Latin at 200% — text wraps without shrinking.</NilumiText>
          <NilumiField
            label="Mixed-script field"
            testID="component-check-field"
            value={value}
            onChangeText={setValue}
          />
          <NilumiButton label="Check interaction" onPress={() => setPressed(true)} />
          <NilumiText accessibilityLiveRegion="polite">
            {pressed ? "Interaction checked · சரி" : "Press the button to check interaction"}
          </NilumiText>
          <NilumiField
            label="Error example"
            value="Synthetic fixture"
            onChangeText={() => {}}
            error="Check this example · மீண்டும் முயற்சிக்கவும்"
          />
          <NilumiField
            label="Disabled field"
            value="Disabled example"
            onChangeText={() => {}}
            disabled
          />
          <NilumiButton label="Disabled button" disabled />
          <NilumiButton label="Loading example" loading />
          <NilumiButton
            label="Check API liveness"
            onPress={() => {
              void checkHealth();
            }}
          />
          <NilumiText accessibilityLiveRegion="polite">{health}</NilumiText>
          <NilumiText accessibilityRole="header" weight={750} size={20}>
            Context catalogue
          </NilumiText>
          {(["today", "lists", "talk", "tasks", "memory", "linen"] as const).map((context) => (
            <View
              key={context}
              style={{ backgroundColor: palette[`${context}-tint`], padding: 16, borderRadius: 20 }}
            >
              <NilumiText
                style={{ color: palette[`${context}-ink`] }}
              >{`${context} · floor / tint / strong / ink / surface / shadow`}</NilumiText>
            </View>
          ))}
          <NilumiText>{`${Object.keys(catalogue.light).length} catalogue colours per theme. No product workflows are implemented.`}</NilumiText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
