import { useState, type JSX, } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TbPosition from './TablePosition';
import TbTransaction from './TableTransaction';
import TbCashFlow from './TableCashFlow';
import { Grid } from '@mui/material';

export default function DetailTables() {
    const [tableKey, setTableKey] = useState<string>('position');
    const [view, setView] = useState<JSX.Element>(<TbPosition />);

    const handleChange = (_event: React.SyntheticEvent, tableKey: string) => {
        switch (tableKey) {
            case 'position':
                setView(<TbPosition />);
                break;
            case 'transaction':
                setView(<TbTransaction />);
                break;
            case 'cashflow':
                setView(<TbCashFlow />);
                break;
            default:
                setView(<TbPosition />);
                break;
        }
        setTableKey(tableKey);
    };

    return (
        <Grid container spacing={0} sx={{ width: '100%' }}>
            <Grid size={12}>
                <Tabs
                    value={tableKey}
                    onChange={handleChange}
                    variant='fullWidth'
                >
                    <Tab value={"position"} label="position" />
                    <Tab value={"transaction"} label="transaction" />
                    <Tab value={"cashflow"} label="cashflow" />
                </Tabs>
            </Grid>
            <Grid size={12}>
                {view}
            </Grid>
        </Grid>
    );
}