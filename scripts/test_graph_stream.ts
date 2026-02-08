
import { StateGraph, END, Annotation } from "@langchain/langgraph";

// Define a simple state
const GraphState = Annotation.Root({
    output: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "initial",
    }),
});

async function run() {
    const workflow = new StateGraph(GraphState)
        .addNode("step1", async (state) => {
            console.log("Running step1");
            return { output: "step1_done" };
        })
        .addNode("step2", async (state) => {
            console.log("Running step2");
            return { output: "step2_done" };
        })
        .addEdge("step1", "step2")
        .addEdge("step2", END)
        .setEntryPoint("step1");

    const app = workflow.compile();

    console.log("Starting streamEvents...");
    const stream = app.streamEvents({}, { version: "v2" });

    let finalOutput = null;

    for await (const event of stream) {
        // console.log("Event:", event.event, event.name, event.data?.output);
        if (event.event === "on_chain_end" && event.name === "LangGraph") {
            console.log("Found LangGraph end event!", event.data.output);
            finalOutput = event.data.output;
        }
    }

    console.log("Final Output captured:", finalOutput);
}

run().catch(console.error);
