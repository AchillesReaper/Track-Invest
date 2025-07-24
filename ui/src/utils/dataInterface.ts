// ******************** app context ****************
export interface AppContextType {
    isLoggedin: boolean,
    portList: string[] | undefined,
    selectedPortfolio: string | undefined,
    selectedPortPath: string | undefined,
    cashBalance: number,
    marginBalance: number,
    positionValue: number,
    netWorth: number,
    cashflowCount: number,
    transactionCount: number,
    mtmTime: string | undefined,
    currentPositions?: { [ticker: string]: SinglePosition } 
    // stock list should be store in the local storage
    stockList?: {
        [ticker: string]: {
            'fullExchangeName': string,
            'longName': string,
        }
    } | undefined,
    // Add the function to update selected portfolio
    updateSelectedPortfolio: (portfolioId: string) => void,
}

// **************** portfolio ****************
export interface newportfolio {
    broker: string,
    note: string,
    cash: number,
    margin: number,
    position_value: number,
    net_worth: number,
    cashflow_count: number,
    transaction_count: number,
    mtm_time_stamp: number,
    created_at: string,
}

// **************** cashflow ****************
export interface CashflowEntry {
    date: string,
    type: 'in' | 'out',
    amount: number,
    bal_prev: number,
    bal_after: number,
    reason: 'cash in' | 'sell' | 'buy' | 'cash out' | 'other',
    time_stamp: number,
    note?: string,
    created_at?: string,
}

export interface GridCashflowRowEntry {
    id: string,
    date: string,
    type: 'in' | 'out',
    amount: number,
    bal_prev: number,
    bal_after: number,
    reason: 'cash in' | 'sell' | 'buy' | 'cash out' | 'other',
    time_stamp: number,
    note?: string,
    created_at?: string,
}


// **************** transaction ****************
export interface TransactionEntry {
    ticker: string,
    amount: number,
    price: number,
    type: 'buy' | 'sell',
    time_stamp: number,
    time: string,
    commission: number,
    other_fees: number,
    total_cost: number,
    note?: string,
    created_at?: string,
}

export interface GridTransactionRowEntry {
    date: string,
    id: string,  // Unique identifier for each row -> same as ticker
    amount: number,
    price: number,
    
    marketPrice: number,
    marketValue: number,
    pnl: number,
    pnlPct: string, // Percentage formatted as a string
}


// **************** position ****************
// portfolio/positionSummary/
//     |- current
//     /- historical
//        |- 2023
//        |- 2024
export interface SinglePosition {
    ticker: string,
    amount: number,
    avg_cost: number,
    total_cost: number,
    marketPrice: number,
    marketValue: number,
    pnl: number,
    pnlPct: string, // Percentage formatted as a string
}


export interface GridPositionRowEntry {
    id: string,  // Unique identifier for each row -> same as ticker
    cost: number,
    amount: number,
    marketPrice: number,
    marketValue: number,
    pnl: number,
    pnlPct: string, // Percentage formatted as a string
}