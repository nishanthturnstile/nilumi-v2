import { expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { TamaguiProvider } from "tamagui";
import { ButtonFrame, ButtonText, Input } from "tamagui/unstyled";
import Probe from "../app/index";
import { config } from "../tamagui.config";

test("v3 styled input and button execute synthetic native interaction", async () => {
  await render(
    <TamaguiProvider config={config} defaultTheme="light">
      <Probe />
    </TamaguiProvider>,
  );
  expect(screen.getByText("வணக்கம் · Windows native")).toBeTruthy();
  await fireEvent.changeText(
    screen.getByPlaceholderText("Synthetic input"),
    "setup",
  );
  await fireEvent.press(screen.getByLabelText("Validate input"));
  expect(screen.getByText("Qualification passed")).toBeTruthy();
});

test("v3 unstyled imports expose working input and press behavior", async () => {
  let entered = "";
  let pressed = false;
  await render(
    <TamaguiProvider config={config} defaultTheme="light">
      <Input
        placeholder="Unstyled input"
        minHeight={44}
        borderRadius={8}
        onChangeText={(value) => {
          entered = value;
        }}
      />
      <ButtonFrame
        accessibilityLabel="Unstyled button"
        minHeight={44}
        onPress={() => {
          pressed = true;
        }}
      >
        <ButtonText>Unstyled button</ButtonText>
      </ButtonFrame>
    </TamaguiProvider>,
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("Unstyled input"),
    "setup",
  );
  await fireEvent.press(screen.getByLabelText("Unstyled button"));
  expect(entered).toBe("setup");
  expect(pressed).toBe(true);
});
