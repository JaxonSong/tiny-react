/**
 * babel 解析 JSX 后，调用此函数创建 React 元素
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ), // children 会是一个数组，注意 React 不会创建一个空 children 数组，如果没有子元素，这里为了方便后续处理，如果 children 没有传，则会是一个空数组
    },
  };
}

/**
 * 创建文本节点，为什么不用 innerHtml 的方式，这样可以统一处理 React 元素的方式
 * 可以发现 createTextElement 的返回值与 creteElement 返回值的结构一样
 */
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// /**
//  * 实现 ReactDom.Render
//  */
// function render(element, container) {
//   // 创建 dom 节点
//   const dom =
//     element.type === "TEXT_ELEMENT"
//       ? document.createTextNode("")
//       : document.createElement(element.type);

//   // 设置属性
//   const isProperty = (k) => k !== "children";
//   Object.keys(element.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       dom[name] = element.props[name];
//     });

//   // 递归创建子节点
//   element.props.children.forEach((child) => {
//     render(child, dom);
//   });
//   // 将创建后的节点挂载到容器节点
//   container.appendChild(dom);
// }

/**
 * 实现 React Concurrent Mode，也就是并发模式
 * 我们用浏览器 API requestIdleCallback 来实现并发模式
 * React 采用的自己实现的 Scheduler 包
 */
// let nextUnitOfWork = null; // 是一个 Fiber 节点
// // requestIdleCallback 的回调函数
// function workLoop(deadLine) {
//   let shouldYield = false;

//   while (nextUnitOfWork && !shouldYield) {
//     nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
//     shouldYield = deadLine.timeRemaining() < 1;
//   }

//   requestIdleCallback(workLoop);
// }
// requestIdleCallback(workLoop);

/**
 * 执行当前任务单元（处理 Fiber Node），返回下一个任务单元
 * 对于每一个 Fiber 节点，做的工作有：
 * 1、添加当前 ReactElement 到 DOM
 * 2、为 ReactElement 的 children 创建 Fiber 节点
 * 3、选择并返回下一个任务单元
 *
 * 怎么选择下一个任务单元：
 * 1、当完成了当前任务单元，就会通过 FiberNode.child 选择自己的子 Fiber
 * 2、当子 Fiber 也完成了任务，继续向下选择子 Fiber 并使其完成任务，直到没有子 Fiber 了
 * 3、通过 FiberNode.sibling 选择自己的兄弟 Fiber，继续选择下一个兄弟 Fiber，直到没有兄弟 Fiber 了
 * 4、既没有 child 也没有 sibling 了，就选择最近的叔叔节点，也就是 FiberNode.return.sibling；如果也没有叔叔节点就继续向上找父亲的叔叔
 * 5、直到找到 RootFiber，表示我们完成了所有的工作
 */
// function performUnitOfWork(nextUnitOfWork) {
// TODO
// }

/**
 * 实现 Fiber 架构
 * 为了组织并发模式的任务单元，就需要借助 Fiber 树
 * Fiber 树就是 RootFiber，RootFiber 下的任何一个 Fiber 节点都是一个任务单元
 * 将 RootFiber 赋值给 nextUnitOfWork，就可以启动并发模式了
 * Fiber 节点的功能就是方便选择下一个任务单元，它有三个属性：return、child、sibling
 */

// 现在需要重构 render 函数，原本的创建 dom 的逻辑抽到 createDom 函数中
// function render(element, container) {
//   nextUnitOfWork = {
//     dom: container,
//     props: {
//       children: [element],
//     },
//   };
// }

// function createDom(fiber) {
//   // 创建 dom 节点
//   const dom =
//     fiber.type === "TEXT_ELEMENT"
//       ? document.createTextNode("")
//       : document.createElement(fiber.type);

//   // 设置属性
//   const isProperty = (k) => k !== "children";
//   Object.keys(fiber.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       dom[name] = fiber.props[name];
//     });

//   // 递归创建子节点
//   fiber.props.children.forEach((child) => {
//     render(child, dom);
//   });

//   // 返回创建好的 DOM 节点
//   return dom;
// }

// 实现 performUnitOfWork
// function performUnitOfWork(fiber) {
//   // 为当前 fiber 节点创建 DOM
//   if (!fiber.dom) {
//     fiber.dom = createDom(fiber);
//   }
//   if (fiber.return) {
//     fiber.return.dom.appendChild(fiber.dom);
//   }

//   // 为子元素创建 fiber
//   const elements = fiber.props.children;
//   let index = 0;
//   let prevSibling = null;

//   while (index < elements.length) {
//     const element = elements[index];
//     const newFiber = {
//       type: element.type,
//       props: element.props,
//       return: fiber,
//       dom: null,
//     };

//     if (index === 0) {
//       fiber.child = newFiber;
//     } else {
//       prevSibling.sibling = newFiber;
//     }

//     prevSibling = newFiber;
//     index++;
//   }

//   // 选择并返回下一个 Fiber
//   if (fiber.child) {
//     return fiber.child;
//   }
//   let nextFiber = fiber;
//   while (nextFiber) {
//     if (nextFiber.sibling) {
//       return nextFiber.sibling;
//     }
//     nextFiber = nextFiber.return;
//   }
// }

/**
 * 现有有一个问题，浏览器是可以随时打断我们的渲染过程的，而现在的 performUnitOfWork 函数，会将更新好的节点直接插入到 DOM。用户就会看到更新不完全的页面，这并不是我们想要的。我们要做的是，等 rootFiber 整个更新完成，再挨个将子节点插入到 DOM。
 */

// // 修改 workLoop
// let workInProgressRoot = null; // root fiber
// let nextUnitOfWork = null; // 是一个 Fiber 节点
// // requestIdleCallback 的回调函数
// function workLoop(deadLine) {
//   let shouldYield = false;

//   while (nextUnitOfWork && !shouldYield) {
//     nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
//     shouldYield = deadLine.timeRemaining() < 1;
//   }

//   // 没有下一个任务了，说明全部更新完成，可以更新 DOM 了
//   if (!nextUnitOfWork && workInProgressRoot) {
//     commitRoot();
//   }

//   requestIdleCallback(workLoop);
// }
// requestIdleCallback(workLoop);

// 修改 render 函数
// function render(element, container) {
//   workInProgressRoot = {
//     dom: container,
//     props: {
//       children: [element],
//     },
//   };

//   nextUnitOfWork = workInProgressRoot;
// }

// performUnitOfWork 函数移除插入 dom 的操作
// function performUnitOfWork(fiber) {
//   // 为当前 fiber 节点创建 DOM
//   if (!fiber.dom) {
//     fiber.dom = createDom(fiber);
//   }

//   // 为子元素创建 fiber
//   const elements = fiber.props.children;
//   let index = 0;
//   let prevSibling = null;

//   while (index < elements.length) {
//     const element = elements[index];
//     const newFiber = {
//       type: element.type,
//       props: element.props,
//       return: fiber,
//       dom: null,
//     };

//     if (index === 0) {
//       fiber.child = newFiber;
//     } else {
//       prevSibling.sibling = newFiber;
//     }

//     prevSibling = newFiber;
//     index++;
//   }

//   // 选择并返回下一个 Fiber
//   if (fiber.child) {
//     return fiber.child;
//   }
//   let nextFiber = fiber;
//   while (nextFiber) {
//     if (nextFiber.sibling) {
//       return nextFiber.sibling;
//     }
//     nextFiber = nextFiber.return;
//   }
// }

// 等所有节点都更新好了，再提交给 DOM
// function commitRoot() {
//   commitWork(workInProgressRoot.child);
//   workInProgressRoot = null;
// }

// function commitWork(fiber) {
//   if (!fiber) return;

//   const domParent = fiber.return.dom;
//   domParent.appendChild(fiber.dom);
//   commitWork(fiber.child);
//   commitWork(fiber.fiber.sibling);
// }

/**
 * Reconciliation 协调阶段
 * 现在我们支持将节点添加到 DOM，但是还不支持更新和删除，所以我们要保存上一次 commit 的 fiber 树 currentRoot。为了对比新旧节点，我们需要给每一个 fiber 添加一个 alternate 属性，这个属性用于连接 old fiber，也就是前一次在 commit 阶段，提交给 DOM 的 fiber。
 */

// 修改 workLoop 函数
let nextUnitOfWork = null; // 是一个 Fiber 节点
let currentRoot = null;
let workInProgressRoot = null;
let deletions = []; // 待删除 fiber 数组
// requestIdleCallback 的回调函数
function workLoop(deadLine) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadLine.timeRemaining() < 1;
  }

  // 没有下一个任务了，说明全部更新完成，可以更新 DOM 了
  if (!nextUnitOfWork && workInProgressRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

// 修改 commitRoot 函数
// function commitRoot() {
//   commitWork(workInProgressRoot.child);
//   currentRoot = workInProgressRoot; // 完成更新的 workInProgressRoot 变为当前 root fiber
//   workInProgressRoot = null;
// }

// 修改 render 函数，workInProgressRoot 添加 alternate 属性
function render(element, container) {
  workInProgressRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };

  deletions = [];
  nextUnitOfWork = workInProgressRoot;
}

// 提取 performUnitOfWork 函数中创建新 fiber 的逻辑到 reconcileChildren 函数
// function performUnitOfWork(fiber) {
//   // 为当前 fiber 节点创建 DOM
//   if (!fiber.dom) {
//     fiber.dom = createDom(fiber);
//   }

//   // 为子元素创建 fiber
//   const elements = fiber.props.children;
//   reconcileChildren(fiber, elements);

//   // 选择并返回下一个 Fiber
//   if (fiber.child) {
//     return fiber.child;
//   }
//   let nextFiber = fiber;
//   while (nextFiber) {
//     if (nextFiber.sibling) {
//       return nextFiber.sibling;
//     }
//     nextFiber = nextFiber.return;
//   }
// }

// 协调旧 fiber 和新的元素，也就是 diff 算法
// 1、如果新旧节点 type 相同，就可以复用 DOM 节点，仅仅使用新属性来更新节点
// 2、如果 type 不同，并且有新元素，就需要创建新的 DOM 节点
// 3、如果 type 不同，并且存在旧 fiber，就需要删除旧 DOM 节点
// 4、React 还会使用 key 来优化 diff 过程，利用 key 可以检测出子元素改变了位置
function reconcileChildren(workInProgressFiber, elements) {
  let index = 0;
  let oldFiber =
    (workInProgressFiber.alternate && workInProgressFiber.alternate.child) ||
    null;
  let prevSibling = null;

  while (index < elements.length || oldFiber !== null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      // 更新节点
      // 复用旧节点和旧节点的属性创建 newFiber，添加一个新的属性 effectTag 为 UPDATE 用于说明 commit 阶段的操作类型是更新节点
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        return: workInProgressFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    if (element && !sameType) {
      // 添加节点
      // 使用新元素的属性创建 newFiber，添加一个新的属性 effectTag 为 UPDATE 用于说明 commit 阶段的操作类型是添加节点
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        return: workInProgressFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !sameType) {
      // 删除节点
      // 不需要创建 newFiber，改变 oldFiber 的 effectTag 属性为 DELETION 用于说明 commit 阶段的操作类型是删除节点
      // 但是如果我们把 oldFiber 提交给 workInProgressRoot 的话，workInProgressRoot 上不存在 oldFiber；所以需要将 oldFiber 添加到 deletions 数组，再做处理
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling || null;
    }

    if (index === 0) {
      workInProgressFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

// 修改 commitRoot 函数，deletions 数组也需要 commit
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(workInProgressRoot.child);
  currentRoot = workInProgressRoot; // 完成更新的 workInProgressRoot 变为当前 root fiber
  workInProgressRoot = null;
}

// 修改 commitWork 函数，以支持 fiber.effectTag 属性
// function commitWork(fiber) {
//   if (!fiber) return;

//   const domParent = fiber.return.dom;

//   // 添加节点
//   if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
//     domParent.appendChild(fiber.dom);
//     // 删除节点
//   } else if (fiber.effectTag === "DELETION") {
//     domParent.removeChild(fiber.dom);
//     // 更新节点
//   } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
//     updateDom(fiber.dom, fiber.alternate.props, fiber.props);
//   }

//   commitWork(fiber.child);
//   commitWork(fiber.sibling);
// }

// 实现 updateDom 函数
// 比较新旧 fiber 的属性，删除旧属性，设置新属性或者更改了的属性
// 有一个特殊的属性就是事件监听，以 on 开头的就是事件，需要特殊处理
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // 删除旧的或者改变了的事件监听
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);

      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 删除旧的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 设置新属性或者改变了的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 添加事件监听
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);

      dom.addEventListener(eventType, nextProps[name]);
    });
}

/**
 * 修改 createDom 函数，使用 updateDom 函数设置属性
 */
function createDom(fiber) {
  // 创建 dom 节点
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  // 返回创建好的 DOM 节点
  return dom;
}

// /**
//  * 挂载根节点
//  * 实现了 createElement 函数和 render 函数后，就可以像在 React 的 App.tsx 中的写法一样挂载根节点了。
//  */
// const root = createElement("h1", { title: "Hello" }, "Hello");
// const container = document.querySelector("#app");
// render(root, container);

// 上面的写法等价于下面的 JSX，可以通过注释告诉 babel 使用 createElement 函数来处理 JSX 的创建 React 元素
/** @jsx createElement */
// const element = (
//   <h1 title="Hello">Hello</h1>
// )

/**
 * 实现 Function Components
 */

/** @jsx createElement */
// function App(props) {
//   return <h1 title="Hello">Hello {props.name}</h1>;
// }
// const root = <App name="foo" />;
// const container = document.querySelector("#app");
// render(root, container);

// 上面的 App 组件被 babel 插件转成 js 后，代码如下：
// function App(props) {
//   return createElement("h1", { title: "Hello" }, "Hello ", props.name);
// }
// const root = createElement(App, { name: "foo" });
// const container = document.querySelector("#app");
// render(root, container);

/**
 * 重构 performUnitOfWork 函数，实现 updateHostComponent
 * 函数组件有两点不一样：
 * 1、Function Component 的 fiber 没有 DOM 节点
 * 2、Function Component 的 children 属性需要执行函数得到，而不是从 props 中获取
 */
function performUnitOfWork(fiber) {
  // 检查 fiber.type 是否是函数类型，如果是就需要执行 fiber.type 函数得到 children 属性
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 选择并返回下一个 Fiber
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.return;
  }
}

// 新增 updateFunctionComponent 函数处理更新函数组件
// function updateFunctionComponent(fiber) {
//   const children = [fiber.type(fiber.props)];
//   reconcileChildren(fiber, children);
// }

// 新增 updateHostComponent 函数处理常规更新
function updateHostComponent(fiber) {
  // 为当前 fiber 节点创建 DOM
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 为子元素创建 fiber
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

/**
 * 重构 commitWork 函数
 * 因为 Function Component 的 fiber 没有 DOM 节点，所以 commitWork 函数需要改变两点：
 * 1、添加 fiber 节点的时候向上查找，直到遇到某一个祖先 fiber 有 DOM 节点
 * 2、移除 fiber 节点的时候向下查找，直到遇到某一个孩子 fiber 有 DOM 节点
 */
function commitWork(fiber) {
  if (!fiber) return;

  let domParentFiber = fiber.return;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.return;
  }
  const domParent = domParentFiber.dom;

  // 添加节点
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
    // 删除节点
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    // 更新节点
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 新增 commitDeletion 函数处理 commit fiber deletion
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

/**
 * 实现 useState hook
 *
 */

/** @jsx createElement */
// function App(props) {
//   const [count, setState] = useState(1);

//   return (
//     <h1 title="Hello" onclick={() => setState((before) => before + 1)}>
//       Hello {props.name} Count: {count}
//     </h1>
//   );
// }
// const root = <App name="foo" />;
// const container = document.querySelector("#app");
// render(root, container);

// 上面的 App 组件被 babel 插件转成 js 后，代码如下：
function App(props) {
  const [count, setCount] = useState(1);
  return createElement(
    "h1",
    { title: "Hello", onclick: () => setCount((before) => before + 1) },
    "Hello ",
    props.name + " ",
    "Count: ",
    count
  );
}
const root = createElement(App, { name: "foo" });
const container = document.querySelector("#app");
render(root, container);

/**
 * 实现 useState
 */

/**
 * 1、在调用函数组件之前，我们需要初始化一些全局变量，以供 useState 函数内部使用
 */
let workInProgressFiber = null;
let hookIndex = null;

/**
 * 修改 updateFunctionComponent
 */
function updateFunctionComponent(fiber) {
  workInProgressFiber = fiber;
  hookIndex = 0; // hooks 索引
  workInProgressFiber.hooks = []; // hooks 数组，这样同一个组件可以使用多个 useState
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

/**
 * 实现 useState
 * 1、当函数组件调用 useState 时，先通过 hook index 检查旧的 fiber，也就是 fiber.alternate 有没有旧的 hook；如果有旧的 hook，把旧 hook 的 state 复制到新的 hook，否则初始化 state
 * 2、将新的 hook 添加到 fiber 上，递增 hook 索引并返回 state
 * 3、useState 函数还得返回一个更新 state 的函数，所以还得实现 setState 函数，setState 接收一个 action 函数（例子中的 action 就是将 count + 1 的函数），将 action 保存在队列中。
 * 4、我们在下次更新组件的时候，从旧 fiber 的 hooks 队列中取出所有的 action 并依次执行，然后我们返回的 state 就是更新的
 */
function useState(initial) {
  const oldHook =
    workInProgressFiber.alternate &&
    workInProgressFiber.alternate.hooks &&
    workInProgressFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });
  const setState = (action) => {
    hook.queue.push(action);
    workInProgressRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = workInProgressRoot;
    deletions = [];
  };

  workInProgressFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}
