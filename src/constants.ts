// Properties for setting element dimensions and position
// number: in px for size / position, ratio for aspectRatio
// [number, number]: calc([0]+[1]px) for size / position, [0]/[1] for aspect ratio
export const dimensionProps = {
    left: null as number | [number, number] | null,
    top: null as number | [number, number] | null,
    right: null as number | [number, number] | null,
    bottom: null as number | [number, number] | null,
    width: null as number | [number, number] | null,
    height: null as number | [number, number] | null,
    aspectRatio: null as number | [number, number] | null,
};

// Properties sent directly to client Factory
export const elementProps = {
    style: null as CSSDict | null, // HTML element CSS style
    dataset: null as Dict<string> | null, // HTML element dataset
    className: null as string | null, // HTML element class name
    innerHTML: null as string | null, // innerHTML of the component, no other children allowed if set
    x: null as number | null,
    y: null as number | null,
    z: null as number | null,
    opacity: null as number | null,
    scale: null as number | null,
    scaleX: null as number | null,
    scaleY: null as number | null,
    scaleZ: null as number | null,
    rotate: null as number | null,
    rotateX: null as number | null,
    rotateY: null as number | null,
    rotateZ: null as number | null,
    transition: null as number | null, // transition duration (value x global_duration) for properties change
    down: null as boolean | null, // whether to add a temporary .down class when clicking or dragging
    onClick: null as string | null, // click event handler
    onRightClick: null as string | null, // right click / press and hold event handler
    onDoubleClick: null as string | null, // double click / double tap event handler
    onMouseDown: null as string | null, // mouse down / touch start event handler
    onContextMenu: null as string | null, // context menu event handler
    onDrop: null as Dict | null, // TODO: drag and drop event handler
    // Note: event handlers are string names of methods in the Component class, not actual functions
    // because functions cannot be serialized to/from JSON.
};

// Subset of elementProps that are event handlers
export const eventHandlers = [
    'onClick', 'onRightClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu', 'onDrop'
] as const;

// Properties for server to manage component tree structure (not sent to client)
export const nodeProps = {
    exclusive: null as string[] | null, // client ids that can see this component, undefined or empty for all
    slot: null as number | null, // slot index as identifier when siblings have the same tag
};