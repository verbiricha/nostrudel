import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Text,
  Badge,
} from "@chakra-ui/react";
import { SyntheticEvent, useEffect, useState } from "react";
import { TrashIcon, UndoIcon } from "../../components/icons";
import useSubject from "../../hooks/use-subject";
import { RelayFavicon } from "../../components/relay-favicon";
import clientRelaysService from "../../services/client-relays";
import { RelayConfig, RelayMode } from "../../classes/relay";
import { useList } from "react-use";
import { RelayUrlInput } from "../../components/relay-url-input";
import { useRelayInfo } from "../../hooks/use-client-relays copy";

export const RelaysView = () => {
  const relays = useSubject(clientRelaysService.relays);

  const info = useRelayInfo("wss://nostr.wine");

  const [pendingAdd, addActions] = useList<RelayConfig>([]);
  const [pendingRemove, removeActions] = useList<RelayConfig>([]);

  useEffect(() => {
    addActions.clear();
    removeActions.clear();
  }, [relays, addActions, removeActions]);

  const [saving, setSaving] = useState(false);
  const [relayInputValue, setRelayInputValue] = useState("");

  const handleRemoveRelay = (relay: RelayConfig) => {
    if (pendingAdd.includes(relay)) {
      addActions.filter((r) => r !== relay);
    } else if (pendingRemove.includes(relay)) {
      removeActions.filter((r) => r !== relay);
    } else {
      removeActions.push(relay);
    }
  };
  const handleAddRelay = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRelayInputValue("");

    const url = relayInputValue;
    if (!relays.some((r) => r.url === url) && !pendingAdd.some((r) => r.url === url)) {
      addActions.push({ url, mode: RelayMode.ALL });
    }
  };
  const savePending = async () => {
    setSaving(true);
    const newRelays = relays.concat(pendingAdd).filter((r) => !pendingRemove.includes(r));
    await clientRelaysService.postUpdatedRelays(newRelays);
    setSaving(false);
  };

  const hasPending = pendingAdd.length > 0 || pendingRemove.length > 0;

  return (
    <Flex direction="column" pt="2" pb="2" overflow="auto">
      <TableContainer mb="4">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Url</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {[...relays, ...pendingAdd].map((relay, i) => (
              <Tr key={relay.url + i}>
                <Td>
                  <Flex alignItems="center">
                    <RelayFavicon size="xs" relay={relay.url} mr="2" />
                    <Text>{relay.url}</Text>
                  </Flex>
                </Td>
                <Td isNumeric>
                  {pendingAdd.includes(relay) && (
                    <Badge colorScheme="green" mr="2">
                      Add
                    </Badge>
                  )}
                  {pendingRemove.includes(relay) && (
                    <Badge colorScheme="red" mr="2">
                      Remove
                    </Badge>
                  )}
                  <IconButton
                    icon={pendingRemove.includes(relay) ? <UndoIcon /> : <TrashIcon />}
                    title="Toggle Remove"
                    aria-label="Toggle Remove"
                    size="sm"
                    onClick={() => handleRemoveRelay(relay)}
                    isDisabled={saving}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <form onSubmit={handleAddRelay}>
        <FormControl>
          <FormLabel htmlFor="relay-url-input">Add Relay</FormLabel>
          <Flex gap="2">
            <RelayUrlInput
              id="relay-url-input"
              value={relayInputValue}
              onChange={(e) => setRelayInputValue(e.target.value)}
              isRequired
            />
            <Button type="submit" isDisabled={saving}>
              Add
            </Button>
          </Flex>
        </FormControl>
      </form>

      <Flex justifyContent="flex-end" gap="2">
        <Button type="submit" onClick={savePending} isDisabled={saving || !hasPending}>
          Reset
        </Button>
        <Button type="submit" isLoading={saving} onClick={savePending} isDisabled={!hasPending}>
          Save Changes
        </Button>
      </Flex>
    </Flex>
  );
};
