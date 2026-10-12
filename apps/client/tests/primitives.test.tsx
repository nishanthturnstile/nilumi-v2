import { expect, test } from "@jest/globals";
import { NilumiButton, NilumiField, NilumiText, tamaguiConfig } from "@nilumi/ui";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { TamaguiProvider } from "tamagui";

function Fixture() {
  const [value, setValue] = useState("synthetic");
  const [pressed, setPressed] = useState(false);
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <NilumiField label="Synthetic field" value={value} onChangeText={setValue} />
      <NilumiButton label="Check fixture" onPress={() => setPressed(true)} />
      <NilumiText>{pressed ? `சரி ${value}` : "வணக்கம் Nilumi"}</NilumiText>
      <NilumiButton label="Disabled fixture" disabled />
      <NilumiButton label="Loading fixture" loading />
      <NilumiField label="Error fixture" value="" onChangeText={() => {}} error="Synthetic error" />
    </TamaguiProvider>
  );
}

test("native field and button render mixed text and execute callbacks", async () => {
  await render(<Fixture />);
  expect(screen.getByText("வணக்கம் Nilumi")).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText("Synthetic field"), "fixture");
  await fireEvent.press(screen.getByRole("button", { name: "Check fixture" }));
  expect(screen.getByText("சரி fixture")).toBeTruthy();
});

test("native controls expose disabled, busy and error states", async () => {
  await render(<Fixture />);
  expect(screen.getByRole("button", { name: "Disabled fixture" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Loading fixture" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Loading fixture" }).props.accessibilityState,
  ).toMatchObject({
    busy: true,
  });
  expect(screen.getByRole("alert")).toHaveTextContent("Synthetic error");
});
