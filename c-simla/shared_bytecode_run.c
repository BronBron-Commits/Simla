#include <stdio.h>
#include <string.h>
#include "bytecode.h"

int main(int argc, char **argv) {
  int trace_enabled = 0;
  const char *input_path = NULL;

  for (int i = 1; i < argc; i++) {
    if (strcmp(argv[i], "--trace") == 0) {
      trace_enabled = 1;
    } else if (!input_path) {
      input_path = argv[i];
    }
  }

  if (!input_path) {
    fprintf(stderr, "usage: shared_bytecode_run <program.sbc> [--trace]\n");
    return 1;
  }

  Program p;
  if (load_program_text(input_path, &p) != 0) {
    return 1;
  }

  printf("Result: %d\n", trace_enabled ? run_with_trace(&p, stderr) : run(&p));
  return 0;
}
