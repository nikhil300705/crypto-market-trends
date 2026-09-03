"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Activity,
  BarChart3,
  Bitcoin,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Coins,
  Database,
  Gauge,
  LineChart as LineChartIcon,
  Menu,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CryptoRow = {
  SNo: string;
  Name: string;
  Symbol: string;
  Date: string;
  High: number;
  Low: number;
  Open: number;
  Close: number;
  Volume: number;
  Marketcap: number;
};

type CoinInfo = {
  name: string;
  symbol: string;
  file: string;
};

const COINS: CoinInfo[] = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    file: "coin_Bitcoin.csv",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    file: "coin_Ethereum.csv",
  },
  {
    name: "Binance Coin",
    symbol: "BNB",
    file: "coin_BinanceCoin.csv",
  },
  {
    name: "XRP",
    symbol: "XRP",
    file: "coin_XRP.csv",
  },
  {
    name: "Dogecoin",
    symbol: "DOGE",
    file: "coin_Dogecoin.csv",
  },
  {
    name: "Stellar",
    symbol: "XLM",
    file: "coin_Stellar.csv",
  },
  {
    name: "NEM",
    symbol: "XEM",
    file: "coin_NEM.csv",
  },
];

const COIN_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  BNB: "◆",
  XRP: "✕",
  DOGE: "Ð",
  XLM: "✦",
  XEM: "N",
};

function parseNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";

  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";

  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  }

  if (value >= 1) {
    return `$${value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  if (value >= 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toFixed(8)}`;
}

function formatDate(date: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDate(date: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function percentChange(first: number, last: number): number {
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

function getYear(date: string): number {
  const parsed = new Date(date);
  return parsed.getFullYear();
}

export default function Page() {
  const [data, setData] = useState<CryptoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCoin, setSelectedCoin] = useState("Bitcoin");
  const [selectedYear, setSelectedYear] = useState("All years");
  const [activeTab, setActiveTab] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const allRows: CryptoRow[] = [];

        for (const coin of COINS) {
          const response = await fetch(`/data/${coin.file}`);

          if (!response.ok) {
            throw new Error(`Unable to load ${coin.file}`);
          }

          const text = await response.text();

          const result = Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
          });

          for (const row of result.data) {
            allRows.push({
              SNo: row.SNo || "",
              Name: row.Name || coin.name,
              Symbol: row.Symbol || coin.symbol,
              Date: row.Date || "",
              High: parseNumber(row.High),
              Low: parseNumber(row.Low),
              Open: parseNumber(row.Open),
              Close: parseNumber(row.Close),
              Volume: parseNumber(row.Volume),
              Marketcap: parseNumber(row.Marketcap),
            });
          }
        }

        allRows.sort(
          (a, b) =>
            new Date(a.Date).getTime() - new Date(b.Date).getTime()
        );

        setData(allRows);
        setError("");
      } catch (err) {
        console.error(err);
        setError(
          "The cryptocurrency data could not be loaded. Please check the CSV files in public/data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(data.map((row) => getYear(row.Date)))
    ).filter((year) => year > 1900);

    return years.sort((a, b) => b - a);
  }, [data]);

  const coinRows = useMemo(() => {
    let rows = data.filter((row) => row.Name === selectedCoin);

    if (selectedYear !== "All years") {
      rows = rows.filter(
        (row) => String(getYear(row.Date)) === selectedYear
      );
    }

    return rows;
  }, [data, selectedCoin, selectedYear]);

  const selectedCoinInfo = useMemo(
    () => COINS.find((coin) => coin.name === selectedCoin) || COINS[0],
    [selectedCoin]
  );

  const latestRow = coinRows[coinRows.length - 1];
  const firstRow = coinRows[0];

  const kpis = useMemo(() => {
    if (!coinRows.length) {
      return {
        close: 0,
        change: 0,
        high: 0,
        low: 0,
        volume: 0,
        marketcap: 0,
      };
    }

    const closeValues = coinRows.map((row) => row.Close);

    return {
      close: latestRow?.Close || 0,
      change: percentChange(
        firstRow?.Close || 0,
        latestRow?.Close || 0
      ),
      high: Math.max(...coinRows.map((row) => row.High)),
      low: Math.min(...coinRows.map((row) => row.Low)),
      volume: coinRows.reduce((sum, row) => sum + row.Volume, 0),
      marketcap: latestRow?.Marketcap || 0,
      averageClose:
        closeValues.reduce((sum, value) => sum + value, 0) /
        closeValues.length,
    };
  }, [coinRows, firstRow, latestRow]);

  const chartData = useMemo(() => {
    const maxPoints = 220;

    if (coinRows.length <= maxPoints) {
      return coinRows.map((row) => ({
        date: shortDate(row.Date),
        fullDate: row.Date,
        high: row.High,
        low: row.Low,
        open: row.Open,
        close: row.Close,
        volume: row.Volume,
        marketcap: row.Marketcap,
      }));
    }

    const step = Math.ceil(coinRows.length / maxPoints);

    return coinRows
      .filter((_, index) => index % step === 0)
      .map((row) => ({
        date: shortDate(row.Date),
        fullDate: row.Date,
        high: row.High,
        low: row.Low,
        open: row.Open,
        close: row.Close,
        volume: row.Volume,
        marketcap: row.Marketcap,
      }));
  }, [coinRows]);

  const yearlyComparison = useMemo(() => {
    const map = new Map<
      number,
      {
        year: number;
        close: number;
        high: number;
        low: number;
        volume: number;
        marketcap: number;
      }
    >();

    data
      .filter((row) => row.Name === selectedCoin)
      .forEach((row) => {
        const year = getYear(row.Date);

        if (!map.has(year)) {
          map.set(year, {
            year,
            close: row.Close,
            high: row.High,
            low: row.Low,
            volume: row.Volume,
            marketcap: row.Marketcap,
          });
        } else {
          const existing = map.get(year)!;

          existing.close = row.Close;
          existing.high = Math.max(existing.high, row.High);
          existing.low = Math.min(existing.low, row.Low);
          existing.volume += row.Volume;
          existing.marketcap = row.Marketcap;
        }
      });

    return Array.from(map.values())
      .sort((a, b) => a.year - b.year)
      .map((row) => ({
        ...row,
        label: String(row.year),
      }));
  }, [data, selectedCoin]);

  const marketComparison = useMemo(() => {
    return COINS.map((coin) => {
      const rows = data.filter((row) => row.Name === coin.name);

      if (!rows.length) {
        return {
          name: coin.name,
          symbol: coin.symbol,
          close: 0,
          marketcap: 0,
          volume: 0,
          change: 0,
        };
      }

      const first = rows[0];
      const last = rows[rows.length - 1];

      return {
        name: coin.name,
        symbol: coin.symbol,
        close: last.Close,
        marketcap: last.Marketcap,
        volume: rows.reduce((sum, row) => sum + row.Volume, 0),
        change: percentChange(first.Close, last.Close),
      };
    });
  }, [data]);

  const positive = kpis.change >= 0;

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-icon">
            <Activity size={26} />
          </div>
          <h2>Loading Crypto Market Trends</h2>
          <p>Preparing the cryptocurrency dataset...</p>
          <div className="loading-bar">
            <div />
          </div>
        </div>

        <style jsx global>{GLOBAL_CSS}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-page">
        <div className="loading-card error-card">
          <div className="loading-icon error-icon">
            <X size={26} />
          </div>
          <h2>Data loading error</h2>
          <p>{error}</p>
        </div>

        <style jsx global>{GLOBAL_CSS}</style>
      </div>
    );
  }

  return (
    <main className="dashboard">
      <header className="top-header">
        <div className="brand">
          <div className="brand-icon">
            <Coins size={23} />
          </div>

          <div>
            <h1>Crypto Market Trends</h1>
            <p>
              Cryptocurrency price, volume & market-cap analytics
            </p>
          </div>
        </div>

        <div className="header-meta">
          <div className="live-status">
            <span />
            Live dataset
          </div>

          <div>{COINS.length} cryptocurrencies</div>
          <div>{data.length.toLocaleString()} market records</div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">DIGITAL ASSET ANALYTICS</span>

          <h2>
            Understand crypto
            <br />
            market performance
            <br />
            across time.
          </h2>

          <p>
            Explore historical price movements, trading volume,
            market capitalization and performance across seven major
            cryptocurrencies.
          </p>
        </div>

        <div className="hero-card">
          <span>Selected asset</span>

          <strong>
            {COIN_ICONS[selectedCoinInfo.symbol] || "●"}{" "}
            {selectedCoinInfo.symbol}
          </strong>

          <small>
            {selectedCoin}
            {selectedYear !== "All years"
              ? ` • ${selectedYear}`
              : ""}
          </small>
        </div>
      </section>

      <section className="filters">
        <div className="filter-title">
          <Activity size={18} />
          <div>
            <strong>Dashboard filters</strong>
            <span>Change the analysis context</span>
          </div>
        </div>

        <div className="filter-control">
          <label>Cryptocurrency</label>

          <div className="select-wrap">
            <select
              value={selectedCoin}
              onChange={(event) =>
                setSelectedCoin(event.target.value)
              }
            >
              {COINS.map((coin) => (
                <option key={coin.name} value={coin.name}>
                  {coin.symbol} — {coin.name}
                </option>
              ))}
            </select>

            <ChevronDown size={16} />
          </div>
        </div>

        <div className="filter-control">
          <label>Year</label>

          <div className="select-wrap">
            <select
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(event.target.value)
              }
            >
              <option>All years</option>

              {availableYears.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>

            <ChevronDown size={16} />
          </div>
        </div>

        <button
          className="reset-button"
          onClick={() => {
            setSelectedCoin("Bitcoin");
            setSelectedYear("All years");
          }}
        >
          <RefreshCw size={15} />
          Reset
        </button>
      </section>

      <nav className="tabs">
        {[
          {
            name: "Overview",
            icon: <BarChart3 size={16} />,
          },
          {
            name: "Price Trends",
            icon: <LineChartIcon size={16} />,
          },
          {
            name: "Market Activity",
            icon: <Activity size={16} />,
          },
          {
            name: "Performance",
            icon: <TrendingUp size={16} />,
          },
        ].map((tab) => (
          <button
            key={tab.name}
            className={activeTab === tab.name ? "active" : ""}
            onClick={() => {
              setActiveTab(tab.name);
              setMobileMenu(false);
            }}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </nav>

      <div className="mobile-menu">
        <button onClick={() => setMobileMenu(!mobileMenu)}>
          <Menu size={18} />
          {activeTab}
          <ChevronDown size={16} />
        </button>

        {mobileMenu && (
          <div className="mobile-options">
            {["Overview", "Price Trends", "Market Activity", "Performance"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileMenu(false);
                  }}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        )}
      </div>

      <section className="kpi-grid">
        <KpiCard
          icon={<CircleDollarSign size={20} />}
          iconClass="blue"
          label="Latest price"
          value={formatPrice(kpis.close)}
          note={latestRow ? formatDate(latestRow.Date) : "No data"}
        />

        <KpiCard
          icon={
            positive ? (
              <TrendingUp size={20} />
            ) : (
              <TrendingDown size={20} />
            )
          }
          iconClass={positive ? "green" : "red"}
          label="Period return"
          value={`${positive ? "+" : ""}${kpis.change.toFixed(2)}%`}
          note="First to latest close"
          valueClass={positive ? "positive" : "negative"}
        />

        <KpiCard
          icon={<Gauge size={20} />}
          iconClass="purple"
          label="Peak price"
          value={formatPrice(kpis.high)}
          note="Highest observed value"
        />

        <KpiCard
          icon={<Wallet size={20} />}
          iconClass="orange"
          label="Market cap"
          value={`$${formatCompact(kpis.marketcap)}`}
          note="Latest available value"
        />
      </section>

      {activeTab === "Overview" && (
        <>
          <section className="chart-grid main-charts">
            <ChartCard
              title="Price movement"
              subtitle={`${selectedCoin} closing price over time`}
              large
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="priceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={65}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      formatPrice(value || 0),
                      "Close",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="close"
                    strokeWidth={2.5}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="High vs low"
              subtitle="Daily trading range"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={65}
                  />

                  <Tooltip
                    formatter={(value: number | undefined, name) => [
                      formatPrice(value || 0),
                      name === "high" ? "High" : "Low",
                    ]}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="high"
                    dot={false}
                    strokeWidth={2}
                    name="High"
                  />

                  <Line
                    type="monotone"
                    dataKey="low"
                    dot={false}
                    strokeWidth={2}
                    name="Low"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="chart-grid">
            <ChartCard
              title="Open vs close"
              subtitle="Opening and closing price comparison"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={65}
                  />

                  <Tooltip
                    formatter={(value: number | undefined, name) => [
                      formatPrice(value || 0),
                      name === "open" ? "Open" : "Close",
                    ]}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="open"
                    dot={false}
                    strokeWidth={2}
                    name="Open"
                  />

                  <Line
                    type="monotone"
                    dataKey="close"
                    dot={false}
                    strokeWidth={2}
                    name="Close"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Trading volume"
              subtitle="Historical daily trading activity"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={65}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      formatCompact(value || 0),
                      "Volume",
                    ]}
                  />

                  <Bar
                    dataKey="volume"
                    name="Volume"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="bottom-grid">
            <InsightCard
              icon={<CalendarDays size={19} />}
              title="Selected period"
              value={
                coinRows.length
                  ? `${formatDate(coinRows[0].Date)} — ${formatDate(
                      coinRows[coinRows.length - 1].Date
                    )}`
                  : "No records"
              }
              text={`${coinRows.length.toLocaleString()} daily market records are included in this view.`}
            />

            <InsightCard
              icon={<Database size={19} />}
              title="Average closing price"
              value={formatPrice(kpis.averageClose)}
              text={`Average close for ${selectedCoin} across the selected period.`}
            />

            <InsightCard
              icon={<BarChart3 size={19} />}
              title="Observed trading range"
              value={`${formatPrice(kpis.low)} – ${formatPrice(kpis.high)}`}
              text="Lowest and highest observed prices in the selected dataset."
            />
          </section>
        </>
      )}

      {activeTab === "Price Trends" && (
        <>
          <section className="section-heading">
            <div>
              <span>HISTORICAL PRICE ANALYSIS</span>
              <h2>{selectedCoin} price trends</h2>
              <p>
                Detailed view of open, close, high and low price
                movements.
              </p>
            </div>
          </section>

          <section className="single-chart">
            <ChartCard
              title="Historical price"
              subtitle={`${selectedCoin} — ${selectedCoinInfo.symbol}`}
              extra="Daily"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={70}
                  />

                  <Tooltip
                    formatter={(value: number | undefined, name) => [
                      formatPrice(value || 0),
                      String(name).toUpperCase(),
                    ]}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="high"
                    dot={false}
                    strokeWidth={1.8}
                    name="High"
                  />

                  <Line
                    type="monotone"
                    dataKey="close"
                    dot={false}
                    strokeWidth={2.6}
                    name="Close"
                  />

                  <Line
                    type="monotone"
                    dataKey="low"
                    dot={false}
                    strokeWidth={1.8}
                    name="Low"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="chart-grid">
            <ChartCard
              title="Yearly closing price"
              subtitle="End-of-year price progression"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyComparison}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={65}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      formatPrice(value || 0),
                      "Close",
                    ]}
                  />

                  <Bar
                    dataKey="close"
                    name="Close"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Market capitalization"
              subtitle="Market-cap evolution"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={70}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `$${formatCompact(value || 0)}`,
                      "Market Cap",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="marketcap"
                    fill="url(#priceGradient)"
                    strokeWidth={2}
                    name="Market Cap"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        </>
      )}

      {activeTab === "Market Activity" && (
        <>
          <section className="section-heading">
            <div>
              <span>MARKET ACTIVITY</span>
              <h2>Trading volume & capitalization</h2>
              <p>
                Understand how market activity changed over the
                selected period.
              </p>
            </div>
          </section>

          <section className="chart-grid main-charts">
            <ChartCard
              title="Trading volume"
              subtitle={`${selectedCoin} daily trading volume`}
              large
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="volumeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={65}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      formatCompact(value || 0),
                      "Volume",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="volume"
                    fill="url(#volumeGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Market cap"
              subtitle="Latest market capitalization"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={70}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `$${formatCompact(value || 0)}`,
                      "Market Cap",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="marketcap"
                    dot={false}
                    strokeWidth={2.3}
                    name="Market Cap"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <h3>Cryptocurrency market comparison</h3>
                <p>
                  Historical performance across all available assets
                </p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Latest price</th>
                    <th>Market cap</th>
                    <th>Total volume</th>
                    <th>Period return</th>
                  </tr>
                </thead>

                <tbody>
                  {marketComparison.map((coin) => (
                    <tr key={coin.symbol}>
                      <td>
                        <div className="asset-cell">
                          <span className="coin-badge">
                            {COIN_ICONS[coin.symbol] || "●"}
                          </span>

                          <div>
                            <strong>{coin.name}</strong>
                            <small>{coin.symbol}</small>
                          </div>
                        </div>
                      </td>

                      <td>{formatPrice(coin.close)}</td>

                      <td>
                        ${formatCompact(coin.marketcap)}
                      </td>

                      <td>
                        {formatCompact(coin.volume)}
                      </td>

                      <td>
                        <span
                          className={
                            coin.change >= 0
                              ? "table-positive"
                              : "table-negative"
                          }
                        >
                          {coin.change >= 0 ? "+" : ""}
                          {coin.change.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "Performance" && (
        <>
          <section className="section-heading">
            <div>
              <span>PERFORMANCE ANALYSIS</span>
              <h2>Crypto performance comparison</h2>
              <p>
                Compare historical returns and current market
                capitalization across the dataset.
              </p>
            </div>
          </section>

          <section className="chart-grid">
            <ChartCard
              title="Period return"
              subtitle="First observed close vs latest close"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marketComparison}
                  layout="vertical"
                  margin={{
                    left: 25,
                    right: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      `${formatCompact(value)}%`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="symbol"
                    tick={{ fontSize: 11 }}
                    width={45}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `${(value || 0).toFixed(2)}%`,
                      "Return",
                    ]}
                  />

                  <Bar
                    dataKey="change"
                    name="Return"
                    radius={[0, 5, 5, 0]}
                  >
                    {marketComparison.map((coin) => (
                      <Cell key={coin.symbol} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Market capitalization"
              subtitle="Latest available market cap by asset"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketComparison}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="symbol"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      formatCompact(value)
                    }
                    width={70}
                  />

                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `$${formatCompact(value || 0)}`,
                      "Market Cap",
                    ]}
                  />

                  <Bar
                    dataKey="marketcap"
                    name="Market Cap"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <h3>Performance leaderboard</h3>
                <p>
                  Ranking of cryptocurrencies using the available
                  historical dataset
                </p>
              </div>
            </div>

            <div className="performance-list">
              {[...marketComparison]
                .sort((a, b) => b.change - a.change)
                .map((coin, index) => (
                  <div className="performance-row" key={coin.symbol}>
                    <span className="rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="coin-badge large-badge">
                      {COIN_ICONS[coin.symbol] || "●"}
                    </span>

                    <div className="performance-name">
                      <strong>{coin.name}</strong>
                      <span>{coin.symbol}</span>
                    </div>

                    <div className="performance-market">
                      <small>Market cap</small>
                      <strong>
                        ${formatCompact(coin.marketcap)}
                      </strong>
                    </div>

                    <div
                      className={
                        coin.change >= 0
                          ? "performance-change positive"
                          : "performance-change negative"
                      }
                    >
                      {coin.change >= 0 ? "+" : ""}
                      {coin.change.toFixed(2)}%
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <div>
          <strong>Crypto Market Trends</strong>
          <span>
            Interactive historical cryptocurrency analytics
          </span>
        </div>

        <div className="footer-right">
          <Database size={15} />
          {data.length.toLocaleString()} records
          <span>•</span>
          {COINS.length} assets
        </div>
      </footer>

      <style jsx global>{GLOBAL_CSS}</style>
    </main>
  );
}

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  note,
  valueClass = "",
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  note: string;
  valueClass?: string;
}) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconClass}`}>{icon}</div>

      <div className="kpi-label">{label}</div>

      <div className={`kpi-value ${valueClass}`}>{value}</div>

      <div className="kpi-note">{note}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  large = false,
  extra,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  large?: boolean;
  extra?: string;
}) {
  return (
    <div className={`chart-card ${large ? "large-chart" : ""}`}>
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        {extra && <span className="chart-extra">{extra}</span>}
      </div>

      <div className="chart-area">{children}</div>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  value,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="insight-card">
      <div className="insight-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

const GLOBAL_CSS = `
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: #f4f6fb;
  color: #111827;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.loading-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 10%, rgba(55, 92, 255, .12), transparent 30%),
    #f4f6fb;
  padding: 24px;
}

.loading-card {
  width: min(440px, 100%);
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(15, 23, 42, .08);
}

.loading-icon {
  width: 58px;
  height: 58px;
  border-radius: 17px;
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  background: #eef2ff;
}

.loading-card h2 {
  margin: 0 0 8px;
  font-size: 21px;
}

.loading-card p {
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.loading-bar {
  height: 5px;
  background: #e5e7eb;
  border-radius: 99px;
  overflow: hidden;
  margin-top: 25px;
}

.loading-bar div {
  height: 100%;
  width: 40%;
  background: #315efb;
  border-radius: inherit;
  animation: loading 1.2s ease-in-out infinite;
}

.error-icon {
  background: #fef2f2;
}

@keyframes loading {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(350%);
  }
}

.dashboard {
  width: 100%;
  max-width: 1540px;
  margin: 0 auto;
  padding: 28px 20px 40px;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: white;
  background: linear-gradient(135deg, #315efb, #694cff);
  box-shadow: 0 9px 22px rgba(49, 94, 251, .25);
}

.brand h1 {
  margin: 0;
  font-size: 20px;
  letter-spacing: -.3px;
}

.brand p {
  margin: 3px 0 0;
  color: #697386;
  font-size: 12px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 22px;
  color: #687286;
  font-size: 12px;
}

.live-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #079669;
  font-weight: 700;
}

.live-status span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #11b982;
  box-shadow: 0 0 0 4px rgba(17, 185, 130, .1);
}

.hero {
  min-height: 305px;
  border-radius: 25px;
  padding: 38px 34px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  color: white;
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(circle at 85% 30%, rgba(119, 98, 255, .7), transparent 30%),
    linear-gradient(115deg, #101d3d 0%, #1e367b 52%, #37328c 100%);
  box-shadow: 0 20px 50px rgba(29, 45, 101, .17);
}

.hero::after {
  content: "";
  position: absolute;
  width: 400px;
  height: 400px;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 50%;
  right: -130px;
  top: -160px;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 790px;
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 1.5px;
  font-weight: 800;
  opacity: .8;
}

.hero h2 {
  margin: 12px 0 15px;
  font-size: clamp(38px, 5vw, 59px);
  line-height: .99;
  letter-spacing: -2.8px;
}

.hero p {
  max-width: 730px;
  margin: 0;
  color: rgba(255,255,255,.82);
  font-size: 14px;
  line-height: 1.7;
}

.hero-card {
  position: relative;
  z-index: 2;
  min-width: 255px;
  padding: 29px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.1);
  backdrop-filter: blur(12px);
}

.hero-card span,
.hero-card small {
  display: block;
  color: rgba(255,255,255,.7);
}

.hero-card span {
  font-size: 12px;
}

.hero-card strong {
  display: block;
  font-size: 31px;
  margin: 13px 0 8px;
}

.hero-card small {
  font-size: 12px;
}

.filters {
  margin: 20px 0;
  padding: 16px 20px;
  background: white;
  border: 1px solid #e4e7ee;
  border-radius: 18px;
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr auto;
  gap: 15px;
  align-items: end;
  box-shadow: 0 5px 20px rgba(15,23,42,.035);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 11px;
  height: 50px;
}

.filter-title > svg {
  color: #315efb;
}

.filter-title strong,
.filter-title span {
  display: block;
}

.filter-title strong {
  font-size: 13px;
}

.filter-title span {
  font-size: 11px;
  color: #8790a1;
  margin-top: 3px;
}

.filter-control label {
  display: block;
  color: #697386;
  font-size: 11px;
  font-weight: 700;
  margin: 0 0 6px;
}

.select-wrap {
  position: relative;
}

.select-wrap select {
  width: 100%;
  height: 43px;
  appearance: none;
  border: 1px solid #e0e4eb;
  background: #f9fafc;
  color: #172033;
  border-radius: 10px;
  padding: 0 35px 0 12px;
  outline: none;
}

.select-wrap svg {
  position: absolute;
  right: 12px;
  top: 14px;
  pointer-events: none;
  color: #7c8493;
}

.reset-button {
  height: 43px;
  border: 0;
  border-radius: 10px;
  padding: 0 16px;
  background: #111827;
  color: white;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
}

.tabs {
  display: flex;
  gap: 5px;
  padding: 5px;
  background: #e9edf6;
  border-radius: 15px;
  margin-bottom: 19px;
}

.tabs button {
  border: 0;
  background: transparent;
  color: #68758c;
  padding: 11px 17px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
}

.tabs button.active {
  background: white;
  color: #2459f5;
  box-shadow: 0 3px 12px rgba(15,23,42,.07);
}

.mobile-menu {
  display: none;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 19px;
}

.kpi-card {
  min-height: 157px;
  padding: 21px;
  background: white;
  border: 1px solid #e4e7ee;
  border-radius: 17px;
  box-shadow: 0 5px 20px rgba(15,23,42,.035);
}

.kpi-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  margin-bottom: 16px;
}

.kpi-icon.blue {
  background: #eef4ff;
}

.kpi-icon.green {
  background: #eafbf5;
}

.kpi-icon.purple {
  background: #f2efff;
}

.kpi-icon.orange {
  background: #fff5e9;
}

.kpi-icon.red {
  background: #fff0f1;
}

.kpi-label {
  font-size: 11px;
  color: #778094;
}

.kpi-value {
  margin-top: 4px;
  font-size: 27px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -.8px;
  color: #111827;
}

.kpi-value.positive {
  color: #079669;
}

.kpi-value.negative {
  color: #dc4455;
}

.kpi-note {
  color: #9aa1af;
  font-size: 10px;
  margin-top: 5px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px;
  margin-bottom: 19px;
}

.main-charts {
  grid-template-columns: 1.65fr 1fr;
}

.chart-card {
  background: white;
  border: 1px solid #e4e7ee;
  border-radius: 17px;
  padding: 20px;
  min-width: 0;
  box-shadow: 0 5px 20px rgba(15,23,42,.035);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 15px;
}

.chart-card-header h3 {
  margin: 0;
  font-size: 14px;
  letter-spacing: -.2px;
}

.chart-card-header p {
  margin: 4px 0 0;
  color: #8b94a4;
  font-size: 10px;
}

.chart-extra {
  height: fit-content;
  border: 1px solid #e4e7ee;
  border-radius: 7px;
  padding: 5px 8px;
  color: #7a8393;
  font-size: 10px;
}

.chart-area {
  height: 270px;
}

.large-chart .chart-area {
  height: 295px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.insight-card {
  background: white;
  border: 1px solid #e4e7ee;
  border-radius: 16px;
  padding: 18px;
  display: flex;
  gap: 12px;
}

.insight-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  background: #f0f4ff;
  color: #315efb;
  border-radius: 10px;
}

.insight-card span,
.insight-card strong {
  display: block;
}

.insight-card span {
  font-size: 10px;
  color: #7e8798;
}

.insight-card strong {
  margin-top: 3px;
  font-size: 15px;
}

.insight-card p {
  color: #939aaa;
  font-size: 10px;
  line-height: 1.5;
  margin: 5px 0 0;
}

.section-heading {
  padding: 5px 2px 16px;
}

.section-heading span {
  color: #315efb;
  font-size: 10px;
  letter-spacing: 1.4px;
  font-weight: 800;
}

.section-heading h2 {
  margin: 5px 0;
  font-size: 27px;
  letter-spacing: -.8px;
}

.section-heading p {
  color: #7c8494;
  font-size: 12px;
  margin: 0;
}

.single-chart {
  margin-bottom: 19px;
}

.table-card {
  background: white;
  border: 1px solid #e4e7ee;
  border-radius: 17px;
  overflow: hidden;
  margin-bottom: 20px;
}

.table-header {
  padding: 20px;
  border-bottom: 1px solid #edf0f4;
}

.table-header h3 {
  margin: 0;
  font-size: 14px;
}

.table-header p {
  margin: 4px 0 0;
  font-size: 10px;
  color: #8b94a4;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

th {
  text-align: left;
  padding: 12px 20px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #8b94a4;
  background: #fafbfc;
}

td {
  padding: 14px 20px;
  border-top: 1px solid #f0f2f5;
  font-size: 12px;
}

.asset-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.coin-badge {
  width: 33px;
  height: 33px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: 0 0 33px;
  background: #eef2ff;
  font-weight: 800;
  font-size: 14px;
}

.coin-badge.large-badge {
  width: 42px;
  height: 42px;
  flex-basis: 42px;
  font-size: 17px;
}

.asset-cell strong,
.asset-cell small {
  display: block;
}

.asset-cell strong {
  font-size: 12px;
}

.asset-cell small {
  color: #9098a8;
  font-size: 9px;
  margin-top: 2px;
}

.table-positive {
  color: #079669;
  font-weight: 800;
}

.table-negative {
  color: #d94355;
  font-weight: 800;
}

.performance-list {
  padding: 0 20px;
}

.performance-row {
  display: grid;
  grid-template-columns: 40px 45px 1fr 150px 100px;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #eef0f4;
}

.performance-row:last-child {
  border-bottom: 0;
}

.rank {
  color: #a0a7b4;
  font-size: 11px;
  font-weight: 800;
}

.performance-name strong,
.performance-name span,
.performance-market small,
.performance-market strong {
  display: block;
}

.performance-name strong {
  font-size: 12px;
}

.performance-name span {
  color: #9098a8;
  font-size: 9px;
  margin-top: 2px;
}

.performance-market {
  text-align: right;
}

.performance-market small {
  color: #969eac;
  font-size: 9px;
}

.performance-market strong {
  font-size: 11px;
  margin-top: 3px;
}

.performance-change {
  text-align: right;
  font-size: 13px;
  font-weight: 800;
}

.footer {
  border-top: 1px solid #e0e4eb;
  margin-top: 28px;
  padding-top: 19px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  color: #8a93a3;
  font-size: 10px;
}

.footer strong,
.footer span {
  display: block;
}

.footer strong {
  color: #4d5666;
  font-size: 11px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1050px) {
  .header-meta {
    display: none;
  }

  .filters {
    grid-template-columns: 1fr 1fr;
  }

  .filter-title {
    grid-column: 1 / -1;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-charts,
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .dashboard {
    padding: 18px 12px 30px;
  }

  .top-header {
    margin-bottom: 18px;
  }

  .brand h1 {
    font-size: 17px;
  }

  .brand p {
    font-size: 10px;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
  }

  .hero {
    min-height: auto;
    padding: 28px 22px;
    flex-direction: column;
    align-items: stretch;
  }

  .hero h2 {
    font-size: 39px;
    letter-spacing: -1.9px;
  }

  .hero p {
    font-size: 12px;
  }

  .hero-card {
    min-width: 0;
  }

  .filters {
    grid-template-columns: 1fr;
    padding: 15px;
  }

  .filter-title {
    grid-column: auto;
  }

  .reset-button {
    justify-content: center;
  }

  .tabs {
    display: none;
  }

  .mobile-menu {
    display: block;
    position: relative;
    margin-bottom: 15px;
  }

  .mobile-menu > button {
    width: 100%;
    border: 1px solid #e1e5ec;
    background: white;
    border-radius: 11px;
    padding: 11px 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #263148;
    font-size: 12px;
    font-weight: 700;
  }

  .mobile-options {
    position: absolute;
    z-index: 20;
    width: 100%;
    margin-top: 5px;
    background: white;
    border: 1px solid #e1e5ec;
    border-radius: 11px;
    padding: 5px;
    box-shadow: 0 15px 35px rgba(15,23,42,.12);
  }

  .mobile-options button {
    width: 100%;
    text-align: left;
    border: 0;
    background: transparent;
    padding: 10px;
    border-radius: 7px;
    font-size: 11px;
  }

  .mobile-options button:hover {
    background: #f4f6fb;
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .kpi-card {
    padding: 15px;
    min-height: 137px;
  }

  .kpi-value {
    font-size: 21px;
  }

  .kpi-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 12px;
  }

  .chart-card {
    padding: 15px;
  }

  .chart-area,
  .large-chart .chart-area {
    height: 245px;
  }

  .section-heading h2 {
    font-size: 22px;
  }

  .performance-row {
    grid-template-columns: 30px 42px 1fr 80px;
  }

  .performance-market {
    display: none;
  }

  .footer {
    flex-direction: column;
  }
}

@media (max-width: 420px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .hero h2 {
    font-size: 34px;
  }

  .hero-card strong {
    font-size: 25px;
  }
}
`;