'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Box, HStack } from '@chakra-ui/react';
// Import components directly from Mukuru package
import { Typography } from '@mukuru/mukuru-react-components';
// Color mode - always light mode
const useColorModeValue = <T,>(light: T, _dark: T): T => light;

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  const isActive = active as boolean;
  const payloadArray = Array.isArray(payload) ? payload : [];
  const labelStr = String(label || '');
  const tooltipBg = useColorModeValue('mukuru.cards.white', 'mukuru.cards.dark');
  const tooltipBorder = useColorModeValue('mukuru.grey.light', 'mukuru.grey.500');

  if (isActive && payloadArray.length > 0) {
    return (
      <Box
        bg={tooltipBg}
        p="3"
        borderRadius="md"
        boxShadow="lg"
        border="1px"
        borderColor={tooltipBorder}
      >
        <Typography fontSize="sm" fontWeight="medium" color="mukuru.text.primary">
          {labelStr}
        </Typography>
        {payloadArray.map((entry: Record<string, unknown>, index: number) => {
          const entryColor = String(entry.color || '#000');
          const entryName = String(entry.name || '');
          const entryValue = String(entry.value || '');
          return (
            <Typography key={index} fontSize="sm" color={entryColor}>
              {entryName}: {entryValue}
            </Typography>
          );
        })}
      </Box>
    );
  }
  return null;
};

// Entity Type Distribution Chart
export const EntityTypeChart = ({
  data,
  height = 300,
}: {
  data: Array<{ type: string; count: number }>;
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box
      width="100%"
      height={`${height}px`}
      minWidth="300px"
      minHeight={`${height}px`}
      style={{ position: 'relative', minWidth: '300px', minHeight: `${height}px` }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="type"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#e0e0e0' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            fill="#dd6b20"
            radius={[4, 4, 0, 0]}
            stroke="#dd6b20"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Application Trends Chart
export const ApplicationTrendsChart = ({
  data,
}: {
  data: Array<{ date: string; applications: number; completed: number }>;
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box
      width="100%"
      height="300px"
      minWidth="300px"
      minHeight="300px"
      style={{ position: 'relative', minWidth: '300px', minHeight: '300px' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dd6b20" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#dd6b20" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38a169" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38a169" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#e0e0e0' }} />
          <Tooltip
            content={<CustomTooltip />}
            labelFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            }
          />
          <Area
            type="monotone"
            dataKey="applications"
            stroke="#dd6b20"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorApplications)"
            name="Applications"
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#38a169"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCompleted)"
            name="Completed"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Processing Time Distribution Chart
export const ProcessingTimeChart = ({
  data,
}: {
  data: Array<{ range: string; count: number }>;
}) => {
  return (
    <Box
      width="100%"
      height="250px"
      minWidth="300px"
      minHeight="250px"
      style={{ position: 'relative', minWidth: '300px', minHeight: '250px' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#e0e0e0' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            fill="#dd6b20"
            radius={[4, 4, 0, 0]}
            stroke="#dd6b20"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Status Distribution Pie Chart
export const StatusPieChart = ({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box
      width="100%"
      height="300px"
      minWidth="300px"
      minHeight="300px"
      style={{ position: 'relative', minWidth: '300px', minHeight: '300px' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: Record<string, unknown>) => {
              const name = String(props.name || '');
              const percent = typeof props.percent === 'number' ? props.percent : 0;
              return `${name} ${(percent * 100).toFixed(0)}%`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Simple Line Chart for Trends
export const SimpleLineChart = ({
  data,
}: {
  data: Array<{ date: string; value: number }>;
}) => {
  return (
    <Box
      width="100%"
      height="200px"
      minWidth="300px"
      minHeight="200px"
      style={{ position: 'relative', minWidth: '300px', minHeight: '200px' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#e0e0e0' }} />
          <Tooltip
            content={<CustomTooltip />}
            labelFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#dd6b20"
            strokeWidth={3}
            dot={{ fill: '#dd6b20', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#dd6b20', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Chart Legend Component
export const ChartLegend = ({
  items,
}: {
  items: Array<{ name: string; color: string }>;
}) => {
  return (
    <HStack gap="6" justify="center" mt="4">
      {items.map((item, index) => (
        <HStack key={index} gap="2">
          <Box width="12px" height="12px" bg={item.color} borderRadius="sm" />
          <Typography fontSize="sm" color="mukuru.text.primary">
            {item.name}
          </Typography>
        </HStack>
      ))}
    </HStack>
  );
};
