import { useContext, useEffect, useState } from "react";
import { AppContext } from "../utils/contexts";

export default function AccountSummary() {
    const appContext = useContext(AppContext);
    const [accSummary, setAccSummary] = useState<{ [key: string]: number } | undefined>(undefined)

    useEffect(() => {
        if (!appContext) return;
        setAccSummary({
            'Cash Balance': appContext.cashBalance,
            'Margin Balance': appContext.marginBalance,
            'Position Value': appContext.positionValue,
            'Net Worth': appContext.netWorth,
        })
    }, [appContext]);
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
