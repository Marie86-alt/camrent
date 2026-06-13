import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { formatInputDate, parseHumanDate } from '../utils/dates';

type DatePickerFieldProps = {
  label: string;
  maximumDate?: Date;
  minimumDate?: Date;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function DatePickerField({
  label,
  maximumDate,
  minimumDate,
  onChange,
  placeholder = 'JJ/MM/AAAA',
  value,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const pickerValue = useMemo(() => {
    const parsed = parseHumanDate(value);
    return parsed ?? minimumDate ?? maximumDate ?? new Date();
  }, [maximumDate, minimumDate, value]);

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }

    if (selectedDate) {
      const normalized = new Date(selectedDate);
      normalized.setHours(0, 0, 0, 0);
      onChange(formatInputDate(normalized));
    }

    setOpen(false);
  };

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        className="h-12 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4"
        onPress={() => setOpen(true)}
      >
        <Text className={`text-base ${value ? 'text-slate-950' : 'text-slate-400'}`}>
          {value || placeholder}
        </Text>
        <Ionicons color="#94a3b8" name="calendar-outline" size={20} />
      </TouchableOpacity>

      {open ? (
        <DateTimePicker
          display="calendar"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          mode="date"
          onChange={onPickerChange}
          value={pickerValue}
        />
      ) : null}
    </View>
  );
}
