import { accSummary } from "./ZDummyDB";

export default function AccountSummary() {

    return (
        <div className="flex flex-row justify-between">
            {Object.entries(accSummary).map(([k, v]) =>
                <div className="elementCardR1" key={k}>
                    <span>{k}</span> <br />
                    <span>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            )}
        </div>
    );
}
