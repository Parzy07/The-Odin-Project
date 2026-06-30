export interface AccountSummary {
  net_liquidation: number | null;
  total_cash: number | null;
  gross_position_value: number | null;
  buying_power: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
  daily_pnl: number | null;
}

export interface PositionRow {
  account: string;
  symbol: string;
  sec_type: string;
  currency: string;
  exchange: string;
  position: number;
  avg_cost: number;
  market_price: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
  daily_pnl: number | null;
  con_id: number | null;
}

export interface PortfolioSnapshot {
  type: "snapshot" | "update";
  connected: boolean;
  demo_mode: boolean;
  account: string | null;
  accounts: string[];
  summary: AccountSummary;
  positions: PositionRow[];
  timestamp: string;
  message: string | null;
}

export interface ConnectionStatus {
  connected: boolean;
  demo_mode: boolean;
  accounts: string[];
  active_account: string | null;
  message: string | null;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  client_id: number;
  readonly: boolean;
}
