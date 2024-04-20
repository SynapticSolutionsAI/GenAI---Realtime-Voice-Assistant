"use client";

import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveSchema,
  LiveTranscriptionEvents,
  SpeakSchema,
  //createClient, //added this
} from "@deepgram/sdk";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef, //addedthis
} from "react";
import { useToast } from "./Toast";
//const express = require("express"); //added this add to dependencies. had to install fs too.
//const dotenv = require("dotenv"); //added this. need to add dotenv to install requirements
//dotenv.config();

type DeepgramContext = {
  ttsOptions: SpeakSchema | undefined;
  setTtsOptions: Dispatch<SetStateAction<SpeakSchema | undefined>>;
  sttOptions: LiveSchema | undefined;
  setSttOptions: Dispatch<SetStateAction<LiveSchema | undefined>>;
  connection: LiveClient | undefined;
  connectionReady: boolean;
};

interface DeepgramContextInterface {
  children: React.ReactNode;
}

const DeepgramContext = createContext({} as DeepgramContext);

/**
 * TTS Voice Options
 */
const voices: {
  [key: string]: {
    name: string;
    avatar: string;
    language: string;
    accent: string;
  };
} = {
  "aura-asteria-en": {
    name: "Asteria",
    avatar: "/aura-asteria-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-luna-en": {
    name: "Luna",
    avatar: "/aura-luna-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-stella-en": {
    name: "Stella",
    avatar: "/aura-stella-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-athena-en": {
    name: "Athena",
    avatar: "/aura-athena-en.svg",
    language: "English",
    accent: "UK",
  },
  "aura-hera-en": {
    name: "Hera",
    avatar: "/aura-hera-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-orion-en": {
    name: "Orion",
    avatar: "/aura-orion-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-arcas-en": {
    name: "Arcas",
    avatar: "/aura-arcas-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-perseus-en": {
    name: "Perseus",
    avatar: "/aura-perseus-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-angus-en": {
    name: "Angus",
    avatar: "/aura-angus-en.svg",
    language: "English",
    accent: "Ireland",
  },
  "aura-orpheus-en": {
    name: "Orpheus",
    avatar: "/aura-orpheus-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-helios-en": {
    name: "Helios",
    avatar: "/aura-helios-en.svg",
    language: "English",
    accent: "UK",
  },
  "aura-zeus-en": {
    name: "Zeus",
    avatar: "/aura-zeus-en.svg",
    language: "English",
    accent: "US",
  },
};

const voiceMap = (model: string) => {
  return voices[model];
};

const getApiKey = async (): Promise<string> => {
  console.log('getting a new api key');
  const result: CreateProjectKeyResponse = await (
    await fetch("/api/authenticate", { cache: "no-store" })
  ).json();

  return result.key;
};

const DeepgramContextProvider = ({ children }: DeepgramContextInterface) => {
  const { toast } = useToast();
  const [ttsOptions, setTtsOptions] = useState<SpeakSchema>();
  const [sttOptions, setSttOptions] = useState<LiveSchema>();
  const [connection, setConnection] = useState<LiveClient>();
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectionReady, setConnectionReady] = useState<boolean>(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false; // Set to false when the component unmounts
    };
  }, []);

  const connect = useCallback(async () => {
    if (!connection && !connecting && isMounted.current) {
      setConnecting(true);
     
      // const deepgramClient = createClient(await getApiKey());
      // const connection = deepgramClient.listen.live({
      //   model: "nova-2",
      //   interim_results: true,
      //   smart_format: true,
      //   endpointing: 550,
      //   utterance_end_ms: 1500,
      //   filler_words: true,
      // });
      try {
        const apiKey = await getApiKey();
        const connection = new LiveClient(apiKey, {}, 
          {
            model: "nova-2",
            interim_results: true,
            smart_format: true,
            endpointing: 550,
            utterance_end_ms: 1500,
            filler_words: true,
          });

        if (isMounted.current){
          console.log('connected');
          setConnection(connection);
          setConnecting(false);
        }
      } catch (error) {
        console.error('Error establishing connection:', error);
        toast("Failed to establish connection due to an error.");
        if (isMounted.current){
          setConnecting(false);
        }
      }      
      // const connection = new LiveClient(
      //   await getApiKey(),
      //   {},
      //   {
      //     model: "nova-2",
      //     interim_results: true,
      //     smart_format: true,
      //     endpointing: 550,
      //     utterance_end_ms: 1500,
      //     filler_words: true,
      //   }
      // );

      // console.log('first connection');
      // setConnection(connection);
      // setConnecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connecting, connection]);

  useEffect(() => {
    // it must be the first open of the page, let's set up the defaults
    /**
     * Default TTS Voice when the app loads.
     */
    if (ttsOptions === undefined) {
      console.log('ttsOptions');
      setTtsOptions({
        model: "aura-asteria-en",
      });
    }

    if (sttOptions === undefined) {
      console.log('!sttoptions');
      setSttOptions({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        endpointing: 550,
        utterance_end_ms: 1500,
        filler_words: true,
      });
    }

    if (connection === undefined) {
      console.log('undefined connection, then connect');
      connect();
    }
  }, [connect, connection, sttOptions, ttsOptions]);

  useEffect(() => {
    // Add listeners only if the connection is ready
    if (connection) {
      const handleOpen = () => {
        setConnectionReady(true);
        console.log('connected');
      };
  
      const handleClose = () => {
        toast("The connection to Deepgram closed, we'll attempt to reconnect.");
        setConnectionReady(false);
        console.log('closed');
      };
  
      const handleError = (err) => {
        toast("An unknown error occurred. We'll attempt to reconnect to Deepgram.");
        setConnectionReady(false);
        setConnection(undefined);
      };
  
      connection.addListener(LiveTranscriptionEvents.Open, handleOpen);
      connection.addListener(LiveTranscriptionEvents.Close, handleClose);
      connection.addListener(LiveTranscriptionEvents.Error, handleError);
  
      // Return a cleanup function
      return () => {
        connection.removeListener(LiveTranscriptionEvents.Open, handleOpen);
        connection.removeListener(LiveTranscriptionEvents.Close, handleClose);
        connection.removeListener(LiveTranscriptionEvents.Error, handleError);
        if (connection.getReadyState() !== undefined) {
          setConnectionReady(false);
        }
      };
    }
  }, [connection, toast]);

  // useEffect(() => {
  //   if (connection && connection?.getReadyState() !== undefined) {
  //     connection.addListener(LiveTranscriptionEvents.Open, () => {
  //       setConnectionReady(true);
  //       console.log('connected');
  //     });

  //     connection.addListener(LiveTranscriptionEvents.Close, () => {
  //       toast("The connection to Deepgram closed, we'll attempt to reconnect.");
  //       setConnectionReady(false);
  //       connection.removeAllListeners();
  //       setConnection(undefined);
  //       console.log('closed');
  //     });

  //     connection.addListener(LiveTranscriptionEvents.Error, (err) => {
  //       toast(
  //         "An unknown error occured. We'll attempt to reconnect to Deepgram." 
  //       );
  //       console.error(err);
  //       setConnectionReady(false);
  //       connection.removeAllListeners();
  //       setConnection(undefined);
  //     });
  //   }

  //   return () => {
  //     setConnectionReady(false);
  //     connection?.removeAllListeners();
  //   };
  // }, [connection, toast]);

  return (
    <DeepgramContext.Provider
      value={{
        ttsOptions,
        setTtsOptions,
        sttOptions,
        setSttOptions,
        connection,
        connectionReady,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram() {
  return useContext(DeepgramContext);
}

export { DeepgramContextProvider, useDeepgram, voiceMap, voices };
