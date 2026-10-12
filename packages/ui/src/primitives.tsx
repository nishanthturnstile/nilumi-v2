import { useId, useState } from "react";
import { Platform, Text, type TextProps, useColorScheme, useWindowDimensions } from "react-native";
import { YStack } from "tamagui";
import { ButtonFrame, ButtonText, Input } from "tamagui/unstyled";
import { catalogue } from "./tokens";

export function usePalette() {
  return catalogue[useColorScheme() === "dark" ? "dark" : "light"];
}
export function NilumiText({
  children,
  weight = 500,
  size = 16,
  scale = 1,
  ...props
}: Omit<TextProps, "children"> & {
  children: string;
  weight?: 500 | 600 | 750 | 800;
  size?: number;
  scale?: number;
}) {
  const palette = usePalette();
  const runs = children.split(/([\u0B80-\u0BFF]+(?:[\s\u200C\u200D]+[\u0B80-\u0BFF]+)*)/u);
  const lineMultiplier = /[\u0B80-\u0BFF]/u.test(children) ? 1.6 : size >= 20 ? 1.4 : 1.5;
  let offset = 0;
  return (
    <Text
      {...props}
      allowFontScaling
      style={[
        {
          color: palette.ink,
          fontFamily: `Nunito${weight}`,
          fontSize: size * scale,
          lineHeight: size * scale * lineMultiplier,
        },
        props.style,
      ]}
    >
      {runs
        .filter((run) => run.length > 0)
        .map((run) => {
          const key = offset;
          offset += run.length;
          return (
            <Text
              key={key}
              style={{
                fontFamily: /[\u0B80-\u0BFF]/u.test(run) ? `Tamil${weight}` : `Nunito${weight}`,
              }}
            >
              {run}
            </Text>
          );
        })}
    </Text>
  );
}

export function NilumiButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const palette = usePalette();
  const [focused, setFocused] = useState(false);
  return (
    <ButtonFrame
      {...(Platform.OS === "web"
        ? { "aria-label": label, "aria-busy": loading }
        : {
            accessibilityRole: "button" as const,
            accessibilityLabel: label,
            accessibilityState: { disabled: disabled || loading, busy: loading },
          })}
      disabled={disabled || loading}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      minHeight={48}
      paddingVertical={12}
      paddingHorizontal={20}
      borderRadius={20}
      borderWidth={2}
      borderColor={focused ? palette["focus-inverse"] : "transparent"}
      backgroundColor={palette.action}
      opacity={disabled ? 0.5 : 1}
      outlineWidth={focused ? 2 : 0}
      outlineOffset={2}
      outlineColor={palette.focus}
    >
      <ButtonText>
        <NilumiText weight={600} style={{ color: palette["action-foreground"] }}>
          {loading ? "Loading…" : label}
        </NilumiText>
      </ButtonText>
    </ButtonFrame>
  );
}

export function NilumiField({
  label,
  value,
  onChangeText,
  error,
  disabled = false,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled?: boolean;
  testID?: string;
}) {
  const palette = usePalette();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const { fontScale } = useWindowDimensions();
  return (
    <YStack gap={8}>
      <NilumiText nativeID={id} weight={600}>
        {label}
      </NilumiText>
      <Input
        testID={testID}
        {...(Platform.OS === "web"
          ? {
              "aria-label": label,
              "aria-describedby": error ? `${id}-error` : undefined,
              "aria-invalid": Boolean(error),
            }
          : {
              accessibilityLabel: label,
              accessibilityHint: error ?? "Internal component check; synthetic text only",
              accessibilityState: { disabled },
            })}
        disabled={disabled}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        minHeight={Math.max(48, 26 * fontScale + 24)}
        flexGrow={0}
        padding={12}
        borderWidth={2}
        borderColor={
          focused ? palette.focus : error ? palette["danger-ink"] : palette["control-border"]
        }
        borderRadius={20}
        color={palette.ink}
        backgroundColor={palette["linen-surface"]}
        style={{ fontFamily: "Tamil500" }}
        fontSize={16}
        lineHeight={1.6}
        allowFontScaling
      />
      {error ? (
        <NilumiText
          nativeID={`${id}-error`}
          accessibilityRole="alert"
          style={{ color: palette["danger-ink"] }}
        >
          {error}
        </NilumiText>
      ) : null}
    </YStack>
  );
}
