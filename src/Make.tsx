import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

function validate(ctx: StepMachineContext): Promise<string> {
  return new Promise((resolve, reject) => {
    return !!ctx.make ? resolve("") : reject("Make is required.");
  });
}

type StepMachineContext = {
  make: string;
  errors: string[];
};

type StepMachineEvent =
  | {
      type: "CHANGE";
      field: string;
      value: string;
    }
  | { type: "SUBMIT" };

// TODO: Delete this machine and use StepMachine.ts (when its TS issues are fixed)
const stepMachine = createMachine<StepMachineContext, StepMachineEvent>({
  initial: "editing",
  context: {
    make: "",
    errors: [],
  },
  // This is a compound state node, because it has child states. So, when editing, there are two states: idle or invalid. For more, see https://xstate.js.org/docs/guides/statenodes.html#state-node-types
  states: {
    editing: {
      on: {
        CHANGE: {
          target: ".idle",
          actions: assign((_context, event) => {
            return {
              [event.field]: event.value,
            };
          }),
        },
        SUBMIT: "validating",
      },
      // Initial child state
      initial: "idle",
      states: {
        idle: {},
        invalid: {},
      },
    },
    validating: {
      invoke: {
        id: "validating",
        src: validate,
        onDone: "validated",
        onError: {
          target: "editing.invalid",
          actions: assign({
            errors: (context, event) => [...context.errors, event.data],
          }),
        },
      },
    },
    validated: {
      // Call the submit action when this state is entered.
      entry: "submit",
      type: "final",
    },
  },
});

type MakeProps = {
  initialMake: string;
  onSubmit: (year: string) => void;
  onBack: () => void;
};

export function Make({ onSubmit, onBack, initialMake }: MakeProps) {
  const [current, send] = useMachine(stepMachine, {
    context: {
      make: initialMake,
    },
    actions: {
      submit: (ctx) => onSubmit(ctx.make),
    },
  });
  const { make, errors } = current.context;
  const invalid = current.matches({ editing: "invalid" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send("SUBMIT");
      }}
    >
      {invalid && <div style={{ color: "red" }}>{errors.map((e) => e)}</div>}
      <p>
        <label htmlFor="make">Make</label>{" "}
        <input
          id="make"
          type="text"
          name="make"
          value={make}
          onChange={({ target }) =>
            send("CHANGE", { value: target.value, field: target.name })
          }
        />
      </p>
      <input type="button" value="Back" onClick={onBack} />
      <input type="submit" value="Continue" />
    </form>
  );
}
