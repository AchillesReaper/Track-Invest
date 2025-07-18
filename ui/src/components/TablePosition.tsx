import { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { assetAllocation } from "./ZDummyDB";

export default function TbPosition() {
    interface GridPositionRowEntry {
        id: string;  // Unique identifier for each row -> same as ticker
        cost: number;
        amount: number;
        marketPrice: number;
        marketValue: number;
        pnl: number;
        pnlPct: string; // Percentage formatted as a string
    }

    const [tableRows, setTableRows] = useState<GridPositionRowEntry[]>([])
    const tableCol: GridColDef[] = [
        { field: 'id', headerName: 'Ticker', type: 'string', width: 150 },
        { field: 'amount', headerName: 'Amount', type: 'number', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'cost', headerName: 'Buy-in Price', type: 'number', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'marketPrice', headerName: 'Mkt Price', type: 'number', width: 100 },
        { field: 'marketValue', headerName: 'Mkt Value', type: 'number', width: 100 },
        { field: 'pnl', headerName: 'P/L', type: 'number', width: 100 },
        { field: 'pnlPct', headerName: 'P/L %', type: 'string', width: 100, headerAlign: 'right', align: 'right' },
    ]

    useEffect(() => {
        const assetData = Object.values(assetAllocation).flatMap((assetDetail) => {
            return Object.entries(assetDetail).map(([ticker, stockDetail]) => {
                const cost = stockDetail.cost;
                const amount = stockDetail.amount;
                const marketPrice = stockDetail.marketPrice;
                const marketValue = marketPrice * amount;
                const pnl = (marketPrice - cost) * amount; // Calculate P/L
                const pnlPct = (marketPrice / cost - 1) * 100; // Calculate P/L percentage

                return {
                    id: ticker,
                    cost: cost,
                    amount: amount,
                    marketPrice: marketPrice,
                    marketValue: marketValue,
                    pnl: pnl,
                    pnlPct: pnlPct.toFixed(2) // Format to 2 decimal places
                } satisfies GridPositionRowEntry;
            });
        })
        setTableRows(assetData);
    }, []);



    return (
        <div>
            <DataGrid
                rows={tableRows}
                columns={tableCol}
            />
        </div>
    );
}
