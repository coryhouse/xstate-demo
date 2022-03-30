import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

type StepMachineContext = {
  year: string;
  errors: string[];
};

type StepMachineEvent =
  | {
      type: "CHANGE";
      field: string;
      value: string;
    }
  | { type: "SUBMIT" };

const stepMachine = createMachine<StepMachineContext, StepMachineEvent>(
  {
    initial: "editing",
    context: {
      year: "",
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
          src: "validate",
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
  },
  {
    services: {
      // Alternatively, could declare this outside the machine (see Make.tsx), but advantage of putting this here
      // is it can be mocked for testing purposes.
      validate: (ctx: StepMachineContext): Promise<string> => {
        return new Promise((resolve, reject) => {
          return !!ctx.year ? resolve("") : reject("Select a year.");
        });
      },
    },
  }
);

type YearProps = {
  initialYear: string;
  onSubmit: (year: string) => void;
};

export function Year({ onSubmit, initialYear }: YearProps) {
  const [current, send] = useMachine(stepMachine, {
    context: {
      year: initialYear,
    },
    actions: {
      submit: (ctx) => onSubmit(ctx.year),
    },
  });

  const { year, errors } = current.context;
  const invalid = current.matches({ editing: "invalid" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send("SUBMIT");
      }}
    >
      {invalid && <div style={{ color: "red" }}>{errors.map((e) => e)}</div>}
      <label htmlFor="year">Year</label>{" "}
      <select
        id="year"
        name="year"
        value={year}
        onChange={({ target }) =>
          send("CHANGE", { value: target.value, field: target.name })
        }
      >
        <option value="">Select Year</option>
        <option value="2021">2021</option>
        <option value="2022">2022</option>
      </select>
      <input type="submit" value="Continue" />
    </form>
  );
}
