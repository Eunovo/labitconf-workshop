import { useState } from "react";

import { Address, DecoratedUtxo } from "src/types";
import PayToEscrow from "./components/PayToEscrow";

interface Props {
    utxos: DecoratedUtxo[];
    mnemonic: string;
    changeAddresses: Address[]
}

export default function Escrow({ utxos, mnemonic, changeAddresses }: Props) {
    const [currentTab, setCurrentTab] = useState("create");
    

    const tabs = [
        {
            name: "Pay to Escrow Script",
            href: "create",
            current: currentTab === "create",
        },
        // {
        //   name: "Change",
        //   href: "change",
        //   count: changeAddresses.filter((address) => address.type !== "used")
        //     .length,
        //   current: currentTab === "change",
        // },
    ];

    return (
        <div className="min-h-full">
            <main className="flex-1">
                <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-2xl font-semibold text-gray-900">Escrow</h1>
                        <div className="py-4">
                            <div className="max-w-7xl mx-auto bg-white shadow rounded-t-md">
                                {/* Tabs */}
                                <div className="sm:hidden">
                                    <label htmlFor="tabs" className="sr-only">
                                        Select a tab
                                    </label>
                                    <select
                                        id="tabs"
                                        name="tabs"
                                        className="mt-4 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-tabconf-blue-500 focus:border-tabconf-blue-500 sm:text-sm rounded-md"
                                        //   @ts-ignore
                                        defaultValue={tabs.find((tab) => tab.current).name}
                                    >
                                        {tabs.map((tab) => (
                                            <option key={tab.name}>{tab.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="border-b border-gray-200">
                                        <nav
                                            className="mt-2 -mb-px flex space-x-8 px-4 sm:px-6 md:px-4"
                                            aria-label="Tabs"
                                        >
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab.name}
                                                    onClick={() => setCurrentTab(tab.href)}
                                                    className={classNames(
                                                        tab.current
                                                            ? "border-tabconf-blue-500 text-tabconf-blue-600"
                                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200",
                                                        "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                                                    )}
                                                >
                                                    {tab.name}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>

                            {currentTab === "create" ? (
                                (
                                    <PayToEscrow
                                        utxos={utxos}
                                        revocationAddress={changeAddresses[0]}
                                        changeAddress={changeAddresses[1]}
                                    />
                                )
                            ) : null}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}
