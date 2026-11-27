"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DataLabSeries } from "@/lib/types";

const SERIES_COLORS = [
  "#E9501F", // PTKOREA Orange (OWN)
  "#111111", // Deep Black (COMPETITOR 1)
  "#666666", // Neutral Charcoal (COMPETITOR 2)
  "#999999", // Muted Gray (COMPETITOR 3)
  "#3A3A3A", // Industry
];

function pickSeriesColor(series: DataLabSeries, idx: number): string {
  if (series.owner_type === "OWN") return "#E9501F";
  if (series.owner_type === "INDUSTRY") return "#3A3A3A";
  return SERIES_COLORS[(idx % (SERIES_COLORS.length - 1)) + 1] ?? "#666666";
}

function filterSeriesByMetric(
  seriesList: DataLabSeries[],
  metricType: "SEARCH_TREND" | "SHOPPING_INSIGHT" | "ALL" = "SEARCH_TREND"
): DataLabSeries[] {
  if (metricType === "ALL") return seriesList;
  const filtered = seriesList.filter((s) => s.metric_type === metricType);
  return filtered.length > 0 ? filtered : seriesList;
}

export function DataLabTrendChart({
  seriesList,
  compact = false,
  metricType = "SEARCH_TREND",
}: {
  seriesList: DataLabSeries[];
  compact?: boolean;
  metricType?: "SEARCH_TREND" | "SHOPPING_INSIGHT" | "ALL";
}) {
  const activeSeries = filterSeriesByMetric(seriesList, metricType);
  if (activeSeries.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[8px] border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-xs text-[#8C8C8C]">
        수집된 데이터랩 시계열 데이터가 없습니다.
      </div>
    );
  }

  const periods = Array.from(
    new Set(activeSeries.flatMap((s) => s.points.map((p) => p.period)))
  ).sort();

  const chartData = periods.map((period) => {
    const row: Record<string, string | number> = {
      period: period.slice(5),
      fullPeriod: period,
    };
    activeSeries.forEach((s) => {
      const pt = s.points.find((p) => p.period === period);
      if (pt) {
        row[s.id] = pt.ratio;
      }
    });
    return row;
  });

  return (
    <div className={compact ? "h-44 w-full" : "h-64 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 12, left: -16, bottom: 2 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: "#8C8C8C" }}
            axisLine={{ stroke: "#E5E5E5" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#8C8C8C" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D4D4D4",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(17,17,17,0.08)",
            }}
            labelFormatter={(label) => `주차: ${String(label)}`}
            formatter={(value, name) => [`${Number(value ?? 0).toFixed(1)} (상대지수)`, String(name ?? "")]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
            iconType="circle"
            iconSize={8}
          />
          {activeSeries.map((series, idx) => (
            <Line
              key={series.id}
              type="monotone"
              dataKey={series.id}
              name={
                metricType === "ALL"
                  ? `${series.group_label} (${series.metric_type === "SHOPPING_INSIGHT" ? "쇼핑" : "검색"})`
                  : series.group_label
              }
              stroke={pickSeriesColor(series, idx)}
              strokeWidth={series.owner_type === "OWN" ? 2.4 : 1.75}
              dot={compact ? false : { r: 2.5 }}
              activeDot={{ r: 4.5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DataLabSosBarChart({
  seriesList,
  compact = false,
  metricType = "SEARCH_TREND",
}: {
  seriesList: DataLabSeries[];
  compact?: boolean;
  metricType?: "SEARCH_TREND" | "SHOPPING_INSIGHT" | "ALL";
}) {
  if (metricType === "ALL") {
    const searchMap = new Map(
      seriesList
        .filter((s) => s.metric_type === "SEARCH_TREND")
        .map((s) => [s.group_label, s])
    );
    const shoppingMap = new Map(
      seriesList
        .filter((s) => s.metric_type === "SHOPPING_INSIGHT")
        .map((s) => [s.group_label, s])
    );
    const labels = Array.from(
      new Set([
        ...seriesList.filter((s) => s.metric_type === "SEARCH_TREND").map((s) => s.group_label),
        ...seriesList.filter((s) => s.metric_type === "SHOPPING_INSIGHT").map((s) => s.group_label),
      ])
    );
    if (labels.length === 0) {
      return (
        <div className="flex h-44 items-center justify-center rounded-[8px] border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-xs text-[#8C8C8C]">
          검색 점유율 데이터가 없습니다.
        </div>
      );
    }
    const groupedData = labels.map((label) => ({
      name: label,
      searchSos: searchMap.get(label)?.share_of_search_pct ?? 0,
      shoppingSos: shoppingMap.get(label)?.share_of_search_pct ?? 0,
    }));
    return (
      <div className={compact ? "h-48 w-full" : "h-64 w-full"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={groupedData}
            layout="vertical"
            margin={{ top: 6, right: 24, left: 10, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#8C8C8C" }}
              unit="%"
              axisLine={{ stroke: "#E5E5E5" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={118}
              tick={{ fontSize: 11, fill: "#111111", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#D4D4D4",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value, name) => [
                `${Number(value ?? 0).toFixed(1)}%`,
                String(name ?? ""),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
              iconType="square"
              iconSize={8}
            />
            <Bar
              dataKey="searchSos"
              name="통합검색 SoS (%)"
              fill="#111111"
              radius={[0, 4, 4, 0]}
              barSize={compact ? 9 : 11}
            />
            <Bar
              dataKey="shoppingSos"
              name="쇼핑 클릭 점유율 (%)"
              fill="#E9501F"
              radius={[0, 4, 4, 0]}
              barSize={compact ? 9 : 11}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const activeSeries = filterSeriesByMetric(seriesList, metricType);
  if (activeSeries.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[8px] border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-xs text-[#8C8C8C]">
        검색 점유율 데이터가 없습니다.
      </div>
    );
  }

  const barData = activeSeries.map((s, idx) => ({
    id: s.id,
    name: s.group_label,
    sos: s.share_of_search_pct,
    growth: s.growth_rate_pct,
    color: pickSeriesColor(s, idx),
  }));

  return (
    <div className={compact ? "h-44 w-full" : "h-64 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          layout="vertical"
          margin={{ top: 6, right: 24, left: 10, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#8C8C8C" }}
            unit="%"
            axisLine={{ stroke: "#E5E5E5" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tick={{ fontSize: 11, fill: "#111111", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D4D4D4",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [
              `${Number(value ?? 0).toFixed(1)}%`,
              metricType === "SHOPPING_INSIGHT" ? "쇼핑 클릭 점유율" : "검색 점유율(SoS)",
            ]}
          />
          <Bar dataKey="sos" radius={[0, 6, 6, 0]} barSize={compact ? 18 : 22}>
            {barData.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VocSentimentChart({
  positive = 60,
  negative = 22,
  neutral = 18,
  compact = false,
}: {
  positive?: number;
  negative?: number;
  neutral?: number;
  compact?: boolean;
}) {
  const total = Math.max(1, positive + negative + neutral);
  const posPct = Math.round((positive / total) * 1000) / 10;
  const negPct = Math.round((negative / total) * 1000) / 10;
  const neuPct = Math.round((neutral / total) * 1000) / 10;
  const data = [
    { label: "긍정", pct: posPct, count: positive, color: "#1F8A5B" },
    { label: "부정 · 아쉬움", pct: negPct, count: negative, color: "#DC2626" },
    { label: "중립 · 비교", pct: neuPct, count: neutral, color: "#8C8C8C" },
  ];

  return (
    <div className={compact ? "h-40 w-full" : "h-52 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 6, right: 24, left: 6, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 10, fill: "#8C8C8C" }}
            axisLine={{ stroke: "#E5E5E5" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={88}
            tick={{ fontSize: 11, fill: "#111111", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D4D4D4",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`${Number(value ?? 0)}%`, "비중"]}
          />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalDataBarChart({
  items,
  unit = "",
}: {
  items: Array<{ label: string; value: number; highlight?: boolean }>;
  unit?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-xs text-[#8C8C8C]">
        수집된 비교 수치 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 4, right: 28, left: 10, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#8C8C8C" }}
            unit={unit && unit.length <= 4 ? unit : ""}
            axisLine={{ stroke: "#E5E5E5" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fontSize: 11, fill: "#111111", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D4D4D4",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [
              `${Number(value ?? 0).toLocaleString()}${unit ? ` ${unit}` : ""}`,
              "수치",
            ]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
            {items.map((entry, idx) => (
              <Cell
                key={`${entry.label}-${idx}`}
                fill={entry.highlight ? "#E9501F" : "#111111"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceDiscountChart({
  items,
  unit = "만원",
}: {
  items: Array<{
    label: string;
    list_price: number;
    sale_price: number;
    discount_pct?: number;
  }>;
  unit?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[8px] border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-[12px] text-[#8C8C8C]">
        수집된 정가·할인가 비교 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 6, right: 24, left: 10, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#4A4A4A" }}
            unit={unit}
            axisLine={{ stroke: "#E5E5E5" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={112}
            tick={{ fontSize: 12, fill: "#111111", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D4D4D4",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(val, name) => [
              `${Number(val ?? 0).toLocaleString()} ${unit}`,
              name === "list_price" ? "공식 정가" : "실판매/할인가",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(val) => (val === "list_price" ? "공식 정가" : "실판매/할인가")}
          />
          <Bar dataKey="list_price" fill="#D4D4D4" radius={[0, 4, 4, 0]} barSize={10} />
          <Bar dataKey="sale_price" fill="#E9501F" radius={[0, 4, 4, 0]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PressMonthlyChart({
  items,
}: {
  items: Array<{ label: string; value: number; highlight?: boolean }>;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[8px] border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-[12px] text-[#8C8C8C]">
        집계된 월별 언론 보도 데이터가 없습니다.
      </div>
    );
  }
  const peakVal = Math.max(...items.map((i) => Number(i.value || 0)), 0);

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 8, right: 16, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#4A4A4A" }}
            axisLine={{ stroke: "#E5E5E5" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#4A4A4A" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D4D4D4",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`${Number(value ?? 0)}건`, "언론 보도량"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={26}>
            {items.map((entry, idx) => (
              <Cell
                key={`${entry.label}-${idx}`}
                fill={entry.value === peakVal && peakVal > 0 ? "#E9501F" : "#111111"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PressBrandCompareChart({
  items,
}: {
  items: Array<{ label: string; value: number; highlight?: boolean }>;
}) {
  return <HorizontalDataBarChart items={items} unit="건" />;
}

export function MarketingHeatmapChart({
  brands,
  rows,
}: {
  brands: string[];
  rows: Array<{
    axis: string;
    scores: Array<{ brand: string; score: number }>;
  }>;
}) {
  if (!rows || rows.length === 0 || !brands || brands.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[8px] border border-dashed border-[#D4D4D4] bg-[#FAFAFA] text-[12px] text-[#8C8C8C]">
        마케팅 활동 강도 히트맵 데이터가 없습니다.
      </div>
    );
  }

  const scoreStyle = (score: number): { bg: string; text: string; label: string } => {
    if (score >= 5) return { bg: "#E9501F", text: "#FFFFFF", label: "5 · 최상" };
    if (score === 4) return { bg: "#F48A66", text: "#111111", label: "4 · 높음" };
    if (score === 3) return { bg: "#111111", text: "#FFFFFF", label: "3 · 보통" };
    if (score === 2) return { bg: "#E5E5E5", text: "#111111", label: "2 · 제한" };
    return { bg: "#FAFAFA", text: "#8C8C8C", label: "1 · 미미" };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-[#E5E5E5]">
            <th className="py-2 pr-3 text-left font-bold text-[#111111]">마케팅 6분류</th>
            {brands.map((b) => (
              <th key={b} className="px-2 py-2 text-center font-bold text-[#111111]">
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E5E5]">
          {rows.map((row) => (
            <tr key={row.axis}>
              <td className="py-2 pr-3 font-semibold text-[#111111] whitespace-nowrap">
                {row.axis}
              </td>
              {brands.map((b, idx) => {
                const matched = row.scores.find((s) => s.brand === b) ?? row.scores[idx];
                const sc = Number(matched?.score ?? 1);
                const st = scoreStyle(sc);
                return (
                  <td key={`${row.axis}-${b}`} className="p-1.5 text-center">
                    <div
                      className="mx-auto flex h-7 min-w-[74px] items-center justify-center rounded-[6px] border border-[#E5E5E5] px-2 font-bold tabular-nums"
                      style={{ backgroundColor: st.bg, color: st.text }}
                    >
                      {st.label}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
