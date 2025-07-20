import { createContext, useEffect, useState } from "react";
import type { AppContextType } from "./dataInterface";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import dayjs from "dayjs";

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
    let userDocUnsubscribe: (() => void) | null = null;
    let portfolioUnsubscribe: (() => void) | null = null;

    const [isLoggedin, setIsLoggedin] = useState<boolean>(false)
    const [portList, setPortList] = useState<string[] | undefined>(undefined)
    const [selectedPortfolio, setSelectedPortfolio] = useState<string | undefined>(undefined)
    const [selectedPortPath, setSelectedPortPath] = useState<string | undefined>(undefined)
    const [cashflowCount, setCashflowCount] = useState<number>(0)
    const [transactionCount, setTransactionCount] = useState<number>(0)
    const [mtmTime, setMtmTime] = useState<string | undefined>(undefined)

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
                        const defaultPortID = userAcc.data().default_portfolio || '';
                        portfolioUnsubscribe = onSnapshot(collection(db, `users/${user.email}/portfolios`), (portfolios) => {
                            const portList = portfolios.docs.map((doc) => doc.id);
                            if (portList.length > 0) {
                                setPortList(portList);
                                console.log('Portfolios fetched:', portList);
                                if (defaultPortID) {
                                    setSelectedPortfolio(defaultPortID);
                                    setSelectedPortPath(`users/${user.email}/portfolios/${defaultPortID}`);
                                } else {
                                    setSelectedPortfolio(portList[0]); // Set the first portfolio as default if none is selected
                                    setSelectedPortPath(`users/${user.email}/portfolios/${portList[0]}`);
                                }
                            }
                        })
                    }
                })
            } else {
                // User is signed out
                setIsLoggedin(false);
                setPortList(undefined);
                setSelectedPortfolio(undefined);
                setSelectedPortPath(undefined);
                setCashflowCount(0);
                setTransactionCount(0);
                setMtmTime(undefined);
                console.log("No user is signed in.");
            }
        });
        return () => {
            authUnsubscribe();
            if (userDocUnsubscribe) userDocUnsubscribe();
            if (portfolioUnsubscribe) portfolioUnsubscribe();
        };
    }, [auth]);

    return (
        <AppContext.Provider value={{
            isLoggedin: isLoggedin,
            portList: portList,
            selectedPortfolio: selectedPortfolio,
            selectedPortPath: selectedPortPath,
            cashflowCount: cashflowCount,
            transactionCount: transactionCount,
            mtmTime: mtmTime
        }}>
            {children}
        </AppContext.Provider>
    );
}