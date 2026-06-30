from typing import Literal

from pydantic import BaseModel, Field


class ConnectionConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 7497
    client_id: int = 1
    readonly: bool = True


class ConnectionStatus(BaseModel):
    connected: bool
    demo_mode: bool = False
    accounts: list[str] = Field(default_factory=list)
    active_account: str | None = None
    message: str | None = None


class AccountSummary(BaseModel):
    net_liquidation: float | None = None
    total_cash: float | None = None
    gross_position_value: float | None = None
    buying_power: float | None = None
    unrealized_pnl: float | None = None
    realized_pnl: float | None = None
    daily_pnl: float | None = None


class PositionRow(BaseModel):
    account: str
    symbol: str
    sec_type: str
    currency: str
    exchange: str
    position: float
    avg_cost: float
    market_price: float | None = None
    market_value: float | None = None
    unrealized_pnl: float | None = None
    realized_pnl: float | None = None
    daily_pnl: float | None = None
    con_id: int | None = None


class PortfolioSnapshot(BaseModel):
    type: Literal["snapshot", "update"] = "snapshot"
    connected: bool
    demo_mode: bool = False
    account: str | None = None
    accounts: list[str] = Field(default_factory=list)
    summary: AccountSummary = Field(default_factory=AccountSummary)
    positions: list[PositionRow] = Field(default_factory=list)
    timestamp: str
    message: str | None = None
