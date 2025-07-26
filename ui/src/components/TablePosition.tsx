import { useContext, useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { GridPositionRowEntry } from "../utils/dataInterface";
import { PortfolioContext } from "../utils/contexts";
import { Box } from "@mui/material";

export default function TbPosition() {
    const portfolioContext = useContext(PortfolioContext);

    const [tableRows, setTableRows] = useState<GridPositionRowEntry[]>([])
    const tableCol: GridColDef[] = [
        { field: 'id', headerName: 'Ticker', type: 'string', width: 100 },
        { field: 'amount', headerName: 'Amount', type: 'number', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'avgCost', headerName: 'Buy-in Price', type: 'number', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'totalCost', headerName: 'Total Cost', type: 'number', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'marketPrice', headerName: 'Mkt Price', type: 'number', width: 100 },
        { field: 'marketValue', headerName: 'Mkt Value', type: 'number', width: 100 },
        { field: 'pnl', headerName: 'P/L', type: 'number', width: 100 },
        { field: 'pnlPct', headerName: 'P/L %', type: 'string', width: 100, headerAlign: 'right', align: 'right' },
    ]

    useEffect(() => {
        if (!portfolioContext || !portfolioContext.selectedPortPath) { return; }
        const currentPositions = portfolioContext.currentPositions;
        if (!currentPositions) {
            console.log('No position summary found');
            setTableRows([]);
            return;
        }
        const rows: GridPositionRowEntry[] = Object.entries(currentPositions).map(([ticker, position]) => ({
            id: ticker,
            amount: position.amount,
            avgCost: position.avgCost,
            totalCost: position.totalCost,
            marketPrice: position.marketPrice,
            marketValue: position.marketValue,
            pnl: position.pnl,
            pnlPct: position.pnlPct,
        }));
        setTableRows(rows);
    }, [portfolioContext]);



    return (
        <Box sx={{ maxWidth: '100vw', overflowX: 'auto' }}>
            <DataGrid
                sx={{ width: '100%' }}
                rows={tableRows}
                columns={tableCol}
            />
        </Box>
    );
}
