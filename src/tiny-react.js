function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

let nextUnitOfWork = null; // 是一个 Fiber 节点
let currentRoot = null;
let workInProgressRoot = null;
let deletions = []; // 待删除 fiber 数组
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

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(workInProgressRoot.child);
  currentRoot = workInProgressRoot; // 完成更新的 workInProgressRoot 变为当前 root fiber
  workInProgressRoot = null;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
// updateDom 函数
// 比较新旧 fiber 的属性，删除旧属性，设置新属性或者更改了的属性
// 有一个特殊的属性就是事件监听，以 on 开头的就是事件，需要特殊处理
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

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

/**
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

// updateHostComponent 函数处理常规更新
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
 * Function Component 的 fiber 没有 DOM 节点，所以 commitWork 函数需要改变两点：
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

let workInProgressFiber = null;
let hookIndex = null;
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

export { createElement, render, useState };
