import { DataGrid, Toolbar, type GridColDef } from "@mui/x-data-grid";
import { useContext, useEffect, useState } from "react";

import AddIcon from '@mui/icons-material/Add';
import { Button, Typography } from "@mui/material";
import AddCashFlow from "./AddCashFlow";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { AppContext } from "../utils/contexts";
import type { GridCashflowRowEntry } from "../utils/dataInterface";


export default function TbCashFlow() {
    const appContext = useContext(AppContext);
    const [openAddCF, setOpenAddCF] = useState<boolean>(false)
    const [displayYear, setDisplayYear] = useState<number | undefined>(undefined)

    const [tableRows, setTableRows] = useState<GridCashflowRowEntry[]>([]); // Replace 'any' with your specific type if available
    const tableCol: GridColDef[] = [
        // { field: 'id', headerName: 'ID', type: 'string', width: 150 },
        { field: 'date', headerName: 'Date', type: 'string', width: 100, headerAlign: 'left', align: 'left' },
        { field: 'type', headerName: 'Type', type: 'string', width: 100, headerAlign: 'center', align: 'center' },

        { field: 'amount', headerName: 'Amount', type: 'number', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'bal_prev', headerName: 'Balance Prev', type: 'number', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'bal_after', headerName: 'Balance After', type: 'number', width: 100, headerAlign: 'center', align: 'center' },

        { field: 'reason', headerName: 'Reason', type: 'string', width: 100 },
        // { field: 'time_stamp', headerName: 'Timestamp', type: 'number', width: 150, headerAlign: 'center', align: 'center' },
        { field: 'note', headerName: 'Note', type: 'string', width: 200 },
        { field: 'created_at', headerName: 'Created At', type: 'string', width: 200 }
    ];



    function CustomToolbar() {
        return (
            <Toolbar>
                <Typography variant="caption" component="div" sx={{ flexGrow: 1 }}>
                    {displayYear ? `Cashflow Summary for ${displayYear}` : 'Cashflow Summary'}
                </Typography>
                    
                <Button color="primary" startIcon={<AddIcon />} onClick={() => setOpenAddCF(true)}>
                    add cashflow
                </Button>
            </Toolbar>
        )
    }

    useEffect(() => {
        if (!appContext || !appContext.selectedPortPath) return;
        const cfSumColRef = collection(db, `${appContext.selectedPortPath}/cashflow_summary`);
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
                    bal_prev: entry.bal_prev,
                    bal_after: entry.bal_after,
                    reason: entry.reason,
                    time_stamp: entry.time_stamp,
                    note: entry.note,
                    created_at: entry.created_at,
                });
            });
            newRows.sort((a, b) => b.time_stamp - a.time_stamp); 
            
            console.log('Cashflow summary fetched:', newRows);
            setTableRows(newRows);
        })
        return () => unsubscribe();
    }, [appContext, appContext?.selectedPortPath]);


    return (
        <div>
            <DataGrid
                rows={tableRows}
                columns={tableCol}
                slots={{ toolbar: CustomToolbar }}
                showToolbar
            />
            <AddCashFlow open={openAddCF} onClose={() => setOpenAddCF(false)} />
        </div>
    );
}
