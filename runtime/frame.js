export function createFrame(parent = null) {

  return {
    parent,
    locals: Object.create(null),
    stack: []
  };
}
