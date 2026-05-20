#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_TOKENS 4096
#define MAX_TOKEN_LEN 128
#define MAX_CHILDREN 64
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

typedef enum { VAL_INT, VAL_FN, VAL_LIST, VAL_STRING, VAL_OBJECT, VAL_NODE, VAL_TUPLE3 } ValueType;

typedef struct Value Value;
typedef struct Function Function;
typedef struct Var Var;

typedef struct {
    Value *items[MAX_CHILDREN];
    int count;
} ListValue;

typedef struct {
    char *key;
    Value *value;
} ObjectEntry;

typedef struct {
    ObjectEntry items[MAX_CHILDREN];
    int count;
} ObjectValue;

typedef struct {
    char kind[MAX_TOKEN_LEN];
    Value *props;
    Value *children;
} NodeValue;

typedef struct {
    Value *x;
    Value *y;
    Value *z;
} Tuple3Value;

struct Value {
    ValueType type;
    int number;
    char string[MAX_TOKEN_LEN];
    Function *fn;
    ListValue list;
    ObjectValue object;
    NodeValue node;
    Tuple3Value tuple3;
};

struct Var {
    char name[MAX_TOKEN_LEN];
    Value value;
};

struct Function {
    char params[MAX_PARAMS][MAX_TOKEN_LEN];
    int param_count;
    Node *body;
    Var *closure;
    int closure_count;
};

static Var vars[MAX_VARS];
static int var_count = 0;

static Value eval(Node *n);

static char *dup_cstr(const char *s) {
    size_t len = strlen(s);
    char *out = malloc(len + 1);
    if (!out) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }
    memcpy(out, s, len + 1);
    return out;
}

static Value *alloc_value(Value v) {
    Value *ptr = malloc(sizeof(Value));
    if (!ptr) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }
    *ptr = v;
    return ptr;
}

static Value int_value(int n) {
    Value v;
    memset(&v, 0, sizeof(v));
    v.type = VAL_INT;
    v.number = n;
    return v;
}

static Value list_value(void) {
    Value v;
    memset(&v, 0, sizeof(v));
    v.type = VAL_LIST;
    return v;
}

static Value string_value(const char *s) {
    Value v;
    memset(&v, 0, sizeof(v));
    v.type = VAL_STRING;
    snprintf(v.string, MAX_TOKEN_LEN, "%s", s ? s : "");
    return v;
}

static Value object_value(void) {
    Value v;
    memset(&v, 0, sizeof(v));
    v.type = VAL_OBJECT;
    return v;
}

static Value tuple3_value(Value x, Value y, Value z) {
    Value v;
    memset(&v, 0, sizeof(v));
    v.type = VAL_TUPLE3;
    v.tuple3.x = alloc_value(x);
    v.tuple3.y = alloc_value(y);
    v.tuple3.z = alloc_value(z);
    return v;
}

static Value node_value(const char *kind, Value props, Value children) {
    Value v;
    memset(&v, 0, sizeof(v));
    v.type = VAL_NODE;
    snprintf(v.node.kind, MAX_TOKEN_LEN, "%s", kind ? kind : "node");
    v.node.props = alloc_value(props);
    v.node.children = alloc_value(children);
    return v;
}

static Value fn_value(Node *params, Node *body) {
    Value v;
    memset(&v, 0, sizeof(v));
    v.type = VAL_FN;
    v.fn = calloc(1, sizeof(Function));
    if (!v.fn) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }

    if (params->child_count > MAX_PARAMS) {
        fprintf(stderr, "Too many function params\n");
        exit(1);
    }

    v.fn->param_count = params->child_count;
    v.fn->body = body;
    v.fn->closure_count = var_count;
    v.fn->closure = calloc(var_count ? var_count : 1, sizeof(Var));

    if (!v.fn->closure) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }

    for (int i = 0; i < params->child_count; i++) {
        if (params->children[i]->type != NODE_ATOM) {
            fprintf(stderr, "Function params must be symbols\n");
            exit(1);
        }
        snprintf(v.fn->params[i], MAX_TOKEN_LEN, "%s", params->children[i]->atom);
    }

    for (int i = 0; i < var_count; i++) {
        v.fn->closure[i] = vars[i];
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

static const char *as_string(const Value *v) {
    if (!v || v->type != VAL_STRING) {
        fprintf(stderr, "Expected string\n");
        exit(1);
    }
    return v->string;
}

static Value object_get(Value obj, const char *key) {
    if (obj.type != VAL_OBJECT) return int_value(0);
    for (int i = 0; i < obj.object.count; i++) {
        if (strcmp(obj.object.items[i].key, key) == 0) {
            return *obj.object.items[i].value;
        }
    }
    return int_value(0);
}

static Value object_set(Value obj, const char *key, Value value) {
    Value out = object_value();

    if (obj.type == VAL_OBJECT) {
        for (int i = 0; i < obj.object.count; i++) {
            out.object.items[out.object.count].key = dup_cstr(obj.object.items[i].key);
            if (strcmp(obj.object.items[i].key, key) == 0) {
                out.object.items[out.object.count].value = alloc_value(value);
            } else {
                out.object.items[out.object.count].value = alloc_value(*obj.object.items[i].value);
            }
            out.object.count++;
        }
    }

    int found = 0;
    for (int i = 0; i < out.object.count; i++) {
        if (strcmp(out.object.items[i].key, key) == 0) {
            found = 1;
            break;
        }
    }

    if (!found) {
        out.object.items[out.object.count].key = dup_cstr(key);
        out.object.items[out.object.count].value = alloc_value(value);
        out.object.count++;
    }

    return out;
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

            if (src[i] == '"' && j < MAX_TOKEN_LEN - 1) {
                out->tokens[out->count].text[j++] = src[i++];
            }

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

static Value call_function(Value fn, Node *call) {
    if (fn.type != VAL_FN || !fn.fn) {
        fprintf(stderr, "Tried to call non-function\n");
        exit(1);
    }

    int arg_count = call->child_count - 1;
    if (arg_count != fn.fn->param_count) {
        fprintf(stderr, "Wrong arg count: expected %d got %d\n", fn.fn->param_count, arg_count);
        exit(1);
    }

    Value *args = calloc(arg_count ? arg_count : 1, sizeof(Value));
    if (!args) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }
    for (int i = 0; i < arg_count; i++) {
        args[i] = eval(call->children[i + 1]);
    }

    int saved_count = var_count;
    Var *saved = calloc(saved_count ? saved_count : 1, sizeof(Var));
    if (!saved) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }
    for (int i = 0; i < saved_count; i++) saved[i] = vars[i];

    for (int i = 0; i < fn.fn->closure_count; i++) vars[i] = fn.fn->closure[i];
    var_count = fn.fn->closure_count;

    for (int i = 0; i < arg_count; i++) env_set(fn.fn->params[i], args[i]);

    Value result = eval(fn.fn->body);

    for (int i = 0; i < saved_count; i++) vars[i] = saved[i];
    var_count = saved_count;

    free(saved);
    free(args);

    return result;
}

static Value eval(Node *n) {
    if (n->type == NODE_ATOM) {
        if (is_number(n->atom)) return int_value(atoi(n->atom));
        int len = (int)strlen(n->atom);
        if (len >= 2 && n->atom[0] == '"' && n->atom[len - 1] == '"') {
            char unquoted[MAX_TOKEN_LEN];
            int out_i = 0;
            for (int i = 1; i < len - 1 && out_i < MAX_TOKEN_LEN - 1; i++) {
                unquoted[out_i++] = n->atom[i];
            }
            unquoted[out_i] = 0;
            return string_value(unquoted);
        }
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
        return as_int(eval(n->children[1])) ? eval(n->children[2]) : eval(n->children[3]);
    }

    if (strcmp(op, "list") == 0) {
        Value v = list_value();
        for (int i = 1; i < n->child_count; i++) {
            v.list.items[v.list.count++] = alloc_value(eval(n->children[i]));
        }
        return v;
    }

    if (strcmp(op, "obj") == 0) {
        if (((n->child_count - 1) % 2) != 0) {
            fprintf(stderr, "obj expects key/value pairs\n");
            exit(1);
        }

        Value out = object_value();
        for (int i = 1; i < n->child_count; i += 2) {
            Value key = eval(n->children[i]);
            Value val = eval(n->children[i + 1]);
            out.object.items[out.object.count].key = dup_cstr(as_string(&key));
            out.object.items[out.object.count].value = alloc_value(val);
            out.object.count++;
        }
        return out;
    }

    if (strcmp(op, "vec3") == 0) {
        if (n->child_count != 4) {
            fprintf(stderr, "vec3 expects 3 args\n");
            exit(1);
        }
        return tuple3_value(eval(n->children[1]), eval(n->children[2]), eval(n->children[3]));
    }

    if (strcmp(op, "node") == 0) {
        if (n->child_count != 4) {
            fprintf(stderr, "node expects kind, props, children\n");
            exit(1);
        }
        Value kind = eval(n->children[1]);
        Value props = eval(n->children[2]);
        Value children = eval(n->children[3]);
        if (props.type != VAL_OBJECT) props = object_value();
        if (children.type != VAL_LIST) children = list_value();
        return node_value(as_string(&kind), props, children);
    }

    if (strcmp(op, "getp") == 0) {
        Value container = eval(n->children[1]);
        Value keyv = eval(n->children[2]);
        const char *key = as_string(&keyv);

        if (container.type == VAL_OBJECT) {
            return object_get(container, key);
        }

        if (container.type == VAL_NODE) {
            if (strcmp(key, "kind") == 0) return string_value(container.node.kind);
            if (strcmp(key, "children") == 0) return *container.node.children;
            return object_get(*container.node.props, key);
        }

        if (container.type == VAL_TUPLE3) {
            if (strcmp(key, "x") == 0) return *container.tuple3.x;
            if (strcmp(key, "y") == 0) return *container.tuple3.y;
            if (strcmp(key, "z") == 0) return *container.tuple3.z;
            return int_value(0);
        }

        if (container.type == VAL_LIST && (container.list.count % 2) == 0) {
            for (int i = 0; i < container.list.count; i += 2) {
                Value k = *container.list.items[i];
                if (k.type == VAL_STRING && strcmp(k.string, key) == 0) {
                    return *container.list.items[i + 1];
                }
            }
        }

        return int_value(0);
    }

    if (strcmp(op, "setp") == 0) {
        Value container = eval(n->children[1]);
        Value keyv = eval(n->children[2]);
        Value val = eval(n->children[3]);
        const char *key = as_string(&keyv);

        if (container.type == VAL_NODE) {
            Value next_props = object_set(*container.node.props, key, val);
            return node_value(container.node.kind, next_props, *container.node.children);
        }

        return object_set(container, key, val);
    }

    if (strcmp(op, "kind") == 0 || strcmp(op, "type") == 0) {
        Value v = eval(n->children[1]);
        if (v.type == VAL_INT) return string_value("number");
        if (v.type == VAL_LIST) return string_value("list");
        if (v.type == VAL_FN) return string_value("function");
        if (v.type == VAL_STRING) return string_value("string");
        if (v.type == VAL_OBJECT) return string_value("object");
        if (v.type == VAL_NODE) return string_value("node");
        if (v.type == VAL_TUPLE3) return string_value("vec3");
        return string_value("unknown");
    }

    if (strcmp(op, "is_node") == 0) {
        Value v = eval(n->children[1]);
        return int_value(v.type == VAL_NODE ? 1 : 0);
    }

    if (strcmp(op, "children") == 0) {
        Value v = eval(n->children[1]);
        if (v.type == VAL_NODE) return *v.node.children;
        return list_value();
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
        if (xs.type != VAL_LIST || idx < 0 || idx >= xs.list.count) {
            fprintf(stderr, "invalid nth\n");
            exit(1);
        }
        return *xs.list.items[idx];
    }


    if (strcmp(op, "range") == 0) {
        int start = as_int(eval(n->children[1]));
        int end = as_int(eval(n->children[2]));

        Value out = list_value();

        if (end >= start) {
            for (int i = start; i < end; i++) {
                out.list.items[out.list.count++] = alloc_value(int_value(i));
            }
        } else {
            for (int i = start; i > end; i--) {
                out.list.items[out.list.count++] = alloc_value(int_value(i));
            }
        }

        return out;
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
            Node fake = {0};
            fake.type = NODE_LIST;
            fake.child_count = 2;
            fake.children[1] = new_node(NODE_ATOM);
            snprintf(fake.children[1]->atom, MAX_TOKEN_LEN, "__arg");

            int saved_count = var_count;
            env_set("__arg", *xs.list.items[i]);
            Value arg_fn = fn;
            Value result = call_function(arg_fn, &fake);
            var_count = saved_count;

            out.list.items[out.list.count++] = alloc_value(result);
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

        Value out = list_value();
        for (int i = 0; i < xs.list.count; i++) {
            Node fake = {0};
            fake.type = NODE_LIST;
            fake.child_count = 2;
            fake.children[1] = new_node(NODE_ATOM);
            snprintf(fake.children[1]->atom, MAX_TOKEN_LEN, "__arg");

            int saved_count = var_count;
            env_set("__arg", *xs.list.items[i]);
            Value keep = call_function(fn, &fake);
            var_count = saved_count;

            if (as_int(keep)) {
                out.list.items[out.list.count++] = alloc_value(*xs.list.items[i]);
            }
        }
        return out;
    }

    if (strcmp(op, "reduce") == 0) {
        Value fn = eval(n->children[1]);
        Value acc = eval(n->children[2]);
        Value xs = eval(n->children[3]);
        if (xs.type != VAL_LIST) {
            fprintf(stderr, "reduce expects list\n");
            exit(1);
        }

        for (int i = 0; i < xs.list.count; i++) {
            Node fake = {0};
            fake.type = NODE_LIST;
            fake.child_count = 3;
            fake.children[1] = new_node(NODE_ATOM);
            fake.children[2] = new_node(NODE_ATOM);
            snprintf(fake.children[1]->atom, MAX_TOKEN_LEN, "__acc");
            snprintf(fake.children[2]->atom, MAX_TOKEN_LEN, "__item");

            int saved_count = var_count;
            env_set("__acc", acc);
            env_set("__item", *xs.list.items[i]);
            acc = call_function(fn, &fake);
            var_count = saved_count;
        }
        return acc;
    }

    if (strcmp(op, "add") == 0) {
        int sum = 0;
        for (int i = 1; i < n->child_count; i++) sum += as_int(eval(n->children[i]));
        return int_value(sum);
    }

    if (strcmp(op, "sub") == 0) return int_value(as_int(eval(n->children[1])) - as_int(eval(n->children[2])));
    if (strcmp(op, "mul") == 0) return int_value(as_int(eval(n->children[1])) * as_int(eval(n->children[2])));
    if (strcmp(op, "div") == 0) return int_value(as_int(eval(n->children[1])) / as_int(eval(n->children[2])));
    if (strcmp(op, "lt") == 0) return int_value(as_int(eval(n->children[1])) < as_int(eval(n->children[2])) ? 1 : 0);
    if (strcmp(op, "gt") == 0) return int_value(as_int(eval(n->children[1])) > as_int(eval(n->children[2])) ? 1 : 0);
    if (strcmp(op, "eq") == 0) {
        Value a = eval(n->children[1]);
        Value b = eval(n->children[2]);
        if (a.type == VAL_INT && b.type == VAL_INT) {
            return int_value(a.number == b.number ? 1 : 0);
        }
        if (a.type == VAL_STRING && b.type == VAL_STRING) {
            return int_value(strcmp(a.string, b.string) == 0 ? 1 : 0);
        }
        return int_value(0);
    }
    if (strcmp(op, "and") == 0) return int_value((as_int(eval(n->children[1])) != 0 && as_int(eval(n->children[2])) != 0) ? 1 : 0);
    if (strcmp(op, "or") == 0) return int_value((as_int(eval(n->children[1])) != 0 || as_int(eval(n->children[2])) != 0) ? 1 : 0);

    return call_function(env_get(op), n);
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
    fread(buf, 1, size, f);
    buf[size] = 0;
    fclose(f);
    return buf;
}


static void print_value(Value v) {
    if (v.type == VAL_INT) {
        printf("%d", v.number);
        return;
    }

    if (v.type == VAL_STRING) {
        printf("\"%s\"", v.string);
        return;
    }

    if (v.type == VAL_LIST) {
        printf("[");
        for (int i = 0; i < v.list.count; i++) {
            if (i) printf(",");
            print_value(*v.list.items[i]);
        }
        printf("]");
        return;
    }

    if (v.type == VAL_FN) {
        printf("<fn>");
        return;
    }

    if (v.type == VAL_OBJECT) {
        printf("{object %d}", v.object.count);
        return;
    }

    if (v.type == VAL_NODE) {
        printf("{node %s}", v.node.kind);
        return;
    }

    if (v.type == VAL_TUPLE3) {
        printf("[");
        print_value(*v.tuple3.x);
        printf(",");
        print_value(*v.tuple3.y);
        printf(",");
        print_value(*v.tuple3.z);
        printf("]");
        return;
    }
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
        else if (result.type == VAL_STRING) printf("Result: %s\n", result.string);
        else if (result.type == VAL_OBJECT) printf("Result: <object keys=%d>\n", result.object.count);
        else if (result.type == VAL_NODE) printf("Result: <node kind=%s>\n", result.node.kind);
        else if (result.type == VAL_TUPLE3) {
            printf("Result: ");
            print_value(result);
            printf("\n");
        }
    }

    free_ast(ast);
    free(src);
    return 0;
}
