#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_TOKENS 4096
#define MAX_TOKEN_LEN 128
#define MAX_CHILDREN 256

typedef struct {
    char text[MAX_TOKEN_LEN];
} Token;

typedef struct {
    Token tokens[MAX_TOKENS];
    int count;
} TokenList;

typedef enum {
    NODE_ATOM,
    NODE_LIST
} NodeType;

typedef struct Node {
    NodeType type;
    char atom[MAX_TOKEN_LEN];
    struct Node *children[MAX_CHILDREN];
    int child_count;
} Node;

static Node *new_node(NodeType type) {
    Node *n = calloc(1, sizeof(Node));
    if (!n) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }
    n->type = type;
    return n;
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

        if (src[i] == '"') {
            int j = 0;
            out->tokens[out->count].text[j++] = src[i++];
            while (src[i] && src[i] != '"' && j < MAX_TOKEN_LEN - 2) {
                out->tokens[out->count].text[j++] = src[i++];
            }
            if (src[i] == '"') out->tokens[out->count].text[j++] = src[i++];
            out->tokens[out->count].text[j] = 0;
            out->count++;
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
        fprintf(stderr, "Unexpected end of input\n");
        exit(1);
    }

    const char *tok = tokens->tokens[*pos].text;

    if (strcmp(tok, "(") == 0) {
        (*pos)++;
        Node *list = new_node(NODE_LIST);

        while (*pos < tokens->count && strcmp(tokens->tokens[*pos].text, ")") != 0) {
            if (list->child_count >= MAX_CHILDREN) {
                fprintf(stderr, "Too many children in list\n");
                exit(1);
            }

            list->children[list->child_count++] = parse_expr(tokens, pos);
        }

        if (*pos >= tokens->count) {
            fprintf(stderr, "Missing closing paren\n");
            exit(1);
        }

        (*pos)++;
        return list;
    }

    if (strcmp(tok, ")") == 0) {
        fprintf(stderr, "Unexpected closing paren\n");
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
        if (program->child_count >= MAX_CHILDREN) {
            fprintf(stderr, "Too many top-level expressions\n");
            exit(1);
        }

        program->children[program->child_count++] = parse_expr(tokens, &pos);
    }

    return program;
}

static void print_ast(Node *n, int indent) {
    for (int i = 0; i < indent; i++) printf("  ");

    if (n->type == NODE_ATOM) {
        printf("ATOM %s\n", n->atom);
        return;
    }

    printf("LIST\n");
    for (int i = 0; i < n->child_count; i++) {
        print_ast(n->children[i], indent + 1);
    }
}

static void free_ast(Node *n) {
    if (!n) return;

    for (int i = 0; i < n->child_count; i++) {
        free_ast(n->children[i]);
    }

    free(n);
}

static char *read_file(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) {
        fprintf(stderr, "Could not open file: %s\n", path);
        exit(1);
    }

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    rewind(f);

    char *buf = malloc(size + 1);
    if (!buf) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }

    fread(buf, 1, size, f);
    buf[size] = 0;
    fclose(f);
    return buf;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        printf("usage: simla <file.sim>\n");
        return 1;
    }

    char *src = read_file(argv[1]);

    TokenList tokens;
    tokenize(src, &tokens);

    Node *ast = parse(&tokens);

    printf("Simλ C parser OK\n");
    printf("tokens: %d\n\n", tokens.count);
    print_ast(ast, 0);

    free_ast(ast);
    free(src);
    return 0;
}
