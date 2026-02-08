import React from 'react';
import { View } from 'react-native';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { GradingConfig as GradingConfigType } from '@/types';

interface GradingConfigPanelProps {
  config: GradingConfigType;
  onConfigChange: (config: GradingConfigType) => void;
  readOnly?: boolean;
}

export function GradingConfigPanel({
  config,
  onConfigChange,
  readOnly = false,
}: GradingConfigPanelProps) {
  const toggleComponent = (key: keyof GradingConfigType) => {
    if (readOnly) return;
    
    const newConfig = { ...config, [key]: !config[key] };
    onConfigChange(newConfig);
  };

  const updateMaxMarks = (key: keyof GradingConfigType, value: string) => {
    if (readOnly) return;
    
    const numValue = parseInt(value) || 0;
    const newConfig = { ...config, [key]: numValue };
    onConfigChange(newConfig);
  };

  const ConfigItem = ({
    label,
    enabledKey,
    maxMarksKey,
    isOptional = false,
  }: {
    label: string;
    enabledKey: keyof GradingConfigType;
    maxMarksKey: keyof GradingConfigType;
    isOptional?: boolean;
  }) => (
    <View className="p-4 bg-gray-50 rounded-xl">
      <HStack className="justify-between items-center mb-3">
        <VStack>
          <Text className="font-semibold text-black">{label}</Text>
          <Text className="text-xs text-gray-500">
            {isOptional ? 'Optional component' : 'Required component'}
          </Text>
        </VStack>
        {isOptional && (
          <Switch
            value={config[enabledKey] as boolean}
            onValueChange={() => toggleComponent(enabledKey)}
            disabled={readOnly}
          />
        )}
      </HStack>

      {(config[enabledKey] as boolean) && (
        <HStack className="items-center gap-2">
          <Text className="text-sm text-gray-600">Max Marks:</Text>
          <Input className="w-20">
            <InputField
              value={(config[maxMarksKey] as number).toString()}
              onChangeText={(text) => updateMaxMarks(maxMarksKey, text)}
              keyboardType="numeric"
              editable={!readOnly}
            />
          </Input>
        </HStack>
      )}
    </View>
  );

  return (
    <VStack space="md">
      <Text className="text-lg font-bold text-black">Grading Configuration</Text>
      <Text className="text-sm text-gray-600">
        Configure which components to include in grading and their maximum marks.
      </Text>

      <ConfigItem
        label="CIE 1 (Continuous Internal Evaluation 1)"
        enabledKey="cie1Enabled"
        maxMarksKey="cie1MaxMarks"
      />

      <ConfigItem
        label="CIE 2 (Continuous Internal Evaluation 2)"
        enabledKey="cie2Enabled"
        maxMarksKey="cie2MaxMarks"
      />

      <ConfigItem
        label="SEE (Semester End Examination)"
        enabledKey="seeEnabled"
        maxMarksKey="seeMaxMarks"
      />

      <ConfigItem
        label="Assignment"
        enabledKey="assignmentEnabled"
        maxMarksKey="assignmentMaxMarks"
        isOptional
      />

      <ConfigItem
        label="Group Activity"
        enabledKey="groupActivityEnabled"
        maxMarksKey="groupActivityMaxMarks"
        isOptional
      />
    </VStack>
  );
}

export default GradingConfigPanel;
