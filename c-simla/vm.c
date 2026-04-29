#include <stdio.h>
#include <stdlib.h>
#include "bytecode.h"

int run(Program *p) {
  int stack[STACK_MAX];
  int vars[256] = {0};
  int lists[256][256] = {{0}};
  int list_counts[256] = {0};
  int list_count = 0;
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

      case OP_LIST: {
        int id = list_count++;
        list_counts[id] = ins.a;

        for (int i = ins.a - 1; i >= 0; i--) {
          lists[id][i] = stack[--sp];
        }

        stack[sp++] = -id - 1;
        break;
      }

      case OP_LEN: {
        int handle = stack[--sp];
        int id = -handle - 1;
        stack[sp++] = list_counts[id];
        break;
      }

      case OP_NTH: {
        int idx = stack[--sp];
        int handle = stack[--sp];
        int id = -handle - 1;

        if (idx < 0 || idx >= list_counts[id]) {
          fprintf(stderr, "nth index out of bounds\n");
          exit(1);
        }

        stack[sp++] = lists[id][idx];
        break;
      }


      case OP_RANGE: {
        int end = stack[--sp];
        int start = stack[--sp];

        int id = list_count++;
        list_counts[id] = 0;

        if (end >= start) {
          for (int v = start; v < end; v++) {
            lists[id][list_counts[id]++] = v;
          }
        } else {
          for (int v = start; v > end; v--) {
            lists[id][list_counts[id]++] = v;
          }
        }

        stack[sp++] = -id - 1;
        break;
      }

      case OP_RETURN:
        return stack[--sp];
    }
  }

  return 0;
}
