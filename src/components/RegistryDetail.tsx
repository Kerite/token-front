import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "../constants";
import React, { useCallback, useEffect, useState } from "react";
import { Flex } from "@radix-ui/themes";
import { addToast, Button, Input, NumberInput } from "@heroui/react";
import { bcs } from "@mysten/sui/bcs";
import { Address } from "../utils";

export interface Registry {
    counter: string;
    id: {
        id: string;
    };
    locks: {
        type: string;
        fields: {
            id: string;
            size: string;
        }
    };
}

export interface Lock {
    readonly registryId: string;
    readonly id: string;
    readonly address: string;
}

export const RegistryDetail = (params: {
    isLoading: boolean,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    registryId: string | undefined | null;
    setLocks: React.Dispatch<React.SetStateAction<Lock[]>>;
}) => {
    const { isLoading, setIsLoading, registryId, setLocks } = params;
    const { mutateAsync: execute } = useSignTransaction();
    const suiClient = useSuiClient();
    const [amount, setAmount] = useState<number>(100_000);
    const currentAccount = useCurrentAccount();

    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>();
    const [unlockTime, setUnlockTime] = useState<string>("0");
    const [lockCount, setLockCount] = useState<string>("0");
    const [beneficiary, setBeneficiary] = useState<string>("");

    const getRegistryDetail = useCallback(async () => {
        if (!registryId || !currentAccount) {
            return;
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::bank::get_registry`,
            arguments: [
                tx.object(registryId)
            ]
        });
        const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: currentAccount.address
        });
        const returnValues = result.results![0].returnValues!;
        setName(bcs.string().parse(Uint8Array.from(returnValues[0][0])));
        setDescription(bcs.string().parse(Uint8Array.from(returnValues[1][0])));
        setUnlockTime(bcs.u64().parse(Uint8Array.from(returnValues[2][0])));
        setLockCount(bcs.u64().parse(Uint8Array.from(returnValues[3][0])));
        setBeneficiary(Address.parse(Uint8Array.from(returnValues[6][0])));
        const lockIds = bcs.vector(bcs.u64()).parse(Uint8Array.from(returnValues[4][0]));
        const lockAddresses = bcs.vector(Address).parse(Uint8Array.from(returnValues[5][0]));
        setLocks(lockAddresses.map((v, i): Lock => ({
            registryId,
            id: lockIds[i],
            address: v
        })));
    }, [registryId, currentAccount, suiClient, setLocks]);

    useEffect(() => {
        const intervalId = setInterval(getRegistryDetail, 1000);
        return () => clearInterval(intervalId);
    }, [getRegistryDetail])

    const handleCreateLock = async () => {
        if (isLoading) return;
        console.log("Creating lock...");
        setIsLoading(true);
        try {
            console.log("Registry id:", registryId);
            if (!registryId) {
                console.error("No registry found");
                return;
            }
            const tx = new Transaction();
            tx.setGasBudget(10000000);
            const [coinToLock] = tx.splitCoins(tx.gas, [amount]);
            tx.moveCall({
                target: `${PACKAGE_ID}::bank::create_lock`,
                typeArguments: [
                    `0x2::sui::SUI`,
                ],
                arguments: [
                    tx.object(registryId),
                    coinToLock,
                ]
            });
            // tx.transferObjects([lockCap], targetAccount);
            const signedTx = await execute({
                transaction: tx
            });
            const resp = await suiClient.executeTransactionBlock({
                transactionBlock: signedTx.bytes,
                signature: signedTx.signature,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });
            if (resp.effects?.status.status === "success") {
                console.log("Lock created successfully:", resp);
                addToast({
                    color: "success",
                    title: "Successfully created lock",
                });
            } else {
                addToast({
                    color: "danger",
                    title: "Failed to create lock",
                });
                console.error("Failed to create lock:", resp);
            }
        } catch (error) {
            console.error("Error creating lock:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Flex direction="column" gap="2">
            <Input label="Registry ID" type="text" value={registryId || ""} readOnly />
            <Input label="Name" value={name} readOnly />
            <Input label="Description" value={description} readOnly />
            <Input label="Expire Time (in ms)" value={unlockTime} readOnly />
            {/* <Input label="Beneficiary" type="text" value={targetAccount} onValueChange={setTargetAccount} /> */}
            <NumberInput label="Amount (MIST)" value={amount} onValueChange={setAmount} endContent={
                <Button onPress={handleCreateLock} isLoading={registryId === null || isLoading}>Create Lock</Button>
            } />
            <Input label="Lock Counter" value={lockCount} readOnly />
            <Input label="Beneficiary" value={beneficiary} readOnly />
        </Flex>
    )
}