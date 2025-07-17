import { accSummary } from "./ZDummyDB";

export default function AccountSummary() {

    return (
        <div className="mainRow1">
            {Object.entries(accSummary).map(([k, v]) =>
                <div className="elementCardR1" key={k}>
                    <span className="cardR1text1">{k}</span> <br />
                    <span className="cardR1text2">${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            )}
        </div>
    );
}
