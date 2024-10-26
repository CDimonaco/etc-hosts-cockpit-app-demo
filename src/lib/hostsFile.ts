import cockpit from 'cockpit';

export interface HostsFileEntry {
  ipAddress: string;
  hostname: string;
}

interface HostsFileRow {
  ipAddress: string
  hostnames: string[]
}

type GroupedEntries = Record<string, string[]>

const parseHostsFileLine = (line: string) : HostsFileRow => {
    const lineWithoutComments = line.replace(/#.*/, '');
    const [, ip, hostnames] = /^\s*?(.+?)\s+(.+?)\s*$/.exec(lineWithoutComments);
    return { ipAddress: ip, hostnames: hostnames.split(" ") };
};
const buildHostsFileLine = (ip: string, hostnames: string[]) => `${ip} ${hostnames.join(" ")}`;

const modifyHostFileContent = (fileContent: string, groupedEntries: GroupedEntries): string => {
    const fileByLines = fileContent.split('\n');

    for (const [index, line] of fileByLines.entries()) {
        if (line.startsWith('#') || line === '') {
            continue;
        }

        const { ipAddress } = parseHostsFileLine(line);

        if (groupedEntries[ipAddress]) {
            // replace the file line with the new entries for the ip
            fileByLines[index] = buildHostsFileLine(ipAddress, groupedEntries[ipAddress]);
        }
    }

    return fileByLines.join("\n");
};

export const writeHostsFile = async (entries: HostsFileEntry[]) => {
    const entriesGroupedByIp = entries.reduce<GroupedEntries>((acc, curr) => {
        if (acc[curr.ipAddress]) {
            return {
                ...acc,
                [curr.ipAddress]: [...acc[curr.ipAddress], curr.hostname]
            };
        }
        return {
            ...acc,
            [curr.ipAddress]: [curr.hostname]
        };
    }, {});

    await cockpit.file('/etc/hosts', { superuser: 'require' })
            .modify((currentFile) => modifyHostFileContent(currentFile, entriesGroupedByIp));
};

export const parseHostsFile = async () : Promise<HostsFileEntry[]> => {
    const hostsFile = cockpit.file("/etc/hosts");
    const fileContent = await hostsFile.read();

    const entries = fileContent.split("\n").reduce((acc, curr) => {
        if (curr.startsWith('#') || curr === '') {
            return acc;
        }
        const { ipAddress, hostnames } = parseHostsFileLine(curr);

        const entryForHostnames = hostnames.map((h) => ({
            ipAddress,
            hostname: h
        }));
        return [...acc, ...entryForHostnames];
    }, []);

    hostsFile.close();

    return entries;
};
