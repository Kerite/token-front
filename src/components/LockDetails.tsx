import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Flex } from "@radix-ui/themes"
import { useEffect, useState } from "react"
import { PACKAGE_ID } from "../constants";
import { addToast, Button, Card, CardBody, Input } from "@heroui/react";
import { bcs } from "@mysten/sui/bcs";
import { Address } from "../utils";
import type { Lock } from "./RegistryDetail";

export const LockDetails = ({ tokenLock }: {
    tokenLock: Lock
}) => {
    const suiClient = useSuiClient();
    const [creator, setCreator] = useState<string>("-");
    const [amount, setAmount] = useState<string>("-");
    const [unlockTime, setUnlockTime] = useState<string>("-");
    const { mutateAsync: signTx } = useSignTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const currentAccount = useCurrentAccount();
    const [isClaimed, setIsClaimed] = useState(false);

    useEffect(() => {
        const getLockDetails = async () => {
            if (!tokenLock || !currentAccount) {
                return;
            }
            try {
                // Fetch lock details from the blockchain or API
                const tx = new Transaction();

                tx.moveCall({
                    target: `${PACKAGE_ID}::bank::get_lock_details`,
                    arguments: [
                        tx.object(tokenLock.address)
                    ],
                    typeArguments: ["0x2::sui::SUI"],
                });

                const result = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: currentAccount.address
                });

                if (result.effects.status.status !== "success") {
                    console.error("Failed to fetch lock details:", result.effects.status);
                    return;
                }

                const returnValues = result.results![0].returnValues!;
                console.log("Lock details returnValues:", returnValues);
                setCreator(Address.parse(Uint8Array.from(returnValues[0][0])));
                // setBeneficiary(Address.parse(Uint8Array.from(returnValues[0][0]!)));
                setAmount(bcs.u64().parse(Uint8Array.from(returnValues[1][0])));
                setUnlockTime(bcs.u64().parse(Uint8Array.from(returnValues[2][0])));
                setIsClaimed(bcs.bool().parse(Uint8Array.from(returnValues[3][0])));
            } catch (err) {
                console.error(err);
            }
        }

        getLockDetails();
    }, [suiClient, currentAccount, tokenLock]);

    const handleClaim = async () => {
        setIsLoading(true);
        try {
            if (!tokenLock || !currentAccount) {
                console.error("Missing registry object ID or lockCap");
                return;
            }
            const tx = new Transaction();
            tx.setGasBudget(10000000);
            const claimedTokens = tx.moveCall({
                target: `${PACKAGE_ID}::bank::claim_tokens`,
                arguments: [
                    tx.object(tokenLock.address),
                    tx.object("0x6")
                ],
                typeArguments: ["0x2::sui::SUI"]
            });
            tx.transferObjects([claimedTokens], currentAccount.address);
            const signedTx = await signTx({ transaction: tx });
            const claimResult = await suiClient.executeTransactionBlock({
                transactionBlock: signedTx.bytes,
                signature: signedTx.signature,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });
            console.log("Claim result:", claimResult);
            if (claimResult.effects?.status.status === "success") {
                addToast({
                    color: "success",
                    title: "Successfully claimed tokens",
                });
            } else {
                addToast({
                    color: "danger",
                    title: "Claim transaction failed",
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardBody>
                <Flex direction="column" gap="2">
                    <Input label="Lock object ID" type="text" value={tokenLock.address || ""} readOnly />
                    <Input label="Lock ID" type="text" value={tokenLock.id || ""} readOnly />
                    <Input label="Creator" type="text" value={creator} readOnly />
                    <Input label="Amount (MIST)" value={amount} readOnly />
                    <Input label="Unlock Time (ms)" value={unlockTime} readOnly />
                    <Input label="Is Claimed" value={isClaimed ? "Yes" : "No"} readOnly />
                    <Button onPress={handleClaim} isDisabled={isLoading}>Claim Tokens</Button>
                </Flex>
            </CardBody>
        </Card>
    )
}