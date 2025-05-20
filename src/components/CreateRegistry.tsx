import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "../constants";
import { addToast, Button, Card, CardBody, Input, NumberInput } from "@heroui/react";
import { useState } from "react";
import { Flex } from "@radix-ui/themes";

export default function CreateRegistry({
    isLoading,
    setIsLoading
}: {
    isLoading: boolean,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [expireTime, setExpireTime] = useState<number>(100_000);
    const [beneficiary, setBeneficiary] = useState<string>("");

    const { mutateAsync: signTx } = useSignTransaction();

    const utf8Encoder = new TextEncoder();

    const handleCreateRegistry = async () => {
        setIsLoading(true);
        console.log("Creating registry...");
        try {
            if (!currentAccount) {
                console.error("No current account found");
                return;
            }
            const tx = new Transaction();
            tx.setGasBudget(10000000);
            tx.moveCall({
                target: `${PACKAGE_ID}::bank::init_registry`,
                arguments: [
                    tx.pure.vector("u8", utf8Encoder.encode(name)),
                    tx.pure.vector("u8", utf8Encoder.encode(description)),
                    tx.pure.u64(Date.now() + expireTime),
                    tx.pure.address(beneficiary),
                    tx.object("0x6"),
                ]
            });
            // tx.moveCall({
            //     target: `0x2::transfer::share_object`,
            //     typeArguments: ["0x86024984844b585af3b5bc7947aaedda8a5fb8b4d97004111c4153473f76c20e::vault::Registry<0x2::sui::SUI>"],
            //     arguments: [registry]
            // })
            // tx.transferObjects([registry], currentAccount.address);
            const signedTx = await signTx({ transaction: tx });
            const resp = await suiClient.executeTransactionBlock({
                transactionBlock: signedTx.bytes,
                signature: signedTx.signature,
                options: {
                    showEffects: true,
                }
            });
            if (resp?.effects?.status.status === "success") {
                addToast({
                    color: "success",
                    title: "Registry created successfully",
                });
                console.log("Registry created successfully:", resp);
            } else {
                addToast({
                    color: "danger",
                    title: "Failed to create registry",
                });
                console.error("Failed to create registry:", resp?.effects?.status);
            }
        } catch (error) {
            console.error("Error creating registry:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardBody>
                <Flex direction="column" gap="2">
                    <Input label="Name" value={name} onValueChange={setName} />
                    <Input label="Description" value={description} onValueChange={setDescription} />
                    <Input label="Beneficiary" value={beneficiary} onValueChange={setBeneficiary} />
                    <NumberInput label="Unlock Time (in ms)" value={expireTime} onValueChange={setExpireTime} />
                    <Button onPress={handleCreateRegistry} disabled={isLoading}>Create Registry</Button>
                </Flex>
            </CardBody>
        </Card>
    )
}