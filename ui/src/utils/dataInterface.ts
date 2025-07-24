// ******************** app context ****************
export interface AppContextType {
    isLoggedin: boolean,
    portList: string[] | undefined,
    selectedPortfolio: string | undefined,
    selectedPortPath: string | undefined,
    // stock list should be store in the local storage
    stockList: {
        [ticker: string]: {
            'fullExchangeName': string,
            'longName': string,
        }
    } | undefined,
    // Add the function to update selected portfolio
    updateSelectedPortfolio: (portfolioId: string) => void,
}

export interface PortfolioContextType {
    selectedPortfolio?: string | undefined,
    selectedPortPath?: string | undefined,
    cashBalance: number,
    marginBalance: number,
    positionValue: number,
    netWorth: number,
    cashflowCount: number,
    transactionCount: number,
    mtmTimeStamp: number,
    currentPositions: { [ticker: string]: SinglePosition } | undefined,
}

// **************** portfolio ****************
export interface NewPortfolio {
    broker: string,
    note: string,
    created_at: string,
}

// **************** cashflow ****************
export interface CashflowEntry {
    date: string,
    type: 'in' | 'out',
    amount: number,
    balPrev: number,
    balAfter: number,
    reason: string,     //'cash in' | 'sell' | 'buy' | 'cash out' | 'other',
    timeStamp: number,
    note?: string,
    createdAt?: string,
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
    timeStamp: number,
    time: string,
    commission: number,
    otherFees: number,
    totalCost: number,
    note?: string,
    createdAt?: string,
}

export interface GridTransactionRowEntry {
    id: string,  // tx_xxxxxx
    date: string,
    type: 'buy' | 'sell',
    ticker: string,
    amount: number,
    price: number,
    commission: number,
    otherFees: number,
    totalCost: number,
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
    avgCost: number,
    totalCost: number,
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