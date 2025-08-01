import { useContext, useEffect, useState } from "react";
import { PortfolioContext } from "../utils/contexts";
import type { GridTransactionRowEntry, TransactionEntry } from "../utils/dataInterface";
import { DataGrid, Toolbar, type GridColDef } from "@mui/x-data-grid";
import { Box, Button, ButtonGroup } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import AddTransaction from "./AddTransaction";
import dayjs from "dayjs";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { valueFormatter2D } from "./ZCommonComponents";


export default function TbTransaction() {
    const portfolioContext = useContext(PortfolioContext);
    const [openAddTsc, setOpenAddTsc] = useState<boolean>(false);
    const [displayMonth, setDisplayMonth] = useState<string>(dayjs().format('YYYY-MM'));

    const [tableRows, setTableRows] = useState<GridTransactionRowEntry[]>([]); // Replace 'any' with your specific type if available
    const tableCol: GridColDef[] = [
        // { field: 'id', headerName: 'ID', type: 'string', width: 150 },
        { field: 'date', headerName: 'Date', type: 'string', width: 100, headerAlign: 'left', align: 'left' },
        { field: 'type', headerName: 'Type', type: 'string', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'ticker', headerName: 'Ticker', type: 'string', width: 100, headerAlign: 'center', align: 'center' },

        { field: 'amount', headerName: 'Amount', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'price', headerName: 'Price', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'commission', headerName: 'Commission', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'otherFees', headerName: 'Other Fees', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },
        { field: 'totalCost', headerName: 'Total Cost', type: 'number', width: 100, headerAlign: 'right', align: 'right', valueFormatter: valueFormatter2D },

        { field: 'note', headerName: 'Note', type: 'string', width: 400 },
    ];

    function CustomToolbar() {
        return (
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <ButtonGroup variant="text" size="small">
                        <Button onClick={() => handleMonthChange('prev')}>
                            <KeyboardDoubleArrowLeftIcon fontSize="inherit" />
                        </Button>
                        <Button>{displayMonth}</Button>
                        <Button onClick={() => handleMonthChange('next')} >
                            <KeyboardDoubleArrowRightIcon fontSize="inherit" />
                        </Button>
                    </ButtonGroup>

                </Box>

                <Button color="primary" startIcon={<AddIcon />} onClick={() => setOpenAddTsc(true)}>
                    add transaction
                </Button>
            </Toolbar>
        )
    }

    function handleMonthChange(direction: 'prev' | 'next') {
        switch (direction) {
            case 'prev':
                setDisplayMonth(dayjs(displayMonth).subtract(1, 'month').format('YYYY-MM'));
                break;
            case 'next':
                setDisplayMonth(dayjs(displayMonth).add(1, 'month').format('YYYY-MM'));
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        if (!portfolioContext || !portfolioContext.selectedPortPath) { return; }
        const txDocRef = doc(db, `${portfolioContext.selectedPortPath}/transactions/${displayMonth}`);

        const unsubscribe = onSnapshot(txDocRef, (txSummary) => {
            if (!txSummary.exists()) {
                console.log('No transaction summary found');
                setTableRows([]);
                return;
            }
            const txData: { [key: string]: TransactionEntry } = txSummary.data()
            const rows: GridTransactionRowEntry[] = Object.entries(txData).map(([key, tscDetail]) => ({
                id: key,
                date: dayjs(tscDetail.timeStamp).format('YYYY-MM-DD'),
                type: tscDetail.type,
                ticker: tscDetail.ticker,
                amount: tscDetail.amount,
                price: tscDetail.price,
                commission: tscDetail.commission,
                otherFees: tscDetail.otherFees,
                totalCost: tscDetail.totalCost,
                note: tscDetail.note,
                createdAt: tscDetail.createdAt,
            } as GridTransactionRowEntry));
            console.log('Transaction summary:', rows);
            setTableRows(rows);
        }, (error) => {
            console.error('Error fetching transaction summary:', error);
            setTableRows([]);
        });

        return () => unsubscribe();
    }, [portfolioContext, portfolioContext?.selectedPortPath, displayMonth]);

    return (
        <Box sx={{ maxWidth: '100vw', overflowX: 'auto' }}>
            <DataGrid
                rows={tableRows}
                columns={tableCol}
                slots={{ toolbar: CustomToolbar }}
                showToolbar
            />
            <AddTransaction open={openAddTsc} onClose={() => setOpenAddTsc(false)} />
        </Box>
    );
}



