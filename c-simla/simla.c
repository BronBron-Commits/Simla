#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_TOKENS 4096
#define MAX_TOKEN_LEN 128

typedef struct {
    char text[MAX_TOKEN_LEN];
} Token;

typedef struct {
    Token tokens[MAX_TOKENS];
    int count;
} TokenList;

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

    printf("Simλ C tokenizer OK\n");
    printf("tokens: %d\n\n", tokens.count);

    for (int i = 0; i < tokens.count; i++) {
        printf("[%03d] %s\n", i, tokens.tokens[i].text);
    }

    free(src);
    return 0;
}
