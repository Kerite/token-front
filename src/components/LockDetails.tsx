import { useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Flex } from "@radix-ui/themes"
import { useEffect, useState } from "react"
import { PACKAGE_ID } from "../constants";
import type { LockCap } from "./LockCapList";
import { Input, NumberInput } from "@heroui/react";

export const LockDetails = ({ registryObjId, lockCap }: {
    registryObjId: string | null;
    lockCap: LockCap | null;
}) => {
    const suiClient = useSuiClient();
    const [timeRemaining] = useState<number | null>(null);
    const [amount] = useState<number | null>(null);

    useEffect(() => {
        const getLockDetails = async () => {
            if (!registryObjId || !lockCap) {
                console.error("Missing registry object ID or lockCap");
                return;
            }
            console.log("Fetching lock details for ID:", lockCap);
            // Fetch lock details from the blockchain or API
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::vault::get_lock_details`,
                arguments: [
                    tx.object(registryObjId),
                    tx.pure.u64(lockCap.lock_id),
                ],
                typeArguments: ["0x2::sui::SUI"],
            });

            const result = await suiClient.devInspectTransactionBlock({
                transactionBlock: tx,
                sender: '0x0' // Dummy sender for read-only operations
            });

            console.log("Lock details result:", result);
        }

        getLockDetails();
    }, [registryObjId, lockCap, suiClient]);

    return (
        <Flex direction="column" gap="2">
            <Input label="Lock object ID" type="text" value={lockCap?.id.id || ""} readOnly />
            <Input label="Lock ID" type="text" value={lockCap?.lock_id || ""} readOnly />
            <Input label="Time Remaining" type="text" value={timeRemaining?.toString() || ""} readOnly />
            <Input label="Beneficiary" type="text" value={lockCap?.beneficiary || ""} readOnly />
            <NumberInput label="Amount" value={amount || 0} readOnly />
        </Flex>
    )
}