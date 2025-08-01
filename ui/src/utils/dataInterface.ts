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
    ownedPortfolios: string[],
    sharedPortfolios: {
        [portfolioId: string]: {
            owner: string;
            permission: 'read' | 'write';
        }
    };
}

export interface PortfolioContextType {
    selectedPortfolio?: string | undefined,
    selectedPortPath?: string | undefined,
    cashBalance: number,
    marginBalance: number,
    positionValue: number,
    netWorth: number,
    selfCapital:number
    cashflowCount: number,
    transactionCount: number,
    mtmTimeStamp: number,   // used to prevent logging trade/cashflow in the past
    currentPositions: { [ticker: string]: SinglePosition } | undefined,
}

// **************** portfolio ****************
export interface NewPortfolio {
    broker: string,
    note: string,
    created_at: string,
    owner: string, // email of the portfolio owner
    sharedWith?: string[], // array of emails that have access to this portfolio
    sharePermissions?: {
        [email: string]: 'read' | 'write' // permission level for each shared user
    },
    isPublic?: boolean, // optional: for public portfolios
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
    balPrev: number,
    balAfter: number,
    reason: 'cash in' | 'sell' | 'buy' | 'cash out' | 'other',
    timeStamp: number,
    note?: string,
    createdAt?: string,
}


// **************** transaction ****************
export interface TransactionEntry {
    ticker: string,
    assetClass: string, // e.g. 'stock', 'bond', 'fund', 'crypto'
    amount: number,
    price: number,
    type: 'buy' | 'sell',
    timeStamp: number,
    time: string,
    commission: number,
    otherFees: number,
    totalCost: number,
    note: string,
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
    note: string,
    createdAt: string,
}


// **************** position ****************
// portfolio/positionSummary/
//     |- current
//     |- 2023
//         |- 2023-01
//         |- 2023-02
//         |- 2023-03
//         |- ...
//     |- 2024
export interface SinglePosition {
    ticker: string,
    assetClass: string, // e.g. 'stock', 'bond', 'fund', 'crypto'
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
    assetClass: string, // e.g. 'stock', 'bond', 'fund', 'crypto'
    avgCost: number,
    totalCost: number,
    amount: number,
    marketPrice: number,
    marketValue: number,
    pnl: number,
    pnlPct: string, // Percentage formatted as a string
}