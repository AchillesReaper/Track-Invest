import { useContext, useEffect, useState } from "react";
import { PortfolioContext } from "../utils/contexts";

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
        <div className="mainRow1">
            {accSummary && Object.entries(accSummary).map(([k, v]) =>
                <div className="elementCardR1" key={k}>
                    <span className="cardR1text1">{k}</span> <br />
                    <span className="cardR1text2">${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            )}
        </div>
    );
}
