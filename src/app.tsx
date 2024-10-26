import React, { useEffect, useState } from "react";
import {
    Card,
    CardBody,
    CardTitle,
} from "@patternfly/react-core/dist/esm/components/Card/index.js";
import HostsTable from "./components/HostsTable";
import { Alert, Button } from "@patternfly/react-core";
import { HostsFileEntry, parseHostsFile, writeHostsFile } from "./lib/hostsFile";

export const Application = () => {
    const [editableHosts, setEditableHosts] = useState([]);
    const [hostsChanged, setHostsChanged] = useState(false);
    const [hostFetchError, setHostFetchError] = useState(false);
    const [hostUpdateError, setHostUpdateError] = useState(false);
    const [hostUpdateSuccess, setHostUpdateSuccess] = useState(false);

    const fetchHosts = async () => {
        try {
            setHostFetchError(false);
            setHostUpdateError(false);
            setHostUpdateSuccess(false);
            const entries = await parseHostsFile();
            setEditableHosts(entries);
            setHostsChanged(false);
        } catch (error) {
            console.error(error);
            setHostFetchError(true);
        }
    };

    useEffect(() => {
        fetchHosts();
    }, []);

    const changeHosts = (newHost: HostsFileEntry, index: number) => {
        setEditableHosts((currentHosts) => {
            return currentHosts.map((host, i) => (i === index ? newHost : host));
        });
        setHostsChanged(true);
    };

    const persistHostChanges = async () => {
        try {
            await writeHostsFile(editableHosts);
            await fetchHosts();
            setHostUpdateSuccess(true);
        } catch (e) {
            console.error(e);
            setHostUpdateError(true);
        }
    };

    return (
        <Card>
            <CardTitle>etc/hosts demo</CardTitle>
            {hostUpdateSuccess && (
                <Alert title="etc/hosts file updated" variant="success" isInline timeout={2000} />

            )}
            {hostUpdateError && (
                <Alert title="etc/hosts could not be updated, try again" variant="danger" isInline timeout={2000} />

            )}
            {hostFetchError && (
                <Alert title="etc/hosts could not be fetched, refresh the page and try again" variant="danger" isInline timeout={2000} />
            )}
            <CardBody>
                <HostsTable hosts={editableHosts} onHostChange={changeHosts} />

                {hostsChanged && (
                    <div>
                        <Button onClick={() => persistHostChanges()}> Change hosts file </Button> {' '}
                        <Button onClick={() => fetchHosts()}> Cancel </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};
