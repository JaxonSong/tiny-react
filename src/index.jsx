import { createElement, render, useState } from "./tiny-react.js";

/** @jsx createElement */
function App(props) {
  const [count, setState] = useState(1);

  return (
    <h1 title="Hello" onclick={() => setState((before) => before + 1)}>
      Hello {props.name} Count: {count}
    </h1>
  );
}
const root = <App name="foo" />;
const container = document.querySelector("#app");
render(root, container);
