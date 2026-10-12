import { expect, test } from "@jest/globals";
import { getStateFromPath } from "expo-router/build/react-navigation/core/getStateFromPath";

test("Router's alternate native link parser preserves Tamil and tolerates malformed query bytes", () => {
  const options = { screens: { Shell: "shell" } };
  const valid = getStateFromPath(`/shell?name=${encodeURIComponent("தமிழ் 😀")}`, options);
  expect(valid?.routes[0]?.params).toEqual({ name: "தமிழ் 😀" });
  const malformed = getStateFromPath(`/shell?name=${"%EA".repeat(1000)}&control=ok`, options);
  expect(malformed?.routes[0]?.params).toEqual({ name: "%EA".repeat(1000), control: "ok" });
});
