import { useContext, useEffect, useState } from "react";
import { DataGrid, Toolbar, type GridColDef } from "@mui/x-data-grid";
import type { GridPositionRowEntry } from "../utils/dataInterface";
import { PortfolioContext } from "../utils/contexts";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import { valueFormatter2D } from "./ZCommonComponents";

export default function TbPosition() {
    const portfolioContext = useContext(PortfolioContext);

    const [tableRows, setTableRows] = useState<GridPositionRowEntry[]>([])
    const tableCol: GridColDef[] = [
        { field: 'id', headerName: 'Ticker', type: 'string', width: 100 },
        { field: 'amount', headerName: 'Amount', type: 'number', width: 100, headerAlign: 'right', align: 'right' },
        { field: 'avgCost', headerName: 'Buy-in Price', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'totalCost', headerName: 'Total Cost', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'marketPrice', headerName: 'Mkt Price', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'marketValue', headerName: 'Mkt Value', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'pnl', headerName: 'P/L', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'pnlPct', headerName: 'P/L %', type: 'string', width: 100, headerAlign: 'right', align: 'right' },
        { field: 'assetClass', headerName: 'Asset Class', type: 'string', width: 100, headerAlign: 'center', align: 'center' },
    ]

    function CustomToolbar() {
        return (
            <Toolbar>
                <Typography variant="caption" component="div" sx={{ flexGrow: 1 }}>
                    {`Market price updated at ${dayjs(portfolioContext?.mtmTimeStamp).format('YYYY-MM-DD HH:mm:ss z')}`}
                </Typography>
            </Toolbar>
        )
    }

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
            assetClass: position.assetClass,
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
                slots={{ toolbar: CustomToolbar }}
                showToolbar
                sortModel={[{ field: 'assetClass', sort: 'asc' }]} // Sort by asset class in ascending order
            />
        </Box>
    );
}
