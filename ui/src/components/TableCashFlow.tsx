import { DataGrid, Toolbar, type GridColDef } from "@mui/x-data-grid";
import { useContext, useEffect, useState } from "react";

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Typography } from "@mui/material";
import AddCashFlow from "./AddCashFlow";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { PortfolioContext } from "../utils/contexts";
import type { GridCashflowRowEntry } from "../utils/dataInterface";
import { valueFormatter2D } from "./ZCommonComponents";


export default function TbCashFlow() {
    const portfolioContext = useContext(PortfolioContext);
    const [openAddCF, setOpenAddCF] = useState<boolean>(false)
    const [displayYear, setDisplayYear] = useState<number | undefined>(undefined)

    const [tableRows, setTableRows] = useState<GridCashflowRowEntry[]>([]); // Replace 'any' with your specific type if available
    const tableCol: GridColDef[] = [
        { field: 'id', headerName: 'ID', type: 'string', width: 150 },
        { field: 'date', headerName: 'Date', type: 'string', width: 100, headerAlign: 'left', align: 'left' },
        { field: 'type', headerName: 'Type', type: 'string', width: 100, headerAlign: 'center', align: 'center' },

        { field: 'balPrev', headerName: 'Bal. Prev', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'amount', headerName: 'Amount', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'balAfter', headerName: 'Bal. After', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },

        { field: 'reason', headerName: 'Reason', type: 'string', width: 100 },
        { field: 'note', headerName: 'Note', type: 'string', width: 400 },
        { field: 'createdAt', headerName: 'Created At', type: 'string', width: 200 },
        { field: 'timeStamp', headerName: 'Time Stamp', type: 'number', width: 150, headerAlign: 'center', align: 'center' },
    ];


    function CustomToolbar() {
        return (
            <Toolbar>
                <Typography variant="caption" component="div" sx={{ flexGrow: 1 }}>
                    {displayYear ? `Cashflow Summary for ${displayYear}` : 'Cashflow Summary'}
                </Typography> 
                <Button color="primary" startIcon={<AddIcon />} onClick={() => setOpenAddCF(true)}>
                    deposit/withdraw
                </Button>
            </Toolbar>
        )
    }

    useEffect(() => {
        if (!portfolioContext || !portfolioContext.selectedPortPath) return;
        const cfSumColRef = collection(db, `${portfolioContext.selectedPortPath}/cashflow_summary`);
        // find the biggest doc id in the collection
        const cfSumQuery = query(cfSumColRef, orderBy('__name__', 'desc'), limit(1));
        const unsubscribe = onSnapshot(cfSumQuery, (snapshot) => {
            if (snapshot.empty) {
                setDisplayYear(undefined);
                setTableRows([]);
                console.log('No cashflow summary found');
                return;
            }
            const docId = snapshot.docs[0].id;
            const year = parseInt(docId);
            setDisplayYear(year);
            const newRows: GridCashflowRowEntry[] = [];
            const cfData = snapshot.docs[0].data();
            Object.keys(cfData).forEach((key) => {
                const entry = cfData[key];
                newRows.push({
                    id: key,
                    date: entry.date,
                    type: entry.type,
                    amount: entry.amount,
                    balPrev: entry.balPrev,
                    balAfter: entry.balAfter,
                    reason: entry.reason,
                    timeStamp: entry.timeStamp,
                    note: entry.note,
                    createdAt: entry.createdAt,
                });
            });
            newRows.sort((a, b) => b.timeStamp - a.timeStamp);
            setTableRows(newRows);
        })
        return () => unsubscribe();
    }, [portfolioContext, portfolioContext?.selectedPortPath]);


    return (
        <Box sx={{ maxWidth: '100vw', overflowX: 'auto' }}>
            <DataGrid
                rows={tableRows}
                columns={tableCol}
                slots={{ toolbar: CustomToolbar }}
                showToolbar
                columnVisibilityModel={{ id: false, createdAt: false, timeStamp: false }}
                sortModel={[
                    { field: 'id', sort: 'desc' } // Sort by ID in descending order
                ]}
            />
            <AddCashFlow open={openAddCF} onClose={() => setOpenAddCF(false)} />
        </Box>
    );
}
