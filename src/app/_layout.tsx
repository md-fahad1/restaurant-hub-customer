import { ApolloProvider } from "@apollo/client/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "../context/CartContext";
import "../global.css";
import { client } from "../lib/apollo";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: true,
              headerShadowVisible: false,
              headerTintColor: "#1a1a1a",
              headerTitleStyle: { fontWeight: "700" },
              headerBackButtonDisplayMode: "minimal",
              contentStyle: { backgroundColor: "#ffffff" },
            }}
          />
        </CartProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
