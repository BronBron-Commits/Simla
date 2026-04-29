#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_TOKENS 4096
#define MAX_TOKEN_LEN 128
#define MAX_CHILDREN 256
#define MAX_VARS 512
#define MAX_PARAMS 32

typedef struct { char text[MAX_TOKEN_LEN]; } Token;
typedef struct { Token tokens[MAX_TOKENS]; int count; } TokenList;

typedef enum { NODE_ATOM, NODE_LIST } NodeType;

typedef struct Node {
    NodeType type;
    char atom[MAX_TOKEN_LEN];
    struct Node *children[MAX_CHILDREN];
    int child_count;
} Node;

typedef enum { VAL_INT, VAL_FN, VAL_LIST } ValueType;

typedef struct {
    char params[MAX_PARAMS][MAX_TOKEN_LEN];
    int param_count;
    Node *body;
    int closure_start;
    int closure_count;
} Function;

typedef struct Value Value;

typedef struct {
    Value *items[MAX_CHILDREN];
    int count;
} ListValue;

struct Value {
    ValueType type;
    int number;
    Function fn;
    ListValue list;
};

typedef struct {
    char name[MAX_TOKEN_LEN];
    Value value;
} Var;

static Var vars[MAX_VARS];
static int var_count = 0;

static Value eval(Node *n);

static Value int_value(int n) {
    Value v;
    v.type = VAL_INT;
    v.number = n;
    return v;
}

static Value list_value(void) {
    Value v;
    v.type = VAL_LIST;
    v.number = 0;
    v.list.count = 0;
    return v;
}

static Value fn_value(Node *params, Node *body) {
    Value v;
    v.type = VAL_FN;
    v.number = 0;
    v.fn.param_count = params->child_count;
    v.fn.body = body;
    v.fn.closure_start = 0;
    v.fn.closure_count = var_count;

    if (params->child_count > MAX_PARAMS) {
        fprintf(stderr, "Too many function params\n");
        exit(1);
    }

    for (int i = 0; i < params->child_count; i++) {
        if (params->children[i]->type != NODE_ATOM) {
            fprintf(stderr, "Function params must be symbols\n");
            exit(1);
        }
        snprintf(v.fn.params[i], MAX_TOKEN_LEN, "%s", params->children[i]->atom);
    }

    return v;
}

static int as_int(Value v) {
    if (v.type != VAL_INT) {
        fprintf(stderr, "Expected number\n");
        exit(1);
    }
    return v.number;
}

static void env_set(const char *name, Value value) {
    for (int i = var_count - 1; i >= 0; i--) {
        if (strcmp(vars[i].name, name) == 0) {
            vars[i].value = value;
            return;
        }
    }

    if (var_count >= MAX_VARS) {
        fprintf(stderr, "Too many variables\n");
        exit(1);
    }

    snprintf(vars[var_count].name, MAX_TOKEN_LEN, "%s", name);
    vars[var_count].value = value;
    var_count++;
}

static Value env_get(const char *name) {
    for (int i = var_count - 1; i >= 0; i--) {
        if (strcmp(vars[i].name, name) == 0) return vars[i].value;
    }

    fprintf(stderr, "Unknown symbol: %s\n", name);
    exit(1);
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
        if (isspace((unsigned char)src[i])) { i++; continue; }

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
        fprintf(stderr, "Unexpected end of input\n");
        exit(1);
    }

    const char *tok = tokens->tokens[*pos].text;

    if (strcmp(tok, "(") == 0) {
        (*pos)++;
        Node *list = new_node(NODE_LIST);

        while (*pos < tokens->count && strcmp(tokens->tokens[*pos].text, ")") != 0) {
            if (list->child_count >= MAX_CHILDREN) {
                fprintf(stderr, "Too many children\n");
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

static Value call_function(Value fn, Node *call) {
    if (fn.type != VAL_FN) {
        fprintf(stderr, "Tried to call non-function\n");
        exit(1);
    }

    int arg_count = call->child_count - 1;
    if (arg_count != fn.fn.param_count) {
        fprintf(stderr, "Wrong arg count: expected %d got %d\n", fn.fn.param_count, arg_count);
        exit(1);
    }

    int saved_count = var_count;

    for (int i = 0; i < arg_count; i++) {
        Value arg = eval(call->children[i + 1]);
        env_set(fn.fn.params[i], arg);
    }

    Value result = eval(fn.fn.body);
    var_count = saved_count;
    return result;
}

static Value eval(Node *n) {
    if (n->type == NODE_ATOM) {
        if (is_number(n->atom)) return int_value(atoi(n->atom));
        return env_get(n->atom);
    }

    if (n->child_count == 0) {
        fprintf(stderr, "Empty list\n");
        exit(1);
    }

    Node *head = n->children[0];
    if (head->type != NODE_ATOM) {
        fprintf(stderr, "Invalid function call\n");
        exit(1);
    }

    const char *op = head->atom;

    if (strcmp(op, "begin") == 0) {
        Value result = int_value(0);
        for (int i = 1; i < n->child_count; i++) result = eval(n->children[i]);
        return result;
    }

    if (strcmp(op, "let") == 0) {
        if (n->child_count != 3 || n->children[1]->type != NODE_ATOM) {
            fprintf(stderr, "Invalid let form\n");
            exit(1);
        }

        Value value = eval(n->children[2]);
        env_set(n->children[1]->atom, value);
        return value;
    }

    if (strcmp(op, "fn") == 0) {
        if (n->child_count != 3 || n->children[1]->type != NODE_LIST) {
            fprintf(stderr, "Invalid fn form\n");
            exit(1);
        }

        return fn_value(n->children[1], n->children[2]);
    }

    if (strcmp(op, "if") == 0) {
        if (n->child_count != 4) {
            fprintf(stderr, "if expects condition, then, else\n");
            exit(1);
        }

        int cond = as_int(eval(n->children[1]));
        return cond ? eval(n->children[2]) : eval(n->children[3]);
    }

    if (strcmp(op, "list") == 0) {
        Value v = list_value();

        for (int i = 1; i < n->child_count; i++) {
            if (v.list.count >= MAX_CHILDREN) {
                fprintf(stderr, "list too long\n");
                exit(1);
            }

            Value *item = malloc(sizeof(Value));
            if (!item) {
                fprintf(stderr, "Out of memory\n");
                exit(1);
            }

            *item = eval(n->children[i]);
            v.list.items[v.list.count++] = item;
        }

        return v;
    }

    if (strcmp(op, "len") == 0) {
        Value xs = eval(n->children[1]);

        if (xs.type != VAL_LIST) {
            fprintf(stderr, "len expects list\n");
            exit(1);
        }

        return int_value(xs.list.count);
    }

    if (strcmp(op, "nth") == 0) {
        Value xs = eval(n->children[1]);
        int idx = as_int(eval(n->children[2]));

        if (xs.type != VAL_LIST) {
            fprintf(stderr, "nth expects list\n");
            exit(1);
        }

        if (idx < 0 || idx >= xs.list.count) {
            fprintf(stderr, "nth index out of bounds\n");
            exit(1);
        }

        return *xs.list.items[idx];
    }

    if (strcmp(op, "map") == 0) {
        Value fn = eval(n->children[1]);
        Value xs = eval(n->children[2]);

        if (xs.type != VAL_LIST) {
            fprintf(stderr, "map expects list\n");
            exit(1);
        }

        Value out = list_value();

        for (int i = 0; i < xs.list.count; i++) {
            Value *arg = xs.list.items[i];

            if (fn.type != VAL_FN || fn.fn.param_count != 1) {
                fprintf(stderr, "map expects single-arg function\n");
                exit(1);
            }

            int saved = var_count;
            env_set(fn.fn.params[0], *arg);
            Value result = eval(fn.fn.body);
            var_count = saved;

            Value *copy = malloc(sizeof(Value));
            if (!copy) {
                fprintf(stderr, "Out of memory\n");
                exit(1);
            }

            *copy = result;
            out.list.items[out.list.count++] = copy;
        }

        return out;
    }

    if (strcmp(op, "filter") == 0) {
        Value fn = eval(n->children[1]);
        Value xs = eval(n->children[2]);

        if (xs.type != VAL_LIST) {
            fprintf(stderr, "filter expects list\n");
            exit(1);
        }

        if (fn.type != VAL_FN || fn.fn.param_count != 1) {
            fprintf(stderr, "filter expects single-arg function\n");
            exit(1);
        }

        Value out = list_value();

        for (int i = 0; i < xs.list.count; i++) {
            Value *arg = xs.list.items[i];

            int saved = var_count;
            env_set(fn.fn.params[0], *arg);
            Value keep = eval(fn.fn.body);
            var_count = saved;

            if (keep.type != VAL_INT) {
                fprintf(stderr, "filter predicate must return number\n");
                exit(1);
            }

            if (keep.number != 0) {
                Value *copy = malloc(sizeof(Value));
                if (!copy) {
                    fprintf(stderr, "Out of memory\n");
                    exit(1);
                }
                *copy = *arg;
                out.list.items[out.list.count++] = copy;
            }
        }

        return out;
    }

    if (strcmp(op, "add") == 0) {
        int sum = 0;
        for (int i = 1; i < n->child_count; i++) sum += as_int(eval(n->children[i]));
        return int_value(sum);
    }

    if (strcmp(op, "sub") == 0) {
        if (n->child_count != 3) { fprintf(stderr, "sub expects 2 args\n"); exit(1); }
        return int_value(as_int(eval(n->children[1])) - as_int(eval(n->children[2])));
    }

    if (strcmp(op, "mul") == 0) {
        int product = 1;
        for (int i = 1; i < n->child_count; i++) product *= as_int(eval(n->children[i]));
        return int_value(product);
    }

    if (strcmp(op, "div") == 0) {
        if (n->child_count != 3) { fprintf(stderr, "div expects 2 args\n"); exit(1); }
        int b = as_int(eval(n->children[2]));
        if (b == 0) { fprintf(stderr, "division by zero\n"); exit(1); }
        return int_value(as_int(eval(n->children[1])) / b);
    }

    if (strcmp(op, "lt") == 0) {
        return int_value(as_int(eval(n->children[1])) < as_int(eval(n->children[2])) ? 1 : 0);
    }

    if (strcmp(op, "gt") == 0) {
        return int_value(as_int(eval(n->children[1])) > as_int(eval(n->children[2])) ? 1 : 0);
    }

    if (strcmp(op, "eq") == 0) {
        return int_value(as_int(eval(n->children[1])) == as_int(eval(n->children[2])) ? 1 : 0);
    }

    Value fn = env_get(op);
    return call_function(fn, n);
}

static void free_ast(Node *n) {
    if (!n) return;
    for (int i = 0; i < n->child_count; i++) free_ast(n->children[i]);
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

    printf("Simλ C interpreter OK\n");
    printf("tokens: %d\n\n", tokens.count);

    if (ast->child_count > 0) {
        Value result = eval(ast->children[0]);

        if (result.type == VAL_INT) printf("Result: %d\n", result.number);
        else if (result.type == VAL_FN) printf("Result: <function>\n");
        else if (result.type == VAL_LIST) printf("Result: <list len=%d>\n", result.list.count);
    }

    free_ast(ast);
    free(src);
    return 0;
}
