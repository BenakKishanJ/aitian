import { Button } from "../ui/button";
import { VStack } from "../ui/vstack";
import { Text } from "../ui/text";
import { seedFirestore } from "@/lib/firestoreSeed";
import { useState } from "react";

export function FirestoreSeeder() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSeed() {
    setLoading(true);
    try {
      await seedFirestore();
      setDone(true);
      alert("Firestore seeded successfully 🚀");
    } catch (err) {
      console.error(err);
      alert("Seeding failed ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack space="md">
      <Text size="sm" className="text-gray-500">
        DEV ONLY – Seed Firestore
      </Text>

      <Button
        action="secondary"
        isDisabled={loading || done}
        onPress={handleSeed}
      >
        <Text>
          {loading ? "Seeding..." : done ? "Seeded ✔" : "Seed Firestore"}
        </Text>
      </Button>
    </VStack>
  );
}
