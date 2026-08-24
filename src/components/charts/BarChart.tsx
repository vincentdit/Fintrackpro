import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../Text';

export interface BarGroup {
  label: string;
  income: number;
  expense: number;
}

/** Grouped income/expense bar chart in pure react-native-svg. */
export function BarChart({
  data,
  height = 180,
}: {
  data: BarGroup[];
  height?: number;
}) {
  const theme = useTheme();
  const chartWidth = 320;
  const paddingBottom = 22;
  const paddingTop = 8;
  const plotHeight = height - paddingBottom - paddingTop;
  const max =
    Math.max(1, ...data.flatMap((d) => [d.income, d.expense])) * 1.1;

  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(14, groupWidth / 3.2);

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        {data.map((d, i) => {
          const cx = i * groupWidth + groupWidth / 2;
          const incomeH = (d.income / max) * plotHeight;
          const expenseH = (d.expense / max) * plotHeight;
          return (
            <React.Fragment key={d.label}>
              <Rect
                x={cx - barWidth - 1}
                y={paddingTop + (plotHeight - incomeH)}
                width={barWidth}
                height={incomeH}
                rx={3}
                fill={theme.colors.income}
              />
              <Rect
                x={cx + 1}
                y={paddingTop + (plotHeight - expenseH)}
                width={barWidth}
                height={expenseH}
                rx={3}
                fill={theme.colors.expense}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: -18 }}>
        {data.map((d) => (
          <Text key={d.label} variant="small" tone="muted" style={{ width: chartWidth / data.length, textAlign: 'center' }}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
