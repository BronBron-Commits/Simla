#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "bytecode.h"

static int read_labeled_int(FILE *f, const char *label, int *out) {
  char key[64];
  if (fscanf(f, "%63s", key) != 1) return 0;
  if (strcmp(key, label) != 0) return 0;
  if (fscanf(f, "%d", out) != 1) return 0;
  return 1;
}

static int run_code(
  Instruction *code,
  int count,
  Program *owner,
  int vars[256]
) {
  int stack[STACK_MAX];
  int lists[256][256] = {{0}};
  int list_counts[256] = {0};
  int list_count = 0;
  int sp = 0;

  for (int ip = 0; ip < count; ip++) {
    Instruction ins = code[ip];

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

      case OP_AND: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = (a != 0 && b != 0) ? 1 : 0;
        break;
      }

      case OP_OR: {
        int b = stack[--sp];
        int a = stack[--sp];
        stack[sp++] = (a != 0 || b != 0) ? 1 : 0;
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

      case OP_MAP: {
        int handle = stack[--sp];
        int src_id = -handle - 1;

        if (ins.a < 0 || ins.a >= owner->map_func_count) {
          fprintf(stderr, "invalid map function id\n");
          exit(1);
        }

        MapFunction *fn = &owner->map_funcs[ins.a];

        int out_id = list_count++;
        list_counts[out_id] = 0;

        for (int i = 0; i < list_counts[src_id]; i++) {
          int local_vars[256] = {0};
          local_vars[fn->param_slot] = lists[src_id][i];

          int mapped = run_code(fn->code, fn->count, owner, local_vars);
          lists[out_id][list_counts[out_id]++] = mapped;
        }

        stack[sp++] = -out_id - 1;
        break;
      }

      case OP_RETURN:
        return stack[--sp];

      case OP_FILTER: {
        int handle = stack[--sp];
        int src_id = -handle - 1;

        if (ins.a < 0 || ins.a >= owner->filter_func_count) {
          fprintf(stderr, "invalid filter function id\n");
          exit(1);
        }

        MapFunction *fn = &owner->filter_funcs[ins.a];

        int out_id = list_count++;
        list_counts[out_id] = 0;

        for (int i = 0; i < list_counts[src_id]; i++) {
          int local_vars[256] = {0};
          local_vars[fn->param_slot] = lists[src_id][i];

          int keep = run_code(fn->code, fn->count, owner, local_vars);
          if (keep) {
            lists[out_id][list_counts[out_id]++] = lists[src_id][i];
          }
        }

        stack[sp++] = -out_id - 1;
        break;
      }

      case OP_REDUCE: {
        int handle = stack[--sp];
        int src_id = -handle - 1;
        int acc = stack[--sp];

        if (ins.a < 0 || ins.a >= owner->reduce_func_count) {
          fprintf(stderr, "invalid reduce function id\n");
          exit(1);
        }

        ReduceFunction *rfn = &owner->reduce_funcs[ins.a];

        for (int i = 0; i < list_counts[src_id]; i++) {
          int local_vars[256] = {0};
          local_vars[rfn->acc_slot] = acc;
          local_vars[rfn->item_slot] = lists[src_id][i];

          acc = run_code(rfn->code, rfn->count, owner, local_vars);
        }

        stack[sp++] = acc;
        break;
      }
    }
  }

  return sp > 0 ? stack[sp - 1] : 0;
}

int run(Program *p) {
  int vars[256] = {0};
  return run_code(p->code, p->count, p, vars);
}

int load_program_text(const char *path, Program *out) {
  FILE *f = fopen(path, "r");
  if (!f) {
    fprintf(stderr, "could not open bytecode file: %s\n", path);
    return -1;
  }

  char magic[32] = {0};
  if (fscanf(f, "%31s", magic) != 1 || strcmp(magic, "SIMLA_BC1") != 0) {
    fprintf(stderr, "invalid bytecode header\n");
    fclose(f);
    return -1;
  }

  memset(out, 0, sizeof(*out));

  if (!read_labeled_int(f, "code_count", &out->count)) {
    fprintf(stderr, "invalid code_count\n");
    fclose(f);
    return -1;
  }

  if (out->count < 0 || out->count > MAX_CODE) {
    fprintf(stderr, "code_count out of range\n");
    fclose(f);
    return -1;
  }

  for (int i = 0; i < out->count; i++) {
    int op = 0;
    int a = 0;

    if (fscanf(f, "%d %d", &op, &a) != 2) {
      fprintf(stderr, "invalid instruction at %d\n", i);
      fclose(f);
      return -1;
    }

    if (op < OP_CONST || op > OP_REDUCE) {
      fprintf(stderr, "invalid opcode at %d\n", i);
      fclose(f);
      return -1;
    }

    out->code[i].op = (OpCode)op;
    out->code[i].a = a;
  }

  if (!read_labeled_int(f, "map_func_count", &out->map_func_count)) {
    fprintf(stderr, "invalid map_func_count\n");
    fclose(f);
    return -1;
  }

  if (out->map_func_count < 0 || out->map_func_count > MAP_FUNC_MAX) {
    fprintf(stderr, "map_func_count out of range\n");
    fclose(f);
    return -1;
  }

  for (int i = 0; i < out->map_func_count; i++) {
    MapFunction *mf = &out->map_funcs[i];

    if (!read_labeled_int(f, "map_param_slot", &mf->param_slot)) {
      fprintf(stderr, "invalid map_param_slot for map func %d\n", i);
      fclose(f);
      return -1;
    }

    if (!read_labeled_int(f, "map_code_count", &mf->count)) {
      fprintf(stderr, "invalid map_code_count for map func %d\n", i);
      fclose(f);
      return -1;
    }

    if (mf->count < 0 || mf->count > MAX_CODE) {
      fprintf(stderr, "map_code_count out of range for map func %d\n", i);
      fclose(f);
      return -1;
    }

    for (int j = 0; j < mf->count; j++) {
      int op = 0;
      int a = 0;

      if (fscanf(f, "%d %d", &op, &a) != 2) {
        fprintf(stderr, "invalid map instruction at map %d index %d\n", i, j);
        fclose(f);
        return -1;
      }

      if (op < OP_CONST || op > OP_REDUCE) {
        fprintf(stderr, "invalid map opcode at map %d index %d\n", i, j);
        fclose(f);
        return -1;
      }

      mf->code[j].op = (OpCode)op;
      mf->code[j].a = a;
    }
  }

  if (!read_labeled_int(f, "filter_func_count", &out->filter_func_count)) {
    fprintf(stderr, "invalid filter_func_count\n");
    fclose(f);
    return -1;
  }

  if (out->filter_func_count < 0 || out->filter_func_count > MAP_FUNC_MAX) {
    fprintf(stderr, "filter_func_count out of range\n");
    fclose(f);
    return -1;
  }

  for (int i = 0; i < out->filter_func_count; i++) {
    MapFunction *mf = &out->filter_funcs[i];

    if (!read_labeled_int(f, "filter_param_slot", &mf->param_slot)) {
      fprintf(stderr, "invalid filter_param_slot for filter func %d\n", i);
      fclose(f);
      return -1;
    }

    if (!read_labeled_int(f, "filter_code_count", &mf->count)) {
      fprintf(stderr, "invalid filter_code_count for filter func %d\n", i);
      fclose(f);
      return -1;
    }

    if (mf->count < 0 || mf->count > MAX_CODE) {
      fprintf(stderr, "filter_code_count out of range\n");
      fclose(f);
      return -1;
    }

    for (int j = 0; j < mf->count; j++) {
      int op = 0, a = 0;
      if (fscanf(f, "%d %d", &op, &a) != 2) {
        fprintf(stderr, "invalid filter instruction at filter %d index %d\n", i, j);
        fclose(f);
        return -1;
      }
      if (op < OP_CONST || op > OP_REDUCE) {
        fprintf(stderr, "invalid filter opcode\n");
        fclose(f);
        return -1;
      }
      mf->code[j].op = (OpCode)op;
      mf->code[j].a = a;
    }
  }

  if (!read_labeled_int(f, "reduce_func_count", &out->reduce_func_count)) {
    fprintf(stderr, "invalid reduce_func_count\n");
    fclose(f);
    return -1;
  }

  if (out->reduce_func_count < 0 || out->reduce_func_count > MAP_FUNC_MAX) {
    fprintf(stderr, "reduce_func_count out of range\n");
    fclose(f);
    return -1;
  }

  for (int i = 0; i < out->reduce_func_count; i++) {
    ReduceFunction *rf = &out->reduce_funcs[i];

    if (!read_labeled_int(f, "reduce_acc_slot", &rf->acc_slot)) {
      fprintf(stderr, "invalid reduce_acc_slot for reduce func %d\n", i);
      fclose(f);
      return -1;
    }

    if (!read_labeled_int(f, "reduce_item_slot", &rf->item_slot)) {
      fprintf(stderr, "invalid reduce_item_slot for reduce func %d\n", i);
      fclose(f);
      return -1;
    }

    if (!read_labeled_int(f, "reduce_code_count", &rf->count)) {
      fprintf(stderr, "invalid reduce_code_count for reduce func %d\n", i);
      fclose(f);
      return -1;
    }

    if (rf->count < 0 || rf->count > MAX_CODE) {
      fprintf(stderr, "reduce_code_count out of range\n");
      fclose(f);
      return -1;
    }

    for (int j = 0; j < rf->count; j++) {
      int op = 0, a = 0;
      if (fscanf(f, "%d %d", &op, &a) != 2) {
        fprintf(stderr, "invalid reduce instruction at reduce %d index %d\n", i, j);
        fclose(f);
        return -1;
      }
      if (op < OP_CONST || op > OP_REDUCE) {
        fprintf(stderr, "invalid reduce opcode\n");
        fclose(f);
        return -1;
      }
      rf->code[j].op = (OpCode)op;
      rf->code[j].a = a;
    }
  }

  fclose(f);
  return 0;
}
