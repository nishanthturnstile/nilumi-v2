import { expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { TamaguiProvider } from "tamagui";
import Probe from "../app/index";
import { config } from "../tamagui.config";

test("Tamagui input and button execute synthetic native interaction", async () => {
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
