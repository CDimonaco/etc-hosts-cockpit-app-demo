import React from "react";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { Button, TextInput, KeyTypes } from "@patternfly/react-core";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import CheckIcon from "@patternfly/react-icons/dist/esm/icons/check-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
// @ts-expect-error style file is broken on commonjs
import inlineEditStyles from "@patternfly/react-styles/css/components/InlineEdit/inline-edit.mjs";
import { css } from "@patternfly/react-styles";
import { HostsFileEntry } from "../lib/hostsFile";

interface EditButtonsCellProps {
  onClick: (type: "save" | "cancel" | "edit") => void;
  elementToFocusOnEditRef?: React.MutableRefObject<HTMLElement>;
  rowAriaLabel: string;
}

type ColumnNames<T> = { [K in keyof T]: string };

interface EditableRow {
  data: HostsFileEntry;
  columnNames: ColumnNames<HostsFileEntry>;
  saveChanges: (editedData: HostsFileEntry) => void;
  ariaLabel: string
}

interface EditableCellProps {
  dataLabel: string;
  staticValue: React.ReactNode;
  editingValue: React.ReactNode;
}

interface HostsTableProps {
  hosts: HostsFileEntry[];
  onHostChange: (entry: HostsFileEntry, index: number) => void
}

const EditButtonsCell: React.FunctionComponent<EditButtonsCellProps> = ({
    onClick,
    elementToFocusOnEditRef,
    rowAriaLabel = "row",
}) => {
    const editButtonRef = React.useRef<HTMLButtonElement>();

    const onKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        button: "edit" | "stopEditing",
    ) => {
        const focusRef =
      button === "edit" ? elementToFocusOnEditRef : editButtonRef;

        if (event.key === KeyTypes.Enter || event.key === KeyTypes.Space) {
            // because space key triggers click event before keyDown, we have to prevent default behaviour and trigger click manually
            event.preventDefault();
            (event.target as HTMLButtonElement).click();
            setTimeout(() => {
                focusRef?.current?.focus();
            }, 0);
        }
    };

    return (
        <>
            <Td
        dataLabel="Save and cancel buttons"
        className={css(
            inlineEditStyles.inlineEditGroup,
            inlineEditStyles.modifiers.iconGroup,
            inlineEditStyles.modifiers.actionGroup,
        )}
            >
                <div
          className={css(
              inlineEditStyles.inlineEditAction,
              inlineEditStyles.modifiers.valid,
          )}
                >
                    <Button
            aria-label={`Save edits of ${rowAriaLabel}`}
            onClick={() => onClick("save")}
            onKeyDown={(event) => onKeyDown(event, "stopEditing")}
            variant="plain"
                    >
                        <CheckIcon />
                    </Button>
                </div>
                <div className={css(inlineEditStyles.inlineEditAction)}>
                    <Button
            aria-label={`Discard edits of ${rowAriaLabel}`}
            onClick={() => onClick("cancel")}
            onKeyDown={(event) => onKeyDown(event, "stopEditing")}
            variant="plain"
                    >
                        <TimesIcon />
                    </Button>
                </div>
            </Td>
            <Td
        dataLabel="Edit button"
        className={css(
            inlineEditStyles.inlineEditAction,
            inlineEditStyles.modifiers.enableEditable,
        )}
            >
                <Button
          ref={editButtonRef}
          aria-label={`Edit ${rowAriaLabel}`}
          onClick={() => onClick("edit")}
          onKeyDown={(event) => onKeyDown(event, "edit")}
          variant="plain"
                >
                    <PencilAltIcon />
                </Button>
            </Td>
        </>
    );
};

const EditableCell: React.FunctionComponent<EditableCellProps> = ({
    dataLabel,
    staticValue,
    editingValue,
}) => {
    return (
        <Td dataLabel={dataLabel}>
            <div className={css(inlineEditStyles.inlineEditValue)}>{staticValue}</div>
            <div className={css(inlineEditStyles.inlineEditInput)}>
                {editingValue}
            </div>
        </Td>
    );
};

const EditableRow: React.FunctionComponent<EditableRow> = ({
    data,
    columnNames,
    saveChanges,
    ariaLabel,
}) => {
    const [editable, setEditable] = React.useState(false);
    const [editedData, setEditedData] = React.useState(data);

    const inputRef = React.useRef();

    return (
        <Tr
      className={css(
          inlineEditStyles.inlineEdit,
          editable ? inlineEditStyles.modifiers.inlineEditable : "",
      )}
        >
            <EditableCell
        dataLabel={columnNames.ipAddress}
        staticValue={data.ipAddress}
        editingValue={
            <TextInput
            aria-label={`${columnNames.ipAddress} ${ariaLabel}`}
            ref={inputRef}
            value={editedData.ipAddress}
            onChange={(e) =>
                setEditedData((data) => ({
                    ...data,
                    ipAddress: (e.target as HTMLInputElement).value,
                }))}
            />
        }
            />
            <EditableCell
        dataLabel={columnNames.hostname}
        staticValue={data.hostname}
        editingValue={
            <TextInput
            aria-label={`${columnNames.hostname} ${ariaLabel}`}
            ref={inputRef}
            value={editedData.hostname}
            onChange={(e) =>
                setEditedData((data) => ({
                    ...data,
                    hostname: (e.target as HTMLInputElement).value,
                }))}
            />
        }
            />
            <EditButtonsCell
        onClick={(type) => {
            setEditable(false);
            if (type === 'edit') {
                setEditable(true);
            }
            if (type === 'save') {
                if (editedData.hostname !== data.hostname || editedData.ipAddress !== data.ipAddress) {
                    saveChanges(editedData);
                }
            }
            setEditedData(data);
        }}
        rowAriaLabel={ariaLabel}
        elementToFocusOnEditRef={inputRef}
            />
        </Tr>
    );
};

export const HostsTable: React.FunctionComponent<HostsTableProps> = ({ hosts, onHostChange }) => {
    // const [rows, setRows] = React.useState(hosts);

    const columnNames: ColumnNames<HostsFileEntry> = {
        ipAddress: "IP Address",
        hostname: "Hostname",
    };

    return (
        <Table aria-label="hosts file table">
            <Thead>
                <Tr>
                    <Th>{columnNames.ipAddress}</Th>
                    <Th>{columnNames.hostname}</Th>
                    <Th screenReaderText="Row edit actions" />
                </Tr>
            </Thead>
            <Tbody>
                {hosts.map((data, index) => (
                    <EditableRow
            key={index}
            data={data}
            columnNames={columnNames}
            saveChanges={(editedRow) => {
                onHostChange(editedRow, index);
            }}
            ariaLabel={`row ${index + 1}`}
                    />
                ))}
            </Tbody>
        </Table>
    );
};

export default HostsTable;
