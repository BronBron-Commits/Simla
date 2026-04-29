CC ?= cc
CFLAGS ?= -Wall -Wextra -std=c11

SIMLA = simla
COMPILE_TEST = compile_test

all: $(SIMLA) $(COMPILE_TEST)

$(SIMLA): simla.c
	$(CC) $(CFLAGS) -o $(SIMLA) simla.c

$(COMPILE_TEST): vm.c compile_test.c bytecode.h
	$(CC) $(CFLAGS) vm.c compile_test.c -o $(COMPILE_TEST)

test:
	cd .. && ./c-simla/run_tests.sh

bytecode:
	cd .. && ./c-simla/run_bytecode_tests.sh

parity:
	cd .. && ./c-simla/run_parity_tests.sh

errors:
	cd .. && ./c-simla/run_error_tests.sh

check: test bytecode parity errors

clean:
	rm -f $(SIMLA) $(COMPILE_TEST) vm_test

.PHONY: all test bytecode parity errors check clean
