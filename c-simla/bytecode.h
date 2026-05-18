#ifndef BYTECODE_H
#define BYTECODE_H

#define MAX_CODE 4096
#define STACK_MAX 1024
#define CONST_MAX 1024
#define MAP_FUNC_MAX 64

typedef enum {
  OP_CONST,         /*  0 */
  OP_ADD,           /*  1 */
  OP_SUB,           /*  2 */
  OP_MUL,           /*  3 */
  OP_DIV,           /*  4 */
  OP_LOAD,          /*  5 */
  OP_STORE,         /*  6 */
  OP_LT,            /*  7 */
  OP_GT,            /*  8 */
  OP_EQ,            /*  9 */
  OP_AND,           /* 10 */
  OP_OR,            /* 11 */
  OP_JMP_IF_FALSE,  /* 12 */
  OP_JMP,           /* 13 */
  OP_LIST,          /* 14 */
  OP_LEN,           /* 15 */
  OP_NTH,           /* 16 */
  OP_RANGE,         /* 17 */
  OP_MAP,           /* 18 */
  OP_RETURN,        /* 19 */
  OP_FILTER,        /* 20 */
  OP_REDUCE         /* 21 */
} OpCode;

typedef struct {
  OpCode op;
  int a;
} Instruction;

typedef struct {
  Instruction code[MAX_CODE];
  int count;
  int param_slot;
} MapFunction;

typedef struct {
  Instruction code[MAX_CODE];
  int count;
  int acc_slot;
  int item_slot;
} ReduceFunction;

typedef struct {
  Instruction code[MAX_CODE];
  int count;
  MapFunction map_funcs[MAP_FUNC_MAX];
  int map_func_count;
  MapFunction filter_funcs[MAP_FUNC_MAX];
  int filter_func_count;
  ReduceFunction reduce_funcs[MAP_FUNC_MAX];
  int reduce_func_count;
} Program;

int run(Program *p);
int run_with_trace(Program *p, FILE *trace_out);
int load_program_text(const char *path, Program *out);

#endif
