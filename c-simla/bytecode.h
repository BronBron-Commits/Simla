#ifndef BYTECODE_H
#define BYTECODE_H

#define MAX_CODE 4096
#define STACK_MAX 1024
#define CONST_MAX 1024

typedef enum {
  OP_CONST,
  OP_ADD,
  OP_SUB,
  OP_MUL,
  OP_DIV,
  OP_LOAD,
  OP_STORE,
  OP_RETURN
} OpCode;

typedef struct {
  OpCode op;
  int a;
} Instruction;

typedef struct {
  Instruction code[MAX_CODE];
  int count;
} Program;

int run(Program *p);

#endif
