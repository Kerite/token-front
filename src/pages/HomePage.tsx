import { useState } from "react";
import CreateRegistry from "../components/CreateRegistry";
import { RegistryDetail, type Registry, type Lock } from "../components/RegistryDetail";
import { RegistryList } from "../components/RegistryList";
import { Card, CardBody, Select, SelectItem } from "@heroui/react";
import { LockDetails } from "../components/LockDetails";

export function HomePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(null);
    const [locks, setLocks] = useState<Lock[]>([]);
    const [selectedLock, setSelectedLock] = useState<Lock | null>(null);

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "20px",
            padding: "20px"
        }}>
            <div style={{
                width: "200px",
                padding: "10px"
            }}>
            </div>
            <div style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                gap: 15
            }}>
                <CreateRegistry
                    isLoading={isLoading}
                    setIsLoading={setIsLoading} />
                <RegistryList setRegistry={setSelectedRegistry} />
                {selectedRegistry && (
                    <Card>
                        <CardBody style={{ gap: 15 }}>
                            <RegistryDetail
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                                registryId={selectedRegistry.id.id}
                                setLocks={setLocks} />
                        </CardBody>
                    </Card>
                )}
                <Select
                    items={locks}
                    selectionMode="single"
                    selectedKeys={[selectedLock?.address || locks[0]?.address]}
                    onSelectionChange={(keys) => {
                        const { anchorKey } = keys;
                        setSelectedLock(locks.find(lock => lock.address === anchorKey) || null);
                    }}
                    label="Select Lock" >
                    {(lock) => (
                        <SelectItem key={lock.address}>{`(${lock.id}) ${lock.address}`}</SelectItem>
                    )}
                </Select>
                {(selectedLock || locks[0]) && <LockDetails tokenLock={selectedLock || locks[0]} />}
            </div>
            <div style={{
                width: "200px",
                padding: "10px"
            }}>
            </div>
        </div>
    );
}