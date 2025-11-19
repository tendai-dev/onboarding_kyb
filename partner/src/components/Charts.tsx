"use client";

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
  Cell
} from 'recharts';
import { Box, Text, VStack, HStack } from "@chakra-ui/react";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box 
        bg="white" 
        p="3" 
        borderRadius="md" 
        boxShadow="lg" 
        border="1px" 
        borderColor="gray.200"
      >
        <Text fontSize="sm" fontWeight="medium" color="gray.800">
          {label}
        </Text>
        {payload.map((entry: any, index: number) => (
          <Text key={index} fontSize="sm" color={entry.color}>
            {entry.name}: {entry.value}
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

// Entity Type Distribution Chart
export const EntityTypeChart = ({ data, height = 300 }: { data: Array<{ type: string; count: number }>; height?: number }) => {
  const COLORS = ['#dd6b20', '#38a169', '#3182ce', '#805ad5', '#e53e3e'];
  
  return (
    <Box width="100%" height={`${height}px`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="type" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
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
export const ApplicationTrendsChart = ({ data }: { data: Array<{ date: string; applications: number; completed: number }> }) => {
  return (
    <Box width="100%" height="300px">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dd6b20" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#dd6b20" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38a169" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#38a169" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
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
export const ProcessingTimeChart = ({ data }: { data: Array<{ range: string; count: number }> }) => {
  return (
    <Box width="100%" height="250px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="range" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
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
export const StatusPieChart = ({ data }: { data: Array<{ name: string; value: number; color: string }> }) => {
  return (
    <Box width="100%" height="300px">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
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
export const SimpleLineChart = ({ data }: { data: Array<{ date: string; value: number }> }) => {
  return (
    <Box width="100%" height="200px">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric'
            })}
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
export const ChartLegend = ({ items }: { items: Array<{ name: string; color: string }> }) => {
  return (
    <HStack gap="6" justify="center" mt="4">
      {items.map((item, index) => (
        <HStack key={index} gap="2">
          <Box width="12px" height="12px" bg={item.color} borderRadius="sm" />
          <Text fontSize="sm" color="gray.600">{item.name}</Text>
        </HStack>
      ))}
    </HStack>
  );
};
