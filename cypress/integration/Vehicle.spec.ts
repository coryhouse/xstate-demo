/// <reference types="cypress" />

import { assign, createMachine } from "xstate";
import { createModel } from "@xstate/test";

import {
  VehicleMachineContext,
  VehicleMachineEvent,
} from "../../src/AddVehicle";

// Open questions:
// 1. Can we just declare the machine once? Why does xstate-test-demo copy the machine?
const vehicleMachine = createMachine<
  VehicleMachineContext,
  VehicleMachineEvent
>({
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
      meta: {
        test: () => {
          cy.findByLabelText("Year");
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
      meta: {
        test: () => {
          cy.findByLabelText("Make");
        },
      },
    },
    done: {
      type: "final",
    },
  },
});

const testModel = createModel(vehicleMachine, {
  events: {
    INPUT_CHANGE: function (_, event) {
      // TODO: Can we more elegantly handle different input types?
      event.target.nodeName === "SELECT"
        ? cy.get(`#${event.target.id}`).select(event.value)
        : cy.get(`#${event.target.id}`).type(event.value);
    },
    BACK: function () {
      cy.findByRole("button", { name: "Back" }).click();
    },
    CONTINUE: function () {
      cy.findByRole("button", { name: "Continue" }).click();
    },
  },
});

const itVisitsAndRunsPathTests = (url) => (path) =>
  it(path.description, function () {
    cy.visit(url).then(path.test);
  });

const itTests = itVisitsAndRunsPathTests(
  `http://localhost:${process.env.PORT || "3000"}`
);

context("Add Vehicle", () => {
  const testPlans = testModel.getSimplePathPlans();
  testPlans.forEach((plan) => {
    describe(plan.description, () => {
      plan.paths.forEach(itTests);
    });
  });
});
