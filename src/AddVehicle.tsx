import { assign, createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import { interpret } from "xstate";

import { Year } from "./Year";
import { Make } from "./Make";

// Inspiration: https://codesandbox.io/s/crckp

export interface VehicleMachineContext {
  year: string;
  make: string;
}

export type VehicleMachineEvent =
  | {
      type: "INPUT_CHANGE";
      name: string;
      value: string;
    }
  | {
      type: "BACK";
    }
  | {
      type: "CONTINUE";
    };

const addVehicleMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcwAsCWBjANmAdAJ5gCGATgMQCSAcgAoCqAKgPoDCAEgII0DiAoolAAHAPawMAFwyiAdkJAAPRABYAjPgCc2zQA4VABjUBmAKwAmEwBoQhROZX5Ta87rWnT68wDZvPlQC+ATaomLgExOQUbADyNEy0DIJIIGIS0nIKygjmBo7Ged4A7EXeBqa63qZFNnYIanr45qbeuppFxiqmms4GRUEh6Nh4+AC2JADWYNT0zOzcfMki4lIy8inZxsYalXp91d6G5pq19o7Oru6eLr7+AyChwwTjUxQAQlxsANIKaauZGzO5nwfhU2iMzRKnVO9VMBi0KkRDX0HRapXuj3CY0m01i8USS1SKwy61A2TKjk0ahKRQcvl0unM5hhagZWlcxjanNpBkqpiCwRAslEEDgCkxI0iZF+xLWWUQ3mMILUXVpHRU+mcKhZjPwBj0mm8amNumcRRU5gxQyxLzAMvScsBCC8+CKVJ8umMmj6e1MOuB+raRpNZsCgolBAgcjtKT+JPlCG98JK3XMRTaDLUfhZhvZ5qpBUOmhUxitYTw9v+pKUiGpWh0+iMZksxhhAFoNfguqb1IcfEU4f0BUA */
  createMachine<VehicleMachineContext, VehicleMachineEvent>({
    context: { year: "", make: "" },
    id: "vehicle",
    initial: "year",
    states: {
      year: {
        on: {
          INPUT_CHANGE: {
            actions: assign({
              year: (ctx, e) => e.value,
              // If the user clicked "back" and just changed the year, clear the make.
              make: (ctx, e) => (ctx.year === e.value ? ctx.make : ""),
            }),
          },
          CONTINUE: {
            target: "make",
          },
        },
      },
      make: {
        on: {
          INPUT_CHANGE: {
            actions: assign({
              make: (ctx, e) => e.value,
            }),
          },
          BACK: {
            target: "year",
          },
          CONTINUE: {
            target: "done",
          },
        },
      },
      done: {
        type: "final",
      },
    },
  });

export default function AddVehicle() {
  const [current, send] = useMachine(addVehicleMachine);
  const { make, year } = current.context;

  return (
    <>
      <h1>Add Vehicle Via XState</h1>
      <p>Step: {current.value}</p>
      {current.matches("year") && (
        <Year
          initialYear={year}
          onSubmit={(value) => {
            send("INPUT_CHANGE", { value });
            send("CONTINUE");
          }}
        />
      )}
      {current.matches("make") && (
        <Make
          initialMake={make}
          onBack={() => send("BACK")}
          onSubmit={(value) => {
            send("INPUT_CHANGE", { value });
            send("CONTINUE");
          }}
        />
      )}

      {JSON.stringify({ make, year })}
    </>
  );
}

// This code is merely useful to display the interactive state chart in a separate browser tab.
// As an alternative, can show and interact with it in VSCode via the XState VSCode extension if you prefer.
if (typeof window !== "undefined") {
  // browser code
  inspect({
    // options
    // url: 'https://statecharts.io/inspect', // (default)
    iframe: false, // open in new window
  });
  const service = interpret(addVehicleMachine, { devTools: true }).onTransition(
    (state) => {
      console.log(state.value);
    }
  );
  service.start();
}
