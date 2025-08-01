import { useContext, useEffect, useState } from "react";
import { PortfolioContext } from "../utils/contexts";
import { Grid } from "@mui/material";
import { valueFormatter2D } from "./ZCommonComponents";

export default function AccountSummary() {
    const portfolioContext = useContext(PortfolioContext);
    const [accSummary, setAccSummary] = useState<{ [key: string]: number } | undefined>(undefined)

    useEffect(() => {
        if (!portfolioContext) return;
        setAccSummary({
            'Self Funding': portfolioContext.selfCapital,
            'Cash Balance': portfolioContext.cashBalance,
            'Position Value': portfolioContext.positionValue,
            'Net Worth': portfolioContext.netWorth,
        })
    }, [portfolioContext]);
    return (
        <Grid container spacing={2} >
            {accSummary && Object.entries(accSummary).map(([k, v]) =>
                <Grid size={{ xs: 6, md: 3 }} key={k}>
                    <div className="R1Card">
                        <span className="cardR1text1">{k}</span> <br />
                        {/* <span className="cardR1text2">${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> */}
                        <span className="cardR1text2">${valueFormatter2D(v)}</span>
                    </div>
                </Grid>
            )}
        </Grid>
    );
}