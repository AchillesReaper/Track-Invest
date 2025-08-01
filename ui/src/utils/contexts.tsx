import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { AppContextType, PortfolioContextType, SinglePosition } from "./dataInterface";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import dayjs from "dayjs";

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
    let userDocUnsubscribe: (() => void) | null = null;
    let portfolioUnsubscribe: (() => void) | null = null;
    // let portfolioSummaryUnsubscribe: (() => void) | null = null;
    // let positionCurrentUnsubscribe: (() => void) | null = null;

    const [isLoggedin, setIsLoggedin] = useState<boolean>(auth.currentUser !== null);

    const [portList, setPortList] = useState<string[] | undefined>(undefined)
    const [selectedPortfolio, setSelectedPortfolio] = useState<string | undefined>(undefined)
    const [selectedPortPath, setSelectedPortPath] = useState<string | undefined>(undefined)

    // check if stock list is in local storage if not getdoc from firebase
    const [stockList, setStockList] = useState<{ [ticker: string]: { fullExchangeName: string, longName: string } } | undefined>(undefined);
    useEffect(() => {
        const storedStockList = localStorage.getItem('stockList');
        if (storedStockList) {
            setStockList(JSON.parse(storedStockList));
        } else {
            // Fetch from Firebase if not in local storage
            const stockListRef = doc(db, 'stock_list/us');
            getDoc(stockListRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    console.log(data);
                    if (data) {
                        setStockList(data as { [ticker: string]: { fullExchangeName: string, longName: string } });
                        localStorage.setItem('stockList', JSON.stringify(data));
                    }
                } else {
                    console.warn('No stock list found in Firebase');
                }
            }).catch((error) => {
                console.error('Error fetching stock list from Firebase:', error);
            });
        }
    }, []);

    // Function to update selected portfolio and its data
    const updateSelectedPortfolio = (portfolioId: string) => {
        console.log(`Updating selected portfolio to ${portfolioId} ...`);
        if (!auth.currentUser?.email || !portList?.includes(portfolioId)) {
            console.warn('Invalid portfolio selection:', portfolioId);
            return;
        }

        setSelectedPortfolio(portfolioId);
        const newPortPath = `users/${auth.currentUser.email}/portfolios/${portfolioId}`;
        setSelectedPortPath(newPortPath);
    };

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsLoggedin(true);
                console.log(`User is signed in: ${user.email}`);
                // check if user acc is set in the database
                const userPathRef = doc(db, `/users/${user.email}`);
                userDocUnsubscribe = onSnapshot(userPathRef, (userAcc) => {
                    if (!userAcc.exists()) {
                        // User account does not exist, create a new one
                        console.log('No user account found, creating a new one...');
                        setDoc(userPathRef, {
                            email: user.email,
                            createdAt: dayjs().tz().format("YYYY-MM-DD HH:mm:ss z"),
                        }).then(() => {
                            console.log('New user account created successfully');
                        }).catch((error) => {
                            console.error('Error creating user account:', error);
                        });
                    } else {
                        // define the selected portfolio path
                        const defaultPortID = userAcc.data().defaultPortfolio || '';
                        portfolioUnsubscribe = onSnapshot(collection(db, `users/${user.email}/portfolios`), (portfolios) => {
                            const portList = portfolios.docs.map((doc) => doc.id);
                            if (portList.length > 0) {
                                setPortList(portList);
                                console.log('Portfolios fetched:', portList);
                                let selectedPortID = '';
                                if (defaultPortID && portList.includes(defaultPortID)) {
                                    selectedPortID = defaultPortID;
                                } else {
                                    selectedPortID = portList[0]; // Set the first portfolio as default if none is selected
                                }
                                setSelectedPortfolio(selectedPortID);
                                setSelectedPortPath(`users/${user.email}/portfolios/${selectedPortID}`);
                            }
                        })
                    }
                })
            } else {    // User is signed out
                setIsLoggedin(false);
                setPortList(undefined);
                setSelectedPortfolio(undefined);
                setSelectedPortPath(undefined);
                console.log("No user is signed in.");
            }
        });
        // Clean up listeners on unmount
        return () => {
            authUnsubscribe();
            userDocUnsubscribe?.();
            portfolioUnsubscribe?.();
        };
    }, [auth]);

    return (
        <AppContext.Provider value={{
            isLoggedin: isLoggedin,
            portList: portList,
            selectedPortfolio: selectedPortfolio,
            selectedPortPath: selectedPortPath,
            stockList: stockList,
            updateSelectedPortfolio: updateSelectedPortfolio
        }}>
            {children}
        </AppContext.Provider>
    );
}


export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioContextProvider = ({ children }: { children: React.ReactNode }) => {
    const appContext = useContext(AppContext);
    const portfolioSummaryUnsubscribe = useRef<(() => void) | null>(null);
    const positionCurrentUnsubscribe = useRef<(() => void) | null>(null);

    const [selectedPortfolio, setSelectedPortfolio] = useState<string | undefined>(undefined)
    const [selectedPortPath, setSelectedPortPath] = useState<string | undefined>(undefined)
    const [cashBalance, setCashBalance] = useState<number>(0);
    const [marginBalance, setMarginBalance] = useState<number>(0);
    const [positionValue, setPositionValue] = useState<number>(0);
    const [selfCapital, setSelfCapital] = useState<number>(0);
    const [netWorth, setNetWorth] = useState<number>(0);
    const [cashflowCount, setCashflowCount] = useState<number>(0);
    const [transactionCount, setTransactionCount] = useState<number>(0);
    const [mtmTime, setMtmTime] = useState<number>(dayjs().valueOf());
    const [currentPositions, setCurrentPositions] = useState<{ [ticker: string]: SinglePosition } | undefined>(undefined);

    useEffect(() => {
        // Cleanup previous listeners
        if (portfolioSummaryUnsubscribe.current) {
            portfolioSummaryUnsubscribe.current();
            portfolioSummaryUnsubscribe.current = null;
        }
        if (positionCurrentUnsubscribe.current) {
            positionCurrentUnsubscribe.current();
            positionCurrentUnsubscribe.current = null;
        }

        if (!appContext?.selectedPortPath) {
            // Reset state when no portfolio is selected
            setSelectedPortfolio(undefined);
            setSelectedPortPath(undefined);
            setCashBalance(0);
            setMarginBalance(0);
            setPositionValue(0);
            setNetWorth(0);
            setSelfCapital(0);
            setCashflowCount(0);
            setTransactionCount(0);
            setMtmTime(dayjs().valueOf());
            setCurrentPositions(undefined);
            return;
        }
        const portfolioPath = appContext.selectedPortPath;
        setSelectedPortfolio(appContext.selectedPortfolio);
        setSelectedPortPath(portfolioPath);

        try {
            // Set up listener for portfolio summary data
            const portfolioSummaryDocRef = doc(db, `${portfolioPath}/portfolio_summary/current`);
            portfolioSummaryUnsubscribe.current = onSnapshot(portfolioSummaryDocRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as PortfolioContextType;
                    setCashBalance(data.cashBalance);
                    setMarginBalance(data.marginBalance);
                    setPositionValue(data.positionValue);
                    setNetWorth(data.netWorth);
                    setSelfCapital(data.selfCapital);
                    setCashflowCount(data.cashflowCount || 0);
                    setTransactionCount(data.transactionCount || 0);
                    setMtmTime(data.mtmTimeStamp || 0);
                    setCurrentPositions(data.currentPositions || {});
                    console.log(`Portfolio summary for ${appContext.selectedPortfolio} updated`);
                } else {
                    console.log(`No portfolio summary found for ${appContext.selectedPortfolio}`);
                }
            });

        } catch (error) {
            console.error('Error setting up portfolio listeners:', error);
        }

        // Cleanup function
        return () => {
            if (portfolioSummaryUnsubscribe.current) {
                portfolioSummaryUnsubscribe.current();
                portfolioSummaryUnsubscribe.current = null;
            }
            if (positionCurrentUnsubscribe.current) {
                positionCurrentUnsubscribe.current();
                positionCurrentUnsubscribe.current = null;
            }
        };
    }, [appContext?.selectedPortPath, appContext?.selectedPortfolio]);

    return (
        <PortfolioContext.Provider value={{
            selectedPortfolio: selectedPortfolio,
            selectedPortPath: selectedPortPath,
            cashBalance: cashBalance,
            marginBalance: marginBalance,
            positionValue: positionValue,
            netWorth: netWorth,
            selfCapital: selfCapital,
            cashflowCount: cashflowCount,
            transactionCount: transactionCount,
            mtmTimeStamp: mtmTime,
            currentPositions: currentPositions
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}
