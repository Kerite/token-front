import { useCallback, useEffect, useState } from "react";
import { REGISTRIES } from "../constants";
import { useSuiClient } from "@mysten/dapp-kit";
import type { Registry } from "./RegistryDetail";
import { Select, SelectItem } from "@heroui/react";

export const RegistryList = ({ setRegistry }: {
    setRegistry: React.Dispatch<React.SetStateAction<Registry | null>>;
}) => {
    const [registries, setRegistries] = useState<Registry[]>([]);
    const suiClient = useSuiClient();

    const getRegistries = useCallback(async () => {
        const data = await Promise.all(REGISTRIES.map(async (registryId): Promise<Registry> => {
            const res = await suiClient.getObject({
                id: registryId,
                options: {
                    showContent: true,
                    showType: true,
                    showBcs: true,
                }
            });
            const content = res.data?.content as unknown as { fields: Registry };
            return {
                counter: content.fields.counter,
                id: content.fields.id,
                locks: content.fields.locks,
            }
        }));
        setRegistries(data);
    }, [suiClient, setRegistries]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            getRegistries();
        }, 1000);
        return () => clearInterval(intervalId);
    }, [getRegistries]);

    return (
        <Select label="Select Registry" onSelectionChange={(keys) => {
            const { currentKey } = keys;
            const selectedRegistry = registries.find(registry => registry.id.id === currentKey);
            setRegistry(selectedRegistry || null);
        }}>
            {registries.map((registry) => (
                <SelectItem key={registry.id.id} onSelect={() => setRegistry(registry)}>
                    {registry.id.id}
                </SelectItem>
            ))}
        </Select>
    )
}