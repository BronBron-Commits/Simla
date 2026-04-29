#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "bytecode.h"

#define MAX_TOKENS 4096
#define MAX_TOKEN_LEN 128
#define MAX_CHILDREN 256

typedef struct { char text[MAX_TOKEN_LEN]; } Token;
typedef struct { Token tokens[MAX_TOKENS]; int count; } TokenList;

typedef enum { NODE_ATOM, NODE_LIST } NodeType;

typedef struct Node {
  NodeType type;
  char atom[MAX_TOKEN_LEN];
  struct Node *children[MAX_CHILDREN];
  int child_count;
} Node;

static Node *new_node(NodeType type) {
  Node *n = calloc(1, sizeof(Node));
  if (!n) {
    fprintf(stderr, "out of memory\n");
    exit(1);
  }
  n->type = type;
  return n;
}

static int is_number(const char *s) {
  int i = 0;
  if (s[0] == '-') i = 1;
  if (!s[i]) return 0;
  for (; s[i]; i++) {
    if (!isdigit((unsigned char)s[i])) return 0;
  }
  return 1;
}

static void tokenize(const char *src, TokenList *out) {
  out->count = 0;
  int i = 0;

  while (src[i]) {
    if (isspace((unsigned char)src[i])) {
      i++;
      continue;
    }

    if (src[i] == ';' && src[i + 1] == ';') {
      while (src[i] && src[i] != '\n') i++;
      continue;
    }

    if (src[i] == '(' || src[i] == ')') {
      snprintf(out->tokens[out->count++].text, MAX_TOKEN_LEN, "%c", src[i]);
      i++;
      continue;
    }

    int j = 0;
    while (
      src[i] &&
      !isspace((unsigned char)src[i]) &&
      src[i] != '(' &&
      src[i] != ')' &&
      j < MAX_TOKEN_LEN - 1
    ) {
      out->tokens[out->count].text[j++] = src[i++];
    }

    out->tokens[out->count].text[j] = 0;
    out->count++;
  }
}

static Node *parse_expr(TokenList *tokens, int *pos) {
  if (*pos >= tokens->count) {
    fprintf(stderr, "unexpected end of input\n");
    exit(1);
  }

  const char *tok = tokens->tokens[*pos].text;

  if (strcmp(tok, "(") == 0) {
    (*pos)++;
    Node *list = new_node(NODE_LIST);

    while (*pos < tokens->count && strcmp(tokens->tokens[*pos].text, ")") != 0) {
      list->children[list->child_count++] = parse_expr(tokens, pos);
    }

    if (*pos >= tokens->count) {
      fprintf(stderr, "missing closing paren\n");
      exit(1);
    }

    (*pos)++;
    return list;
  }

  if (strcmp(tok, ")") == 0) {
    fprintf(stderr, "unexpected closing paren\n");
    exit(1);
  }

  Node *atom = new_node(NODE_ATOM);
  snprintf(atom->atom, MAX_TOKEN_LEN, "%s", tok);
  (*pos)++;
  return atom;
}

static Node *parse(TokenList *tokens) {
  Node *program = new_node(NODE_LIST);
  int pos = 0;

  while (pos < tokens->count) {
    program->children[program->child_count++] = parse_expr(tokens, &pos);
  }

  return program;
}

static char *read_file(const char *path) {
  FILE *f = fopen(path, "rb");
  if (!f) {
    fprintf(stderr, "could not open file: %s\n", path);
    exit(1);
  }

  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  rewind(f);

  char *buf = malloc(size + 1);
  if (!buf) {
    fprintf(stderr, "out of memory\n");
    exit(1);
  }

  fread(buf, 1, size, f);
  buf[size] = 0;
  fclose(f);
  return buf;
}

static void emit(Program *p, OpCode op, int a) {
  if (p->count >= MAX_CODE) {
    fprintf(stderr, "program too large\n");
    exit(1);
  }

  p->code[p->count++] = (Instruction){op, a};
}

static void compile_expr(Node *n, Program *p) {
  if (n->type == NODE_ATOM) {
    if (!is_number(n->atom)) {
      fprintf(stderr, "compiler only supports numeric atoms for now: %s\n", n->atom);
      exit(1);
    }

    emit(p, OP_CONST, atoi(n->atom));
    return;
  }

  if (n->child_count == 0) {
    fprintf(stderr, "empty expression\n");
    exit(1);
  }

  Node *head = n->children[0];

  if (head->type != NODE_ATOM) {
    fprintf(stderr, "invalid call\n");
    exit(1);
  }

  const char *op = head->atom;

  if (
    strcmp(op, "add") == 0 ||
    strcmp(op, "sub") == 0 ||
    strcmp(op, "mul") == 0 ||
    strcmp(op, "div") == 0
  ) {
    if (n->child_count != 3) {
      fprintf(stderr, "%s expects exactly 2 args in bytecode compiler for now\n", op);
      exit(1);
    }

    compile_expr(n->children[1], p);
    compile_expr(n->children[2], p);

    if (strcmp(op, "add") == 0) emit(p, OP_ADD, 0);
    else if (strcmp(op, "sub") == 0) emit(p, OP_SUB, 0);
    else if (strcmp(op, "mul") == 0) emit(p, OP_MUL, 0);
    else if (strcmp(op, "div") == 0) emit(p, OP_DIV, 0);

    return;
  }

  fprintf(stderr, "unknown compile op: %s\n", op);
  exit(1);
}

static void compile_program(Node *ast, Program *p) {
  if (ast->child_count == 0) {
    fprintf(stderr, "empty program\n");
    exit(1);
  }

  compile_expr(ast->children[0], p);
  emit(p, OP_RETURN, 0);
}

static void dump_program(Program *p) {
  for (int i = 0; i < p->count; i++) {
    Instruction ins = p->code[i];
    printf("%03d  op=%d  a=%d\n", i, ins.op, ins.a);
  }
}

int main(int argc, char **argv) {
  if (argc < 2) {
    printf("usage: compile_test <file.sim>\n");
    return 1;
  }

  char *src = read_file(argv[1]);

  TokenList tokens;
  tokenize(src, &tokens);

  Node *ast = parse(&tokens);

  Program p = {0};
  compile_program(ast, &p);

  printf("Compiled bytecode:\n");
  dump_program(&p);

  int result = run(&p);
  printf("Result: %d\n", result);

  free(src);
  return 0;
}
