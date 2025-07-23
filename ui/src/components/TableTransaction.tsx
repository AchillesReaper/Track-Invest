import { useContext, useEffect, useState } from "react";
import { AppContext } from "../utils/contexts";
import type { GridTransactionRowEntry } from "../utils/dataInterface";
import { DataGrid, Toolbar, type GridColDef } from "@mui/x-data-grid";
import { Button, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import AddTransaction from "./AddTransaction";


export default function TbTransaction() {
    const appContext = useContext(AppContext);
    const [openAddTsc, setOpenAddTsc] = useState<boolean>(false);

    const [tableRows, setTableRows] = useState<GridTransactionRowEntry[]>([]); // Replace 'any' with your specific type if available
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
                    {/* {displayYear ? `Cashflow Summary for ${displayYear}` : 'Cashflow Summary'} */}
                </Typography>

                <Button color="primary" startIcon={<AddIcon />} onClick={() => setOpenAddTsc(true)}>
                    add transaction
                </Button>
            </Toolbar>
        )
    }

    useEffect(() => { 
        setTableRows([]); // Reset table rows
    }, [appContext, appContext?.selectedPortPath]);

    return (
        <div>
            <DataGrid
                rows={tableRows}
                columns={tableCol}
                slots={{ toolbar: CustomToolbar }}
                showToolbar
            />
            <AddTransaction open={openAddTsc} onClose={() => setOpenAddTsc(false)} />
        </div>
    );
}



