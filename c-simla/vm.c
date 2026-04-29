#include <stdio.h>
#include <stdlib.h>
#include "bytecode.h"

int run(Program *p) {
  int stack[STACK_MAX];
  int vars[256] = {0};
  int sp = 0;

  for (int ip = 0; ip < p->count; ip++) {
    Instruction ins = p->code[ip];

    switch (ins.op) {
      case OP_CONST:
        stack[sp++] = ins.a;
        break;

      case OP_ADD: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = a + b;
        break;
      }

      case OP_SUB: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = a - b;
        break;
      }

      case OP_MUL: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = a * b;
        break;
      }

      case OP_DIV: {
        int b = stack[--sp];
        int a = stack[--sp];
        if (b == 0) {
          fprintf(stderr, "division by zero\n");
          exit(1);
        }
        stack[sp++] = a / b;
        break;
      }

      case OP_LOAD:
        stack[sp++] = vars[ins.a];
        break;

      case OP_STORE:
        vars[ins.a] = stack[--sp];
        break;

      case OP_LT: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = a < b ? 1 : 0;
        break;
      }

      case OP_GT: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = a > b ? 1 : 0;
        break;
      }

      case OP_EQ: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = a == b ? 1 : 0;
        break;
      }

      case OP_JMP_IF_FALSE: {
        int cond = stack[--sp];
        if (!cond) ip = ins.a - 1;
        break;
      }

      case OP_JMP:
        ip = ins.a - 1;
        break;

      case OP_RETURN:
        return stack[--sp];
    }
  }

  return 0;
}
