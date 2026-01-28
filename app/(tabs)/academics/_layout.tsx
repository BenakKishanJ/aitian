import { Stack } from "expo-router";
import { useAuth } from "@/lib/AuthContext";

export default function AcademicsLayout() {
  const { role } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1C1C1E",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: "#F5F5F5",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Academics",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[courseInstanceId]/index"
        options={{
          title: "Course Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[courseInstanceId]/materials"
        options={{
          title: "Study Materials",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[courseInstanceId]/assignments"
        options={{
          title: "Assignments",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[courseInstanceId]/discussions"
        options={{
          title: "Discussion Forum",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[courseInstanceId]/marks"
        options={{
          title: "Marks & Results",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[courseInstanceId]/attendance"
        options={{
          title: "Attendance",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
