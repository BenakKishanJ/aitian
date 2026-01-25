import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { ScrollView } from "react-native";
import { FirestoreSeeder } from "@/components/dev/FirestoreSeeder";

export default function HomeScreen() {
  return (
    <ScrollView>
      <Text className="text-2xl font-semibold text-black">Home Screen</Text>
      {/* REMOVE THIS BEFORE PRODUCTION */}
      <FirestoreSeeder />

      {/* Your real home content below */}
    </ScrollView>
  );
}
