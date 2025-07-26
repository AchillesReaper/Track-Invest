import { useContext, useEffect, useState } from "react";
import { PortfolioContext } from "../utils/contexts";
import { Grid } from "@mui/material";

export default function AccountSummary() {
    const portfolioContext = useContext(PortfolioContext);
    const [accSummary, setAccSummary] = useState<{ [key: string]: number } | undefined>(undefined)

    useEffect(() => {
        if (!portfolioContext) return;
        setAccSummary({
            'Cash Balance': portfolioContext.cashBalance,
            'Margin Balance': portfolioContext.marginBalance,
            'Position Value': portfolioContext.positionValue,
            'Net Worth': portfolioContext.netWorth,
        })
    }, [portfolioContext]);
    return (
        <Grid container spacing={2} justifyContent='space-between'>
            {accSummary && Object.entries(accSummary).map(([k, v]) =>
                <Grid size={{ xs: 6, md: 3 }} key={k}>
                    <div className="R1Card">
                        <span className="cardR1text1">{k}</span> <br />
                        <span className="cardR1text2">${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </Grid>
            )}
        </Grid>
    );
}