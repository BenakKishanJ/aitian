import { Tabs } from "expo-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import { View } from "react-native";
import { Home, CalendarDays, BookOpen, Bell, User } from "lucide-react-native";

const CHARCOAL = "#1C1C1E"; // modern charcoal black
const PASTEL_BLUE = "#BFDBFE"; // soft pastel blue

function TabIcon({ Icon, focused }: any) {
  return (
    <View
      className="items-center justify-center rounded-2xl"
      style={{
        width: 50,
        height: 50,
        backgroundColor: focused ? PASTEL_BLUE : "transparent",
      }}
    >
      <Icon
        size={22}
        color={focused ? CHARCOAL : "#9CA3AF"} // charcoal when active, soft gray inactive
        fill={focused ? CHARCOAL : "none"} // makes icon filled when focused
        strokeWidth={focused ? 0 : 2}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            bottom: 20,
            alignContent: "center",
            alignSelf: "center",
            width: "90%",
            transform: [{ translateX: "5%" }],
            height: 60,
            backgroundColor: CHARCOAL,
            borderRadius: 15,
            paddingHorizontal: 16,
            paddingTop: 12,
            elevation: 15,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 15,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={Home} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={CalendarDays} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="academics"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={BookOpen} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={Bell} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={User} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
