import { createContext, useContext, useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import dayjs from "dayjs";

import type { AppContextType, PortfolioBasicInfo, PortfolioContextType, PortfolioSummary, SinglePosition } from "./dataInterface";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
    let userDocUnsubscribe: (() => void) | null = null;
    let selfPortfolioUnsubscribe: (() => void) | null = null;
    let sharedPortfolioUnsubscribe: (() => void) | null = null;

    const [isLoggedin, setIsLoggedin] = useState<boolean>(auth.currentUser !== null);
    const [defaultPortfolio, setDefaultPortfolio] = useState<string | undefined>(undefined)
    const [selfPortfolioList, setSelfPortfolioList] = useState<Record<string, { portfolio_name: string, owner: string }> | undefined>(undefined)
    const [sharedPortfolioList, setSharedPortfolioList] = useState<Record<string, { portfolio_name: string, owner: string }> | undefined>(undefined)
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
        setSelectedPortfolio(portfolioId);
        const newPortPath = `portfolios/${portfolioId}`;
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
                        // --- set default portfolio ---
                        const defaultPortID = userAcc.data().defaultPortfolio || '';
                        setDefaultPortfolio(defaultPortID);

                        console.log(`listening for portfolios belong to the ${user.email}`);
                        // --- find all portfolios belong to the user ---
                        let q = query(collection(db, `portfolios`), where('owner', '==', user.email));
                        selfPortfolioUnsubscribe = onSnapshot(q, (portfolios) => {
                            const selfPortfolioObj = portfolios.docs.reduce((acc, item) => {
                                acc[item.id] = {
                                    portfolio_name: item.data().portfolio_name,
                                    owner: item.data().owner
                                };
                                return acc;
                            }, {} as Record<string, { portfolio_name: string, owner: string }>);

                            if (Object.keys(selfPortfolioObj).length > 0) {
                                setSelfPortfolioList(selfPortfolioObj);
                                console.log('Portfolios fetched:', selfPortfolioObj);
                                let selectedPortID = '';
                                if (defaultPortID && selfPortfolioObj.hasOwnProperty(defaultPortID)) {
                                    selectedPortID = defaultPortID;
                                } else {
                                    selectedPortID = Object.keys(selfPortfolioObj)[0]; // Set the first portfolio as default if none is selected
                                }
                                setSelectedPortfolio(selectedPortID);
                                setSelectedPortPath(`portfolios/${selectedPortID}`);
                            }
                        })

                        // --- find all portfolios shared with the user ---
                        let qShared = query(collection(db, `portfolios`), where('shared_with', 'array-contains', user.email));
                        sharedPortfolioUnsubscribe = onSnapshot(qShared, (portfolios) => {
                            const sharedPortfolioObj = portfolios.docs.reduce((acc, item) => {
                                acc[item.id] = {
                                    portfolio_name: item.data().portfolio_name,
                                    owner: item.data().owner
                                };
                                return acc;
                            }, {} as Record<string, { portfolio_name: string, owner: string }>);
                            if (Object.keys(sharedPortfolioObj).length > 0) {
                                setSharedPortfolioList(sharedPortfolioObj);
                                console.log('Shared portfolios fetched:', sharedPortfolioObj);
                            }
                        })

                    }
                })
            } else {    // User is signed out
                setIsLoggedin(false);
                setSelfPortfolioList(undefined);
                setSharedPortfolioList(undefined);
                setSelectedPortfolio(undefined);
                setSelectedPortPath(undefined);
                console.log("No user is signed in.");
            }
        });
        // Clean up listeners on unmount
        return () => {
            authUnsubscribe();
            userDocUnsubscribe?.();
            selfPortfolioUnsubscribe?.();
            sharedPortfolioUnsubscribe?.();
        };
    }, [auth]);

    return (
        <AppContext.Provider value={{
            isLoggedin: isLoggedin,
            defaultPortfolio: defaultPortfolio,
            selfPortfolioList: selfPortfolioList,
            sharedPortfolioList: sharedPortfolioList,
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
    const portfolioBasicInfoUnsubscribe = useRef<(() => void) | null>(null);
    const portfolioSummaryUnsubscribe = useRef<(() => void) | null>(null);
    const positionCurrentUnsubscribe = useRef<(() => void) | null>(null);

    const [selectedPortfolio, setSelectedPortfolio] = useState<string | undefined>(undefined)
    const [selectedPortPath, setSelectedPortPath] = useState<string | undefined>(undefined)
    const [isSelfPortfolio, setIsSelfPortfolio] = useState<boolean>(false)

    // portfolio basic info states
    const [portfolioName, setPortfolioName] = useState<string>('')
    const [broker, setBroker] = useState<string>('')
    const [note, setNote] = useState<string>('')
    const [owner, setOwner] = useState<string>('')
    const [createdAt, setCreatedAt] = useState<string>('')
    const [sharedWithList, setSharedWithList] = useState<string[]>([]) // Initialize with empty array

    // portfolio summary states
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
        if (portfolioBasicInfoUnsubscribe.current) {
            portfolioBasicInfoUnsubscribe.current();
            portfolioBasicInfoUnsubscribe.current = null;
        }
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
            setIsSelfPortfolio(false);
            setPortfolioName('');
            setBroker('');
            setNote('');
            setOwner('');
            setCreatedAt('');
            setSharedWithList([]);
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
            // Determine if it's self portfolio
            setIsSelfPortfolio(Object.keys(appContext.selfPortfolioList!).includes(appContext.selectedPortfolio!));
        } catch (error) {
            console.error('Error determining portfolio type:', error);
            console.log('appContext:', appContext.selfPortfolioList);
            console.log('selectedPortfolio:', appContext.selectedPortfolio);
        }
        // Set up listener for portfolio basic info
        try {
            const portfolioDocRef = doc(db, portfolioPath);
            portfolioBasicInfoUnsubscribe.current = onSnapshot(portfolioDocRef, (snapshot) => {
                console.log('Listening to portfolio basic info changes...');
                if (snapshot.exists()) {
                    const data = snapshot.data() as PortfolioBasicInfo;
                    console.log('Portfolio basic info data:', data);
                    setPortfolioName(data.portfolio_name);
                    setBroker(data.broker);
                    setNote(data.note);
                    setOwner(data.owner);
                    setCreatedAt(data.created_at ? data.created_at : '');
                    setSharedWithList(data.shared_with);
                    console.log(`Portfolio basic info for ${appContext.selectedPortfolio} updated`);
                } else {
                    console.log(`No portfolio info found for ${appContext.selectedPortfolio}`);
                }
            });
        } catch (error) {
            console.error('Error setting up portfolio listeners:', error);
        }

        // Set up listener for portfolio summary data
        try {
            const portfolioSummaryDocRef = doc(db, `${portfolioPath}/portfolio_summary/current`);
            portfolioSummaryUnsubscribe.current = onSnapshot(portfolioSummaryDocRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as PortfolioSummary;
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
            isSelfPortfolio: isSelfPortfolio,
            portfolio_name: portfolioName,
            broker: broker,
            note: note,
            owner: owner,
            created_at: createdAt,
            shared_with: sharedWithList,
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
