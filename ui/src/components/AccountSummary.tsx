import { Box, Paper, styled } from "@mui/material";
import { accSummary } from "./ZDummyDB";
import { btnBox } from "./ZCommonCSSsetting";
import { useState } from "react";


export default function AccountSummary() {
    const SummaryCard = styled(Paper)(() => ({
        flexGrow: 1,
        padding: 'auto',
        textAlign: 'center',
        // minWidth: '70px',
        maxWidth: '200px',
        borderRadius: '10px',
        height: 50,
        placeItems: 'center',
        backgroundColor: 'rgb(23, 13, 78)',
        color: 'rgb(178, 214, 210)'
    }));

    // data from API
    const [posValue, setPosValue] = useState<number>(accSummary.pos_value | 0)
    const [cashBal, setCashBal] = useState<number>(accSummary.cash | 0)


    return (
        <div className="flex justify-between">
            {Object.entries(accSummary).map(([k, v]) =>
                <div className="basis-1/4 flex justify-center select-none" key={k}>
                    <SummaryCard key={k}>
                        <span className="text-xs sm:text-sm md:text-base lg:text-lg">
                            {k} <br /> ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </SummaryCard>
                </div>
            )}
        </div>

    );
}
