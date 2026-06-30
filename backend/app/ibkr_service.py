from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timezone
from typing import Any

from ib_async import IB

from app.config import settings
from app.models import (
    AccountSummary,
    ConnectionConfig,
    ConnectionStatus,
    PortfolioSnapshot,
    PositionRow,
)
from app.ws_manager import ws_manager

logger = logging.getLogger(__name__)

ACCOUNT_SUMMARY_TAGS = (
    "NetLiquidation",
    "TotalCashValue",
    "GrossPositionValue",
    "BuyingPower",
    "UnrealizedPnL",
    "RealizedPnL",
)

TAG_TO_FIELD = {
    "NetLiquidation": "net_liquidation",
    "TotalCashValue": "total_cash",
    "GrossPositionValue": "gross_position_value",
    "BuyingPower": "buying_power",
    "UnrealizedPnL": "unrealized_pnl",
    "RealizedPnL": "realized_pnl",
}


class IBKRService:
    def __init__(self) -> None:
        self.ib = IB()
        self._connected = False
        self._demo_mode = settings.demo_mode
        self._active_account: str | None = None
        self._accounts: list[str] = []
        self._summary = AccountSummary()
        self._positions: dict[str, PositionRow] = {}
        self._pnl_daily: float | None = None
        self._message: str | None = None
        self._demo_task: asyncio.Task | None = None
        self._lock = asyncio.Lock()
        self._handlers_registered = False

    @property
    def connected(self) -> bool:
        return self._connected

    @property
    def demo_mode(self) -> bool:
        return self._demo_mode

    def get_status(self) -> ConnectionStatus:
        return ConnectionStatus(
            connected=self._connected,
            demo_mode=self._demo_mode,
            accounts=self._accounts.copy(),
            active_account=self._active_account,
            message=self._message,
        )

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _build_snapshot(self, update_type: str = "snapshot") -> PortfolioSnapshot:
        positions = sorted(
            self._positions.values(),
            key=lambda row: abs(row.market_value or 0),
            reverse=True,
        )
        summary = self._summary.model_copy()
        if self._pnl_daily is not None:
            summary.daily_pnl = self._pnl_daily

        return PortfolioSnapshot(
            type=update_type,  # type: ignore[arg-type]
            connected=self._connected,
            demo_mode=self._demo_mode,
            account=self._active_account,
            accounts=self._accounts.copy(),
            summary=summary,
            positions=positions,
            timestamp=self._now(),
            message=self._message,
        )

    async def _broadcast(self, update_type: str = "update") -> None:
        snapshot = self._build_snapshot(update_type)
        await ws_manager.broadcast(snapshot.model_dump())

    def _register_handlers(self) -> None:
        if self._handlers_registered:
            return

        self.ib.connectedEvent += self._on_ib_connected
        self.ib.disconnectedEvent += self._on_ib_disconnected
        self.ib.updatePortfolioEvent += self._on_portfolio_update
        self.ib.pnlEvent += self._on_pnl_update
        self.ib.accountSummaryEvent += self._on_account_summary
        self.ib.positionEvent += self._on_position_update
        self._handlers_registered = True

    def _on_ib_connected(self) -> None:
        logger.info("IBKR connected event")

    def _on_ib_disconnected(self) -> None:
        logger.info("IBKR disconnected event")
        self._connected = False
        asyncio.create_task(self._broadcast("update"))

    def _on_portfolio_update(self, item: Any) -> None:
        if self._active_account and item.account != self._active_account:
            return
        asyncio.create_task(self._apply_portfolio_item(item))

    def _on_pnl_update(self, pnl: Any) -> None:
        if self._active_account and pnl.account != self._active_account:
            return
        self._pnl_daily = pnl.dailyPnL
        asyncio.create_task(self._broadcast("update"))

    def _on_account_summary(self, item: Any) -> None:
        if self._active_account and item.account != self._active_account:
            return
        field = TAG_TO_FIELD.get(item.tag)
        if not field:
            return
        try:
            value = float(item.value)
        except (TypeError, ValueError):
            return
        setattr(self._summary, field, value)
        asyncio.create_task(self._broadcast("update"))

    def _on_position_update(self, position: Any) -> None:
        if self._active_account and position.account != self._active_account:
            return
        asyncio.create_task(self._apply_position(position))

    async def _apply_portfolio_item(self, item: Any) -> None:
        contract = item.contract
        symbol = self._contract_symbol(contract)
        key = f"{item.account}:{contract.conId}"

        if item.position == 0:
            self._positions.pop(key, None)
        else:
            self._positions[key] = PositionRow(
                account=item.account,
                symbol=symbol,
                sec_type=contract.secType,
                currency=contract.currency,
                exchange=contract.exchange or contract.primaryExchange or "",
                position=float(item.position),
                avg_cost=float(item.averageCost),
                market_price=float(item.marketPrice) if item.marketPrice else None,
                market_value=float(item.marketValue) if item.marketValue else None,
                unrealized_pnl=float(item.unrealizedPNL) if item.unrealizedPNL else None,
                realized_pnl=float(item.realizedPNL) if item.realizedPNL else None,
                con_id=contract.conId,
            )

        await self._broadcast("update")

    async def _apply_position(self, position: Any) -> None:
        contract = position.contract
        symbol = self._contract_symbol(contract)
        key = f"{position.account}:{contract.conId}"

        if position.position == 0:
            self._positions.pop(key, None)
        else:
            existing = self._positions.get(key)
            self._positions[key] = PositionRow(
                account=position.account,
                symbol=symbol,
                sec_type=contract.secType,
                currency=contract.currency,
                exchange=contract.exchange or contract.primaryExchange or "",
                position=float(position.position),
                avg_cost=float(position.avgCost),
                market_price=existing.market_price if existing else None,
                market_value=existing.market_value if existing else None,
                unrealized_pnl=existing.unrealized_pnl if existing else None,
                realized_pnl=existing.realized_pnl if existing else None,
                con_id=contract.conId,
            )

        await self._broadcast("update")

    @staticmethod
    def _contract_symbol(contract: Any) -> str:
        if contract.secType == "STK":
            return contract.symbol
        if contract.secType == "OPT":
            return (
                f"{contract.symbol} {contract.lastTradeDateOrContractMonth}"
                f" {contract.right}{contract.strike}"
            )
        if contract.secType == "FUT":
            return f"{contract.symbol} {contract.lastTradeDateOrContractMonth}"
        if contract.secType == "CASH":
            return f"{contract.symbol}.{contract.currency}"
        return contract.localSymbol or contract.symbol

    async def connect(self, config: ConnectionConfig | None = None) -> ConnectionStatus:
        async with self._lock:
            if self._connected:
                return self.get_status()

            if settings.demo_mode:
                return await self._connect_demo()

            host = config.host if config else settings.ib_host
            port = config.port if config else settings.ib_port
            client_id = config.client_id if config else settings.ib_client_id
            readonly = config.readonly if config else settings.ib_readonly

            self._register_handlers()

            try:
                await self.ib.connectAsync(
                    host,
                    port,
                    clientId=client_id,
                    readonly=readonly,
                    timeout=10,
                )
            except Exception as exc:
                self._message = f"Connection failed: {exc}"
                logger.exception("IBKR connection failed")
                return self.get_status()

            self._connected = True
            self._demo_mode = False
            self._message = None
            self._accounts = list(self.ib.managedAccounts())
            self._active_account = self._accounts[0] if self._accounts else None

            await self._load_live_data()
            await self._broadcast("snapshot")
            return self.get_status()

    async def _load_live_data(self) -> None:
        if not self._active_account:
            return

        self._positions.clear()
        self._summary = AccountSummary()

        for item in self.ib.portfolio(self._active_account):
            await self._apply_portfolio_item(item)

        self.ib.reqAccountSummary()
        await asyncio.sleep(0.5)

        self.ib.reqPnL(self._active_account)

        for tag in ACCOUNT_SUMMARY_TAGS:
            values = self.ib.accountSummary(self._active_account)
            for item in values:
                if item.tag == tag:
                    field = TAG_TO_FIELD.get(tag)
                    if field:
                        try:
                            setattr(self._summary, field, float(item.value))
                        except (TypeError, ValueError):
                            pass

    async def disconnect(self) -> ConnectionStatus:
        async with self._lock:
            if self._demo_task and not self._demo_task.done():
                self._demo_task.cancel()
                try:
                    await self._demo_task
                except asyncio.CancelledError:
                    pass
                self._demo_task = None

            if self.ib.isConnected():
                self.ib.disconnect()

            self._connected = False
            self._demo_mode = False
            self._accounts.clear()
            self._active_account = None
            self._positions.clear()
            self._summary = AccountSummary()
            self._pnl_daily = None
            self._message = "Disconnected"
            await self._broadcast("snapshot")
            return self.get_status()

    async def set_active_account(self, account: str) -> ConnectionStatus:
        if account not in self._accounts:
            self._message = f"Unknown account: {account}"
            return self.get_status()

        self._active_account = account
        self._message = None

        if self._demo_mode:
            await self._load_demo_data()
        elif self._connected:
            await self._load_live_data()

        await self._broadcast("snapshot")
        return self.get_status()

    async def get_snapshot(self) -> PortfolioSnapshot:
        return self._build_snapshot("snapshot")

    async def _connect_demo(self) -> ConnectionStatus:
        self._connected = True
        self._demo_mode = True
        self._accounts = ["DU1234567"]
        self._active_account = self._accounts[0]
        self._message = "Running in demo mode (no IBKR connection)"
        await self._load_demo_data()
        self._demo_task = asyncio.create_task(self._demo_price_loop())
        await self._broadcast("snapshot")
        return self.get_status()

    async def _load_demo_data(self) -> None:
        demo_positions = [
            ("AAPL", 150, 178.50),
            ("MSFT", 80, 415.20),
            ("GOOGL", 45, 172.80),
            ("NVDA", 60, 875.40),
            ("SPY", 100, 528.90),
        ]

        self._positions.clear()
        total_value = 0.0
        total_unrealized = 0.0

        for symbol, qty, price in demo_positions:
            avg_cost = price * random.uniform(0.85, 1.05)
            market_value = qty * price
            unrealized = market_value - (qty * avg_cost)
            total_value += market_value
            total_unrealized += unrealized

            key = f"{self._active_account}:{symbol}"
            self._positions[key] = PositionRow(
                account=self._active_account or "",
                symbol=symbol,
                sec_type="STK",
                currency="USD",
                exchange="NASDAQ",
                position=float(qty),
                avg_cost=round(avg_cost, 2),
                market_price=price,
                market_value=round(market_value, 2),
                unrealized_pnl=round(unrealized, 2),
                realized_pnl=round(random.uniform(-500, 500), 2),
                daily_pnl=round(random.uniform(-200, 200), 2),
                con_id=hash(symbol) % 1_000_000,
            )

        self._summary = AccountSummary(
            net_liquidation=round(total_value + 25000, 2),
            total_cash=25000.0,
            gross_position_value=round(total_value, 2),
            buying_power=round(total_value * 2, 2),
            unrealized_pnl=round(total_unrealized, 2),
            realized_pnl=round(random.uniform(1000, 5000), 2),
            daily_pnl=round(sum(p.daily_pnl or 0 for p in self._positions.values()), 2),
        )
        self._pnl_daily = self._summary.daily_pnl

    async def _demo_price_loop(self) -> None:
        try:
            while self._connected and self._demo_mode:
                await asyncio.sleep(2)
                for row in self._positions.values():
                    if row.market_price is None:
                        continue
                    change = random.uniform(-0.003, 0.003)
                    new_price = round(row.market_price * (1 + change), 2)
                    row.market_price = new_price
                    row.market_value = round(new_price * row.position, 2)
                    cost_basis = row.avg_cost * row.position
                    row.unrealized_pnl = round(row.market_value - cost_basis, 2)
                    row.daily_pnl = round((row.daily_pnl or 0) + (row.market_value * change), 2)

                total_value = sum(p.market_value or 0 for p in self._positions.values())
                total_unrealized = sum(p.unrealized_pnl or 0 for p in self._positions.values())
                total_daily = sum(p.daily_pnl or 0 for p in self._positions.values())

                self._summary.gross_position_value = round(total_value, 2)
                self._summary.net_liquidation = round(total_value + (self._summary.total_cash or 0), 2)
                self._summary.unrealized_pnl = round(total_unrealized, 2)
                self._summary.daily_pnl = round(total_daily, 2)
                self._pnl_daily = self._summary.daily_pnl

                await self._broadcast("update")
        except asyncio.CancelledError:
            pass


ibkr_service = IBKRService()
